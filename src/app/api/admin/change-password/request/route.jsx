export const runtime = 'nodejs'

import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { sendEmail } from '@/lib/mail'
import {
  PASSWORD_CHANGE_CODE_TTL_MINUTES,
  generatePasswordChangeCode,
  getPasswordChangeExpiryDate,
  hashPasswordChangeCode,
} from '@/lib/password-change'

const RequestPasswordChangeSchema = z.object({
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters' }),
})

export async function POST(request) {
  try {
    const session = await requireAdmin()

    const body = await request.json()
    const validation = RequestPasswordChangeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { newPassword } = validation.data

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10)
    const code = generatePasswordChangeCode()
    const expiresAt = getPasswordChangeExpiryDate()

    await prisma.$transaction([
      prisma.passwordChangeVerification.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      }),
      prisma.passwordChangeVerification.create({
        data: {
          userId: user.id,
          newPasswordHash,
          codeHash: hashPasswordChangeCode(code),
          expiresAt,
        },
      }),
    ])

    const subject = 'Your password change verification code'
    const text = `Use this verification code to change your admin password: ${code}. This code expires in ${PASSWORD_CHANGE_CODE_TTL_MINUTES} minutes.`
    const html = `
      <p>Use this verification code to change your admin password:</p>
      <p style="font-size:24px;font-weight:700;letter-spacing:0.25em;">${code}</p>
      <p>This code expires in ${PASSWORD_CHANGE_CODE_TTL_MINUTES} minutes.</p>
    `

    const emailSent = await sendEmail({
      to: user.email,
      subject,
      text,
      html,
    })

    if (!emailSent && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      expiresInMinutes: PASSWORD_CHANGE_CODE_TTL_MINUTES,
    })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }

    console.error('[Admin ChangePassword Request] Error:', error)
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
  }
}
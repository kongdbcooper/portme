export const runtime = 'nodejs'

import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { sendEmail } from '@/lib/mail'
import {
  EMAIL_CHANGE_CODE_TTL_MINUTES,
  generateEmailChangeCode,
  getEmailChangeExpiryDate,
  hashEmailChangeCode,
  maskEmailAddress,
} from '@/lib/email-change'

const RequestEmailChangeSchema = z.object({
  newEmail: z.string().trim().email({ message: 'Please provide a valid email address' }),
  currentPassword: z.string().min(1, { message: 'Please provide your current password' }),
})

export async function POST(request) {
  try {
    const session = await requireAdmin()

    const body = await request.json()
    const validation = RequestEmailChangeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const normalizedEmail = validation.data.newEmail.toLowerCase()

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, passwordHash: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (normalizedEmail === user.email.toLowerCase()) {
      return NextResponse.json({ error: 'New email must be different from the current email' }, { status: 400 })
    }

    const passwordMatch = await bcrypt.compare(validation.data.currentPassword, user.passwordHash)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const existingEmailOwner = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })

    if (existingEmailOwner) {
      return NextResponse.json({ error: 'This email is already in use' }, { status: 409 })
    }

    const code = generateEmailChangeCode()
    const expiresAt = getEmailChangeExpiryDate()

    await prisma.$transaction([
      prisma.emailChangeVerification.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      }),
      prisma.emailChangeVerification.create({
        data: {
          userId: user.id,
          newEmail: normalizedEmail,
          codeHash: hashEmailChangeCode(code),
          expiresAt,
        },
      }),
    ])

    const subject = 'Your email change verification code'
    const text = `Use this verification code to change your admin email: ${code}. This code expires in ${EMAIL_CHANGE_CODE_TTL_MINUTES} minutes.`
    const html = `
      <p>Use this verification code to change your admin email:</p>
      <p style="font-size:24px;font-weight:700;letter-spacing:0.25em;">${code}</p>
      <p>This code expires in ${EMAIL_CHANGE_CODE_TTL_MINUTES} minutes.</p>
    `

    const emailSent = await sendEmail({
      to: normalizedEmail,
      subject,
      text,
      html,
    })

    if (!emailSent && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      targetEmail: maskEmailAddress(normalizedEmail),
      expiresInMinutes: EMAIL_CHANGE_CODE_TTL_MINUTES,
    })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }

    console.error('[Admin ChangeEmail Request] Error:', error)
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
  }
}

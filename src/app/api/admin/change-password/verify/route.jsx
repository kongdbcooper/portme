export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { sendEmail } from '@/lib/mail'
import { createSession } from '@/lib/session'
import { hashPasswordChangeCode } from '@/lib/password-change'

const VerifyPasswordChangeSchema = z.object({
  code: z.string().min(6, { message: 'Please provide the 6-digit code' }),
})

export async function POST(request) {
  try {
    const session = await requireAdmin()

    const body = await request.json()
    const validation = VerifyPasswordChangeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { code } = validation.data

    const verification = await prisma.passwordChangeVerification.findFirst({
      where: {
        userId: session.userId,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!verification) {
      return NextResponse.json({ error: 'No valid verification request found. Please request a new password change.' }, { status: 400 })
    }

    const codeHash = hashPasswordChangeCode(code)
    if (codeHash !== verification.codeHash) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 })
    }

    await prisma.$transaction([
      prisma.passwordChangeVerification.update({
        where: { id: verification.id },
        data: { used: true, verifiedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: session.userId },
        data: {
          passwordHash: verification.newPasswordHash,
          sessionVersion: { increment: 1 },
        },
      }),
    ])

    const updatedUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, role: true, sessionVersion: true },
    })

    // Notify user via email that password was changed
    try {
      if (updatedUser?.email) {
        await sendEmail({
          to: updatedUser.email,
          subject: 'Your password was changed',
          text: 'Your account password was recently changed. If this was not you, please contact support immediately.',
        })
      }
    } catch (err) {
      console.error('[ChangePassword Verify] Email notification failed:', err)
    }

    // Issue a new session cookie for the current client
    try {
      await createSession(updatedUser.id, session.role || updatedUser.role, updatedUser.email, updatedUser.sessionVersion || 0)
    } catch (err) {
      console.error('[ChangePassword Verify] Failed to create new session:', err)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }

    console.error('[Admin ChangePassword Verify] Error:', error)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}
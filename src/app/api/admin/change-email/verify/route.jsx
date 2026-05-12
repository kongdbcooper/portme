export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { sendEmail } from '@/lib/mail'
import { createSession } from '@/lib/session'
import { hashEmailChangeCode } from '@/lib/email-change'

const VerifyEmailChangeSchema = z.object({
  newEmail: z.string().trim().email({ message: 'Please provide a valid email address' }),
  code: z.string().trim().regex(/^\d{6}$/, { message: 'Verification code must be 6 digits' }),
})

export async function POST(request) {
  try {
    const session = await requireAdmin()

    const body = await request.json()
    const validation = VerifyEmailChangeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const normalizedEmail = validation.data.newEmail.toLowerCase()
    const codeHash = hashEmailChangeCode(validation.data.code)

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, role: true, sessionVersion: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const verification = await prisma.emailChangeVerification.findFirst({
      where: {
        userId: user.id,
        newEmail: normalizedEmail,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!verification || verification.codeHash !== codeHash) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 })
    }

    const existingEmailOwner = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })

    if (existingEmailOwner && existingEmailOwner.id !== user.id) {
      return NextResponse.json({ error: 'This email is already in use' }, { status: 409 })
    }

    const previousEmail = user.email

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { email: normalizedEmail },
        select: { id: true, email: true, role: true, sessionVersion: true },
      }),
      prisma.emailChangeVerification.update({
        where: { id: verification.id },
        data: { used: true, verifiedAt: new Date() },
      }),
      prisma.emailChangeVerification.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      }),
    ])

    try {
      await createSession(
        updatedUser.id,
        updatedUser.role,
        updatedUser.email,
        updatedUser.sessionVersion || 0
      )
    } catch (err) {
      console.error('[Admin ChangeEmail Verify] Failed to refresh session:', err)
    }

    try {
      await sendEmail({
        to: updatedUser.email,
        subject: 'Your admin email has been verified',
        text: `Your admin email has been updated successfully to ${updatedUser.email}.`,
        html: `<p>Your admin email has been updated successfully to <strong>${updatedUser.email}</strong>.</p>`,
      })

      await sendEmail({
        to: previousEmail,
        subject: 'Your admin email was changed',
        text: `Your admin email was changed from ${previousEmail} to ${updatedUser.email}. If this was not you, please secure your account immediately.`,
        html: `<p>Your admin email was changed from <strong>${previousEmail}</strong> to <strong>${updatedUser.email}</strong>.</p><p>If this was not you, please secure your account immediately.</p>`,
      })
    } catch (err) {
      console.error('[Admin ChangeEmail Verify] Notification email failed:', err)
    }

    return NextResponse.json({
      success: true,
      email: updatedUser.email,
    })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }

    console.error('[Admin ChangeEmail Verify] Error:', error)
    return NextResponse.json({ error: 'Failed to verify email change' }, { status: 500 })
  }
}

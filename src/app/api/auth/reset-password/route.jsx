export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/mail'
import { createSession } from '@/lib/session'

const ResetSchema = z.object({ token: z.string().min(1), newPassword: z.string().min(8) })

export async function POST(request) {
  try {
    const body = await request.json()
    const validation = ResetSchema.safeParse(body)
    if (!validation.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const { token, newPassword } = validation.data

    const record = await prisma.passwordResetToken.findUnique({ where: { token }, include: { user: true } })
    if (!record) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    if (record.used) return NextResponse.json({ error: 'Token already used' }, { status: 400 })
    if (new Date(record.expiresAt) < new Date()) return NextResponse.json({ error: 'Token expired' }, { status: 400 })

    const hash = await bcrypt.hash(newPassword, 10)
    const updated = await prisma.user.update({ where: { id: record.userId }, data: { passwordHash: hash, sessionVersion: { increment: 1 } }, select: { id: true, email: true, role: true, sessionVersion: true } })
    await prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } })

    // Notify user
    try {
      if (updated?.email) {
        await sendEmail({
          to: updated.email,
          subject: 'Your password was reset',
          text: 'Your account password was recently reset. If this was not you, please contact support immediately.',
        })
      }
    } catch (err) {
      console.error('[ResetPassword] Email notification failed:', err)
    }

    // Create session so user stays logged-in after resetting password
    try {
      await createSession(updated.id, updated.role, updated.email, updated.sessionVersion || 0)
    } catch (err) {
      console.error('[ResetPassword] Failed to create session after reset:', err)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[ResetPassword] Error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

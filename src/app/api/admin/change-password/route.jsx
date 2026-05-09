export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { sendEmail } from '@/lib/mail'
import { createSession } from '@/lib/session'

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Please provide current password' }),
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters' }),
})

export async function POST(request) {
  try {
    const session = await requireAdmin()

    const body = await request.json()
    const validation = ChangePasswordSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten().fieldErrors }, { status: 400 })
    }

    const { currentPassword, newPassword } = validation.data

    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { passwordHash: true } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!match) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const newHash = await bcrypt.hash(newPassword, 10)
    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: newHash, sessionVersion: { increment: 1 } },
      select: { id: true, email: true, role: true, sessionVersion: true },
    })

    // Notify user via email that password was changed
    try {
      if (updated?.email) {
        await sendEmail({
          to: updated.email,
          subject: 'Your password was changed',
          text: 'Your account password was recently changed. If this was not you, please contact support immediately.',
        })
      }
    } catch (err) {
      console.error('[ChangePassword] Email notification failed:', err)
    }

    // Issue a new session cookie for the current client so the page stays logged-in
    try {
      await createSession(updated.id, session.role || updated.role, updated.email, updated.sessionVersion || 0)
    } catch (err) {
      console.error('[ChangePassword] Failed to create new session:', err)
    }

    // Return success (do NOT return plaintext passwords)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    console.error('[Admin ChangePassword] Error:', error)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/mail'

const ForgotSchema = z.object({ email: z.string().email() })

export async function POST(request) {
  try {
    const body = await request.json()
    const validation = ForgotSchema.safeParse(body)
    if (!validation.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })

    const { email } = validation.data
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

    // Always respond success to avoid user enumeration
    if (!user) return NextResponse.json({ success: true })

    const token = crypto.randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } })

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/reset-password?token=${token}`
    const subject = 'Password reset request'
    const text = `To reset your password, open the link: ${resetUrl}`
    const html = `<p>To reset your password, click the link below (valid 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`

    await sendEmail({ to: user.email, subject, text, html })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[ForgotPassword] Error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

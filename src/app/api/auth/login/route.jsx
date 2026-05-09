// =============================================================================
// src/app/api/auth/login/route.js — Login API Route
// รับ credentials จาก login form ตรวจสอบกับ database แล้วสร้าง session
// ใช้งานร่วมกับ: src/lib/prisma.js, src/lib/session.js
// POST /api/auth/login
// =============================================================================


export const runtime = 'nodejs';
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/session'
import { rateLimit } from '@/lib/rate-limit'

// Schema สำหรับ validate request body
const LoginSchema = z.object({
  email: z.email({ error: 'กรุณาระบุ email ที่ถูกต้อง' }),
  password: z.string().min(1, { error: 'กรุณาระบุ password' }),
})

export async function POST(request) {
  // ------------------- Rate Limiting -------------------
  const { success } = await rateLimit(request, 10) // 10 attempts per minute
  if (!success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()

    // ------------------- Validate Input -------------------
    const validation = LoginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // ------------------- Find User -------------------
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, passwordHash: true, role: true, name: true, sessionVersion: true },
    })

    // ตรวจสอบ user และ password (ใช้เวลาเท่ากันเพื่อป้องกัน timing attack)
    const passwordMatch = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, '$2b$10$invalidhashfortimingreasonxxx')

    if (!user || !passwordMatch) {
      return NextResponse.json(
        { error: 'Email หรือ Password ไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // ------------------- Create Session -------------------
    console.log(`[Login] Creating session for user: ${user.email} (role: ${user.role})`)
    await createSession(user.id, user.role, user.email, user.sessionVersion || 0)
    console.log(`[Login] Session created successfully for ${user.email}`)

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
      // Redirect URL ตาม role
      redirectTo: user.role === 'ADMIN' ? '/admin' : '/',
    })

  } catch (error) {
    console.error('[Auth] Login error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    )
  }
}

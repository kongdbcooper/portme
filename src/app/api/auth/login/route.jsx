// =============================================================================
// src/app/api/auth/login/route.js — Login API Route
// =============================================================================

export const runtime = 'nodejs';
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs' // ใช้ bcryptjs ตามที่ส่วนใหญ่ติดตั้ง
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/session'

// Schema สำหรับ validate request body
const LoginSchema = z.object({
  email: z.string().email({ message: 'กรุณาระบุ email ที่ถูกต้อง' }),
  password: z.string().min(1, { message: 'กรุณาระบุ password' }),
})

export async function POST(request) {
  // หมายเหตุ: ปิด rateLimit ไว้ชั่วคราวเพื่อป้องกัน Error 500 หากยังไม่ได้ตั้งค่าระบบ library
  /*
  const { success } = await rateLimit(request, 10) 
  if (!success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    )
  }
  */

  try {
    const body = await request.json()

    // 1. Validate ข้อมูลที่ส่งมา
    const validation = LoginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // 2. ค้นหา User ในฐานข้อมูล (ใช้ passwordHash ตาม Schema)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { 
        id: true, 
        email: true, 
        passwordHash: true, // ตรวจสอบว่าใน schema.prisma ชื่อนี้
        role: true, 
        name: true, 
        sessionVersion: true 
      },
    })

    // 3. ตรวจสอบรหัสผ่าน
    // ถ้าไม่เจอ user จะเอา password ไปเทียบกับ hash หลอกๆ เพื่อป้องกัน Timing Attack
    const passwordMatch = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, '$2b$10$invalidhashfortimingreasonxxx')

    if (!user || !passwordMatch) {
      return NextResponse.json(
        { error: 'Email หรือ Password ไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // 4. สร้าง Session (Cookie)
    console.log(`[Login] Creating session for user: ${user.email} (role: ${user.role})`)
    
    // ตรวจสอบว่าฟังก์ชัน createSession ใน lib/session.js ของคุณรับค่าตามนี้
    await createSession(user.id, user.role, user.email, user.sessionVersion || 0)
    
    console.log(`[Login] Session created successfully for ${user.email}`)

    // 5. ส่งผลลัพธ์กลับ
    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
      redirectTo: user.role === 'ADMIN' ? '/admin' : '/',
    })

  } catch (error) {
    console.error('[Auth] Login error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดที่ Server: ' + error.message },
      { status: 500 }
    )
  }
}
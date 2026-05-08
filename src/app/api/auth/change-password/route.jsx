// =============================================================================
// src/app/api/auth/change-password/route.js — Change Password API
// ให้ Admin เปลี่ยนรหัสผ่านได้อย่างปลอดภัย (ต้อง login แล้วเท่านั้น)
// ใช้งานร่วมกับ: src/lib/auth.js, src/lib/prisma.js
// POST /api/auth/change-password
// =============================================================================

export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'กรุณาระบุรหัสผ่านปัจจุบัน'),
  newPassword: z
    .string()
    .min(8, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร')
    .max(128, 'รหัสผ่านยาวเกินไป')
    .regex(/[A-Z]/, 'ต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว')
    .regex(/[a-z]/, 'ต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว')
    .regex(/[0-9]/, 'ต้องมีตัวเลขอย่างน้อย 1 ตัว'),
})

export async function POST(request) {
  // Rate limit: 5 attempts per minute
  const { success } = await rateLimit(request, 5)
  if (!success) {
    return NextResponse.json(
      { error: 'คำขอมากเกินไป กรุณารอสักครู่' },
      { status: 429 }
    )
  }

  try {
    // ต้อง login เป็น Admin ก่อน
    const session = await requireAdmin()

    const body = await request.json()
    const validation = ChangePasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = validation.data

    // ดึง user จาก DB
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, passwordHash: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 })
    }

    // ตรวจสอบรหัสผ่านปัจจุบัน
    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isCurrentValid) {
      return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 401 })
    }

    // ห้ามใช้รหัสเดิม
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash)
    if (isSamePassword) {
      return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องไม่เหมือนรหัสเดิม' }, { status: 400 })
    }

    // Hash รหัสผ่านใหม่ด้วย bcrypt cost 12 (stronger than default 10)
    const newHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    })

    console.log(`[Auth] Password changed successfully for user: ${session.email}`)

    return NextResponse.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ',
    })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 403 })
    }
    console.error('[Auth] Change password error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' },
      { status: 500 }
    )
  }
}

// src/app/api/auth/force-reset/route.jsx

export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs' 

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, newPassword } = body

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    // เข้ารหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // แก้ไขตรงนี้: เปลี่ยนจาก password เป็น passwordHash ตาม Schema ของคุณ
    const updatedUser = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { 
        passwordHash: hashedPassword // ใช้ชื่อให้ตรงกับ model User ใน schema.prisma
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Reset password for ${updatedUser.email} successfully!` 
    })

  } catch (err) {
    console.error('[ForceReset] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
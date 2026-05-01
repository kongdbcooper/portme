// =============================================================================
// src/app/api/settings/route.js — Public Site Settings API
// ดึงข้อมูลการตั้งค่าเว็บไซต์ เช่น Background ของ Hero Section, ข้อความต่างๆ
// =============================================================================

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { revalidateTag } from 'next/cache'

// เราไม่ต้องใช้ force-dynamic ใน route นี้ เพราะ Next.js จะจัดการเรื่อง cache ตามที่เรากำหนด
export const runtime = 'nodejs'

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany()
    
    // แปลง array เป็น key-value object
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {})

    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error('[Settings] Fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update or create a setting (Admin only)
export async function PUT(request) {
  try {
    await requireAdmin()
    
    const body = await request.json()
    const { key, value } = body
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    // Upsert the setting
    const setting = await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })

    // Invalidate the cache for site-settings
    revalidateTag('site-settings')

    return NextResponse.json({ success: true, setting })
  } catch (error) {
    console.error('[Settings API] PUT Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update setting' }, 
      { status: error.message?.includes('Unauthorized') ? 403 : 500 }
    )
  }
}

// =============================================================================
// src/app/api/admin/settings/route.js — Admin Settings API
// บันทึกการตั้งค่าเว็บไซต์ (Admin Only)
// =============================================================================

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function POST(request) {
  try {
    // ------------------- Check Auth -------------------
    await requireAdmin()

    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and Value are required' }, { status: 400 })
    }

    // ------------------- Save Setting -------------------
    const setting = await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    return NextResponse.json({
      success: true,
      data: setting,
    })

  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    console.error('[Admin Settings] Save error:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}

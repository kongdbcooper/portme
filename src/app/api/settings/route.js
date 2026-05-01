// =============================================================================
// src/app/api/settings/route.js — Public Site Settings API
// ดึงข้อมูลการตั้งค่าเว็บไซต์ เช่น Background ของ Hero Section
// =============================================================================

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
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

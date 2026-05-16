// =============================================================================
// src/app/api/banners/route.js — Public Banners API
// ดึงข้อมูล Banner สำหรับหน้าแรก (Hero, Profile)
// =============================================================================

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    const where = {
      isActive: true,
      ...(type ? { type } : {})
    }
    
    const banners = await prisma.banner.findMany({
      where,
      orderBy: { order: 'asc' },
    })
    
    return new NextResponse(JSON.stringify(banners), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('[Banners API] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}

// =============================================================================
// src/app/api/ab-test/route.js — A/B Test Event Tracking API
// บันทึก event การ view/click/conversion สำหรับ A/B testing
// ใช้งานร่วมกับ: src/lib/ab-test.js, src/lib/prisma.js
// POST /api/ab-test — track event
// GET /api/ab-test?productId=xxx — ดู stats (admin)
// =============================================================================

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { trackABEvent, getABStats } from '@/lib/ab-test'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'

// Schema สำหรับ track event
const TrackEventSchema = z.object({
  productId: z.string().min(1),
  variant: z.enum(['A', 'B', 'C']),
  eventType: z.enum(['VIEW', 'CLICK', 'CONVERSION']),
  sessionId: z.string().optional(),
})

// ------------------- POST: Track Event -------------------
export async function POST(request) {
  try {
    const body = await request.json()
    const validation = TrackEventSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid event data' }, { status: 400 })
    }

    const { productId, variant, eventType, sessionId } = validation.data

    // บันทึก event (fire and forget — ไม่ block response)
    await trackABEvent(prisma, productId, variant, eventType, sessionId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[A/B Test] Track error:', error)
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}

// ------------------- GET: Get Stats (Admin only) -------------------
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 })
    }

    const stats = await getABStats(prisma, productId)
    return NextResponse.json({ stats })

  } catch (error) {
    console.error('[A/B Test] Stats error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

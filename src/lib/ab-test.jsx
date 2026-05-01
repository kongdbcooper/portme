// =============================================================================
// src/lib/ab-test.js — A/B Testing Logic (Server-Side)
// กำหนด variant (A หรือ B) ให้กับ user โดยใช้ cookies
// ใช้งานร่วมกับ: src/app/api/ab-test/route.js, src/components/sections/ProductSection.js
// =============================================================================

import { cookies } from 'next/headers'

const AB_COOKIE_NAME = 'ab_variant'
const AB_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 วัน (seconds)

// ------------------- Get or Assign A/B Variant -------------------
// ดึง variant ที่ user เคยได้รับ หรือกำหนด variant ใหม่แบบ random 50/50
// ต้องเรียกใน Server Component หรือ Route Handler เท่านั้น
export async function getABVariant() {
  const cookieStore = await cookies()
  const existingVariant = cookieStore.get(AB_COOKIE_NAME)?.value

  // ถ้ามี variant อยู่แล้ว ใช้ต่อเลย (consistent experience)
  if (existingVariant === 'A' || existingVariant === 'B') {
    return existingVariant
  }

  // กำหนด variant ใหม่แบบ random 50/50 (สำหรับกรณีไม่มี cookie)
  // หมายเหตุ: การ set cookie ย้ายไปทำที่ middleware.js เพราะ Server Component set cookie ไม่ได้
  return Math.random() < 0.5 ? 'A' : 'B'
}

// ------------------- Track A/B Event -------------------
// บันทึก event (VIEW, CLICK, CONVERSION) ลง database
// ใช้ใน API route: /api/ab-test
export async function trackABEvent(prisma, productId, variant, eventType, sessionId) {
  try {
    await prisma.aBTestEvent.create({
      data: {
        productId,
        variant,
        eventType,
        sessionId,
      },
    })
  } catch (error) {
    console.error('[A/B Test] Failed to track event:', error)
  }
}

// ------------------- Get A/B Test Stats -------------------
// ดึงสถิติ A/B test สำหรับ admin dashboard
export async function getABStats(prisma, productId) {
  const events = await prisma.aBTestEvent.groupBy({
    by: ['variant', 'eventType'],
    where: { productId },
    _count: { id: true },
  })

  // จัดรูปแบบข้อมูลสำหรับแสดง
  const stats = { A: { VIEW: 0, CLICK: 0, CONVERSION: 0 }, B: { VIEW: 0, CLICK: 0, CONVERSION: 0 } }

  for (const event of events) {
    stats[event.variant][event.eventType] = event._count.id
  }

  return stats
}

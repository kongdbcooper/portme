import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'

// ------------------- Get Fresh Settings (No Cache) -------------------
export async function getFreshSettings() {
  try {
    // ดึงข้อมูลโดยกำหนด timeout เพื่อไม่ให้ค้างนานเกินไปถ้า DB ล่ม
    const settings = await prisma.siteSetting.findMany({
      // หมายเหตุ: Prisma adapter-pg อาจจะไม่รองรับ timeout ใน findMany โดยตรง 
      // แต่การจัดการที่ Pool ใน prisma.js จะช่วยตัดการทำงานที่ค้างได้
    })

    if (!settings || settings.length === 0) return {}

    return settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {})
  } catch (error) {
    // ถ้า DB มีปัญหา (เช่น Max Connections) ให้ Log บอก และคืนค่า {} เพื่อให้เว็บทำงานต่อได้
    console.error('[Settings] Fresh fetch failed (Database Issue):', error.message)
    return {} 
  }
}

// ------------------- Get Cached Settings -------------------
export const getCachedSettings = unstable_cache(
  async () => {
    return getFreshSettings()
  },
  ['site-settings-cache-v3'], 
  {
    revalidate: 60, // เก็บ Cache ไว้ 60 วินาที ลดภาระการยิง DB
    tags: ['site-settings'],
  }
)

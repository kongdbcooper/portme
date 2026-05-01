// =============================================================================
// src/app/page.js — Landing Page (Public Homepage)
// หน้าหลักของเว็บ ประกอบด้วย 3 sections: Hero, Products, Contact
// ใช้งานร่วมกับ: src/components/sections/HeroSection.js
//               src/components/sections/ProductSection.js
//               src/components/sections/ContactSection.js
//               src/lib/ab-test.js (Server-side A/B variant assignment)
// =============================================================================

import { getABVariant } from '@/lib/ab-test'
import { getCachedSettings } from '@/lib/settings'
import { prisma } from '@/lib/prisma'

import HeroSection from '@/components/sections/HeroSection'
import ProductSection from '@/components/sections/ProductSection'
import ContactSection from '@/components/sections/ContactSection'

// ------------------- SEO Metadata -------------------
export const metadata = {
  title: 'PortMe — แพลตฟอร์มจัดการโปรดักซ์ยุคใหม่',
  description:
    'แพลตฟอร์มจัดการโปรดักซ์สำหรับธุรกิจยุคใหม่ พร้อม Admin Dashboard ' +
    'ที่ครบครัน อัปโหลดรูปภาพสู่ Cloudflare R2 อัตโนมัติ และ A/B Testing',
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL,
  },
}

/**
 * HomePage — Server Component
 * กำหนด A/B variant ฝั่ง server แล้วส่งไปยัง ProductSection
 */
export default async function HomePage() {
  // ดึง A/B variant สำหรับ user นี้ (server-side)
  const abVariant = await getABVariant()

  // ดึงการตั้งค่าเว็บไซต์ทั้งหมด (ผ่าน cache 5 นาที)
  const settingsMap = await getCachedSettings()

  // ดึงวิดีโอที่เปิดใช้งาน
  const videos = await prisma.video.findMany({
    where: { isActive: true },
    orderBy: [
      { order: 'asc' },
      { createdAt: 'desc' },
    ]
  })

  return (
    <>
      {/* Section 1: Hero */}
      <HeroSection settings={settingsMap} />

      {/* Section 2: Products */}
      <ProductSection abVariant={abVariant} settings={settingsMap} />

      {/* Section 3: Contact / Video Showcase */}
      <ContactSection settings={settingsMap} videos={videos} />
    </>
  )
}

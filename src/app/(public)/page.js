// =============================================================================
// src/app/page.js — Landing Page (Public Homepage)
// หน้าหลักของเว็บ ประกอบด้วย 3 sections: Hero, Products, Contact
// ใช้งานร่วมกับ: src/components/sections/HeroSection.js
//               src/components/sections/ProductSection.js
//               src/components/sections/ContactSection.js
//               src/lib/ab-test.js (Server-side A/B variant assignment)
// =============================================================================

import { getABVariant } from '@/lib/ab-test'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
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

  // ดึงการตั้งค่าเว็บไซต์ (Background Hero)
  const settings = await prisma.siteSetting.findMany()
  const settingsMap = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value
    return acc
  }, {})

  return (
    <>
      {/* Section 1: Hero (ส่ง background จาก DB ไปแสดง) */}
      <HeroSection backgroundUrl={settingsMap.hero_background_url} />

      {/* Section 2: Products (พร้อม A/B variant) */}
      <ProductSection abVariant={abVariant} />

      {/* Section 3: Contact */}
      <ContactSection />
    </>
  )
}

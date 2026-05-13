// =============================================================================
// src/app/page.js — Landing Page (Public Homepage)
// หน้าหลักของเว็บ ประกอบด้วย 3 sections: Hero, Products, Contact
// ใช้งานร่วมกับ: src/components/sections/HeroSection.js
//               src/components/sections/ProductSection.js
//               src/components/sections/ContactSection.js
//               src/lib/ab-test.js (Server-side A/B variant assignment)
// =============================================================================

import { getABVariant } from '@/lib/ab-test'
import { getFreshSettings } from '@/lib/settings'
import { getFreshProducts, getFreshVideos } from '@/lib/data'

import HeroSection from '@/components/sections/HeroSection'
import ProfileSection from '@/components/sections/ProfileSection'
import ProductSection from '@/components/sections/ProductSection'
import VideoSection from '@/components/sections/VideoSection'
import ContactSection from '@/components/sections/ContactSection'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ------------------- SEO Metadata -------------------
export const metadata = {
  title: 'Monkey — แพลตฟอร์มจัดการโปรดักซ์ยุคใหม่',
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

  const settingsMap = await getFreshSettings()

  if (process.env.NODE_ENV === 'development') {
    console.log('[HomePage] Settings keys:', Object.keys(settingsMap))
  }

  const [products, videos] = await Promise.all([
    getFreshProducts(),
    getFreshVideos(),
  ])

  return (
    <>
      {/* Section 1: Hero */}
      <HeroSection settings={settingsMap} />

      {/* Section 1.5: Profile (About Me) */}
      <ProfileSection settings={settingsMap} />

      {/* Section 2: Products */}
      <ProductSection abVariant={abVariant} settings={settingsMap} initialProducts={products} />

      {/* Section 3: Videos */}
      <VideoSection initialVideos={videos} />

      {/* Section 4: Contact */}
      <ContactSection settings={settingsMap} videos={videos} />
    </>
  )
}

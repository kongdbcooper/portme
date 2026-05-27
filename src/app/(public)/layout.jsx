// =============================================================================
// src/app/(public)/layout.js — Public Pages Layout
// ใช้สำหรับหน้า Landing Page และหน้าสาธารณะอื่นๆ
// รวม Navbar และ Footer เฉพาะหน้าที่ไม่ใช่ Admin
// =============================================================================

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GlobalImageZoom from '@/components/layout/GlobalImageZoom'
import { getFreshSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export default async function PublicLayout({ children }) {
  const settings = await getFreshSettings()

  return (
    <>
      <Navbar settings={settings} />
      <main>{children}</main>
      <Footer settings={settings} />
      <GlobalImageZoom />
    </>
  )
}

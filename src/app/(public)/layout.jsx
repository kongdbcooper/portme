// =============================================================================
// src/app/(public)/layout.js — Public Pages Layout
// ใช้สำหรับหน้า Landing Page และหน้าสาธารณะอื่นๆ
// รวม Navbar และ Footer เฉพาะหน้าที่ไม่ใช่ Admin
// =============================================================================

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getCachedSettings } from '@/lib/settings'

export default async function PublicLayout({ children }) {
  const settings = await getCachedSettings()

  return (
    <>
      <Navbar settings={settings} />
      <main>{children}</main>
      <Footer settings={settings} />
    </>
  )
}

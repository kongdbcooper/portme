// =============================================================================
// src/app/(public)/layout.js — Public Pages Layout
// ใช้สำหรับหน้า Landing Page และหน้าสาธารณะอื่นๆ
// รวม Navbar และ Footer เฉพาะหน้าที่ไม่ใช่ Admin
// =============================================================================

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}

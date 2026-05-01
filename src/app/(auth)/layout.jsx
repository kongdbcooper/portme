// =============================================================================
// src/app/(auth)/layout.js — Auth Layout
// Layout สำหรับหน้า auth (/login) — ไม่แสดง Navbar/Footer
// ใช้งานร่วมกับ: src/app/(auth)/login/page.js
// =============================================================================

export default function AuthLayout({ children }) {
  return (
    // ไม่มี Navbar/Footer — แยกจาก root layout
    <div className="min-h-screen bg-surface-900">
      {children}
    </div>
  )
}

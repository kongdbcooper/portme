// =============================================================================
// src/app/admin/layout.js — Admin Dashboard Layout
// Layout สำหรับ /admin/* — มี Sidebar แต่ไม่มี Public Navbar/Footer
// ตรวจสอบ session และ redirect ถ้าไม่ใช่ Admin
// ใช้งานร่วมกับ: src/components/admin/Sidebar.js, src/lib/auth.js
//               src/middleware.js (route protection เบื้องต้น)
// =============================================================================

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCachedSettings } from '@/lib/settings'
import Sidebar from '@/components/admin/Sidebar'

export const metadata = {
  title: {
    default: 'Admin Dashboard | PortMe',
    template: '%s | Admin — PortMe',
  },
  robots: { index: false, follow: false }, // ไม่ให้ Google index หน้า admin
}

/**
 * AdminLayout — Server Component
 * ตรวจสอบ session ฝั่ง server ก่อน render
 * middleware.js ตรวจสอบเบื้องต้นแล้ว แต่ layout ตรวจซ้ำเพื่อ defense-in-depth
 */
export default async function AdminLayout({ children }) {
  const session = await getSession()
  const settings = await getCachedSettings()

  // Double-check: ถ้าไม่ใช่ Admin redirect ออก
  if (!session || session.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    // ไม่ใช้ root layout navbar/footer — admin มี layout แยก
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Sidebar */}
      <Sidebar user={{ email: session.email }} logoUrl={settings.site_logo_url} />

      {/* Main Content Area */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-white/5 px-6 lg:px-8 py-4"
          style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between">
            <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
            <div className="flex-1 lg:flex-none">
              <h1 className="text-white font-semibold text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Logged in as Admin
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

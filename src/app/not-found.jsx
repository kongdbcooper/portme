// =============================================================================
// src/app/not-found.js — Custom 404 Page
// แสดงผลเมื่อหาหน้าที่ต้องการไม่พบ (Premium Design)
// =============================================================================

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px]" />

      <div className="relative text-center max-w-xl">
        <h1 className="text-[180px] font-black text-white/5 leading-none select-none">
          404
        </h1>
        <div className="-mt-12 space-y-6">
          <h2 className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Noto Serif Thai, serif' }}>
            Oops! ไม่พบหน้านี้
          </h2>
          <p className="text-gray-500 text-lg">
            หน้าที่คุณกำลังมองหาอาจถูกย้าย หรือไม่มีอยู่ในระบบแล้ว
          </p>
          <div className="pt-8">
            <Link href="/" className="btn-gradient px-10 py-4">
              กลับสู่หน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// src/app/admin/reports/page.jsx — Admin Reports Page
// หน้าจัดการรายงานจากผู้ใช้ ดึงข้อมูลจาก Google Sheets
// =============================================================================

import ReportsClient from '@/components/admin/ReportsClient'

export const metadata = {
  title: 'รายงานจากผู้ใช้ | Admin',
}

export default function AdminReportsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          📩 รายงานจากผู้ใช้
        </h1>
        <p className="text-gray-500">ข้อเสนอแนะและรายงานปัญหาจากผู้ใช้ (Anonymous) — ดึงจาก Google Sheets แบบ Real-time</p>
      </div>

      <ReportsClient />
    </div>
  )
}

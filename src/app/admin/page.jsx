// =============================================================================
// src/app/admin/page.js — Admin Dashboard Overview
// หน้าหลัก dashboard แสดง stats card, recent products
// ใช้งานร่วมกับ: src/lib/prisma.js, src/app/admin/layout.js
// =============================================================================


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

// Stats Card Component
function StatsCard({ label, value, icon, color, change }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
          {icon}
        </div>
        {change && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            change > 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
          }`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-3xl font-black text-white mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
        {value}
      </p>
    </div>
  )
}

export default async function AdminDashboardPage() {
  // ดึงข้อมูล stats จาก database
  const [totalProducts, activeProducts, totalABEvents] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.aBTestEvent.count(),
  ])

  // Recent products
  const recentProducts = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          ยินดีต้อนรับ 👋
        </h2>
        <p className="text-gray-500">นี่คือภาพรวมของเว็บไซต์คุณ</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatsCard label="โปรดักซ์ทั้งหมด" value={totalProducts} icon="📦" color="bg-brand-500/20" change={12} />
        <StatsCard label="โปรดักซ์ที่ใช้งาน" value={activeProducts} icon="✅" color="bg-green-500/20" />
        <StatsCard label="โปรดักซ์ปิดการใช้งาน" value={totalProducts - activeProducts} icon="⏸" color="bg-yellow-500/20" />
        <StatsCard label="A/B Test Events" value={totalABEvents.toLocaleString()} icon="🧪" color="bg-accent-500/20" change={8} />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-white font-semibold mb-4">การดำเนินการด่วน</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/products/new"
            id="dashboard-add-product-btn"
            className="glass-card p-5 flex items-center gap-4 hover:border-brand-500/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              ➕
            </div>
            <div>
              <p className="text-white font-medium text-sm">เพิ่มโปรดักซ์ใหม่</p>
              <p className="text-gray-600 text-xs">Upload รูปภาพสู่ R2</p>
            </div>
          </Link>
          <Link
            href="/admin/products"
            id="dashboard-manage-products-btn"
            className="glass-card p-5 flex items-center gap-4 hover:border-brand-500/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              📋
            </div>
            <div>
              <p className="text-white font-medium text-sm">จัดการโปรดักซ์</p>
              <p className="text-gray-600 text-xs">แก้ไข / ลบ</p>
            </div>
          </Link>
          <Link
            href="/admin/ab-test"
            id="dashboard-ab-test-btn"
            className="glass-card p-5 flex items-center gap-4 hover:border-brand-500/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              🧪
            </div>
            <div>
              <p className="text-white font-medium text-sm">A/B Testing</p>
              <p className="text-gray-600 text-xs">ดูผลลัพธ์</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Products */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">โปรดักซ์ล่าสุด</h3>
          <Link href="/admin/products" className="text-brand-400 text-sm hover:text-brand-300">
            ดูทั้งหมด →
          </Link>
        </div>
        <div className="glass-card overflow-x-auto">
          {recentProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <div className="text-4xl mb-2">📦</div>
              <p>ยังไม่มีโปรดักซ์ — <Link href="/admin/products/new" className="text-brand-400">เพิ่มโปรดักซ์แรก</Link></p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ชื่อโปรดักซ์</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">หมวดหมู่</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ราคา</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">สถานะ</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5 text-white text-sm font-medium">{product.name}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-sm hidden sm:table-cell">{product.category || '—'}</td>
                    <td className="px-5 py-3.5 text-brand-400 text-sm font-semibold">
                      ฿{Number(product.price).toLocaleString('th-TH')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${product.isActive ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-500'}`}>
                        {product.isActive ? 'ใช้งาน' : 'ปิด'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-brand-400 text-sm hover:text-brand-300"
                      >
                        แก้ไข
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

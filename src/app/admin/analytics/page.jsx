// =============================================================================
// src/app/admin/analytics/page.jsx — Admin Analytics Page
// แสดงสถิติว่าลูกค้าสนใจสินค้าไหนบ้าง หรือหมวดหมู่ไหนกำลังฮิต
// =============================================================================

import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  // ดึง events ทั้งหมดที่เป็น CLICK (ความสนใจสินค้า)
  const clickEvents = await prisma.aBTestEvent.findMany({
    where: { eventType: 'CLICK' },
    include: {
      product: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // ดึงคำค้นหา (Search Queries) ยอดฮิต
  const searchLogs = await prisma.searchLog.groupBy({
    by: ['query'],
    _count: { query: true },
    orderBy: { _count: { query: 'desc' } },
    take: 10,
  })

  // สร้างรายงาน สถิติรายสินค้า
  const productStats = {}
  let totalClicks = 0
  const categoryStats = {}

  clickEvents.forEach(event => {
    if (!event.product) return
    const pId = event.product.id
    const pName = event.product.name
    const pCat = event.product.category || 'ไม่มีหมวดหมู่'

    totalClicks++

    // นับรายสินค้า
    if (!productStats[pId]) {
      productStats[pId] = {
        id: pId,
        name: pName,
        category: pCat,
        clicks: 0,
        lastClicked: event.createdAt,
      }
    }
    productStats[pId].clicks++

    // นับรายหมวดหมู่
    if (!categoryStats[pCat]) {
      categoryStats[pCat] = 0
    }
    categoryStats[pCat]++
  })

  // เรียงลำดับสินค้าฮิต (clicks มากไปน้อย)
  const sortedProducts = Object.values(productStats).sort((a, b) => b.clicks - a.clicks)
  
  // เรียงลำดับหมวดหมู่ฮิต
  const sortedCategories = Object.entries(categoryStats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          📈 การวิเคราะห์ข้อมูล (Analytics)
        </h2>
        <p className="text-gray-500">ข้อมูลความสนใจสินค้าและการค้นหาจากลูกค้า</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-6 border-brand-500/20">
          <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center text-2xl mb-4">
            🖱️
          </div>
          <p className="text-gray-500 text-sm">จำนวนการกด "สนใจ" ทั้งหมด</p>
          <p className="text-3xl font-black text-white mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {totalClicks.toLocaleString()}
          </p>
        </div>
        
        <div className="glass-card p-6 border-green-500/20">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center text-2xl mb-4">
            🔥
          </div>
          <p className="text-gray-500 text-sm">สินค้าที่ได้รับความสนใจสูงสุด</p>
          <p className="text-xl font-bold text-white mt-1 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {sortedProducts[0]?.name || 'ยังไม่มีข้อมูล'}
          </p>
        </div>

        <div className="glass-card p-6 border-blue-500/20">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl mb-4">
            🔍
          </div>
          <p className="text-gray-500 text-sm">คำค้นหายอดฮิต</p>
          <p className="text-xl font-bold text-white mt-1 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {searchLogs[0]?.query ? `"${searchLogs[0].query}"` : 'ยังไม่มีข้อมูล'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Products Table */}
        <div className="lg:col-span-2">
          <h3 className="text-white font-semibold mb-4">🏆 อันดับสินค้าที่ลูกค้าต้องการ</h3>
          <div className="glass-card overflow-hidden">
            {sortedProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">ยังไม่มีข้อมูลความสนใจสินค้า</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">ชื่อสินค้า</th>
                    <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">หมวดหมู่</th>
                    <th className="px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">จำนวนความสนใจ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedProducts.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 font-mono text-sm w-4">{idx + 1}.</span>
                          <span className="text-white font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-sm">{p.category}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center justify-center bg-brand-500/20 text-brand-400 font-bold px-3 py-1 rounded-full">
                          {p.clicks}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Search Logs & Categories */}
        <div className="space-y-8">
          
          {/* Top Searches */}
          <div>
            <h3 className="text-white font-semibold mb-4">🔎 คำค้นหาที่พบบ่อย (Top Searches)</h3>
            <div className="glass-card overflow-hidden">
              {searchLogs.length === 0 ? (
                <div className="py-8 text-center text-gray-500">ยังไม่มีข้อมูลการค้นหา</div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {searchLogs.map((log, idx) => (
                    <li key={log.query} className="px-5 py-3 flex justify-between items-center hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 font-mono text-xs w-4">{idx + 1}.</span>
                        <span className="text-gray-300">"{log.query}"</span>
                      </div>
                      <span className="text-xs bg-white/10 text-gray-400 px-2 py-1 rounded-md">
                        {log._count.query} ครั้ง
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Categories Chart/List */}
          <div>
            <h3 className="text-white font-semibold mb-4">📊 สัดส่วนหมวดหมู่ที่คนสนใจ</h3>
            <div className="glass-card p-5">
              {sortedCategories.length === 0 ? (
                <div className="py-8 text-center text-gray-500">ยังไม่มีข้อมูล</div>
              ) : (
                <div className="space-y-4">
                  {sortedCategories.map((cat) => {
                    const percentage = Math.round((cat.count / totalClicks) * 100)
                    return (
                      <div key={cat.name}>
                        <div className="flex justify-between items-end mb-1">
                          <span className="text-sm font-medium text-white">{cat.name}</span>
                          <span className="text-xs text-brand-400 font-bold">{percentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-surface-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-brand rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-right">{cat.count} clicks</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// =============================================================================
// src/app/admin/ab-test/page.js — A/B Test Analytics Page
// แสดงสถิติ A/B testing สำหรับแต่ละโปรดักซ์
// ใช้งานร่วมกับ: src/lib/prisma.js, src/lib/ab-test.js
//               src/app/api/ab-test/route.js
// =============================================================================


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { getABStats } from '@/lib/ab-test'

export const metadata = { title: 'A/B Testing' }

// คำนวณ conversion rate
function calcRate(conversions, views) {
  if (!views) return 0
  return ((conversions / views) * 100).toFixed(1)
}

// StatBar component — แสดง bar chart แบบง่าย
function StatBar({ label, value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-semibold">{value.toLocaleString()} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default async function ABTestPage() {
  // ดึงโปรดักซ์ทั้งหมดพร้อม A/B stats
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, abVariant: true, imageUrl: true },
    orderBy: { createdAt: 'desc' },
  })

  // ดึง stats สำหรับทุกโปรดักซ์
  const statsMap = await Promise.all(
    products.map(async (p) => ({
      id: p.id,
      name: p.name,
      currentVariant: p.abVariant,
      stats: await getABStats(prisma, p.id),
    }))
  )

  // Summary totals
  const totalEvents = await prisma.aBTestEvent.count()
  const variantACounts = await prisma.aBTestEvent.count({ where: { variant: 'A' } })
  const variantBCounts = await prisma.aBTestEvent.count({ where: { variant: 'B' } })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          A/B Testing Dashboard
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          วิเคราะห์ผลลัพธ์ Variant A (Standard Card) vs Variant B (Horizontal Card)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 text-center">
          <p className="text-gray-500 text-sm">Total Events</p>
          <p className="text-3xl font-black text-white mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {totalEvents.toLocaleString()}
          </p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-brand-400 text-sm font-medium">Variant A Events</p>
          <p className="text-3xl font-black text-white mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {variantACounts.toLocaleString()}
          </p>
          <p className="text-gray-600 text-xs mt-1">
            {totalEvents > 0 ? ((variantACounts / totalEvents) * 100).toFixed(1) : 0}% ของทั้งหมด
          </p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-accent-400 text-sm font-medium">Variant B Events</p>
          <p className="text-3xl font-black text-white mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {variantBCounts.toLocaleString()}
          </p>
          <p className="text-gray-600 text-xs mt-1">
            {totalEvents > 0 ? ((variantBCounts / totalEvents) * 100).toFixed(1) : 0}% ของทั้งหมด
          </p>
        </div>
      </div>

      {/* Per-Product Stats */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold">สถิติแยกตามโปรดักซ์</h3>

        {statsMap.length === 0 ? (
          <div className="glass-card p-10 text-center text-gray-600">
            <div className="text-4xl mb-2">🧪</div>
            <p>ยังไม่มีข้อมูล A/B test — รอให้ผู้ใช้เยี่ยมชมหน้าเว็บก่อน</p>
          </div>
        ) : (
          statsMap.map(({ id, name, currentVariant, stats }) => {
            const totalA = (stats.A.VIEW || 0) + (stats.A.CLICK || 0) + (stats.A.CONVERSION || 0)
            const totalB = (stats.B.VIEW || 0) + (stats.B.CLICK || 0) + (stats.B.CONVERSION || 0)
            const totalAll = totalA + totalB

            // ผู้ชนะ A/B
            const aConvRate = parseFloat(calcRate(stats.A.CONVERSION, stats.A.VIEW))
            const bConvRate = parseFloat(calcRate(stats.B.CONVERSION, stats.B.VIEW))
            const winner = aConvRate > bConvRate ? 'A' : bConvRate > aConvRate ? 'B' : null

            return (
              <div key={id} className="glass-card p-6">
                {/* Product header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h4 className="text-white font-semibold">{name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="badge bg-brand-500/15 text-brand-400 text-xs">
                        Current: Variant {currentVariant}
                      </span>
                      {winner && (
                        <span className={`badge text-xs ${winner === 'A' ? 'bg-brand-500/20 text-brand-300' : 'bg-accent-500/20 text-accent-300'}`}>
                          🏆 Variant {winner} ชนะ
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 text-xs">Total events</p>
                    <p className="text-white font-bold">{totalAll.toLocaleString()}</p>
                  </div>
                </div>

                {/* A vs B grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Variant A */}
                  <div className="space-y-3 p-4 rounded-xl bg-brand-500/5 border border-brand-500/10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded bg-brand-500 text-white text-xs font-bold flex items-center justify-center">A</span>
                      <span className="text-white font-medium text-sm">Standard Card</span>
                    </div>
                    <StatBar label="Views" value={stats.A.VIEW || 0} total={Math.max(totalA, 1)} color="#5a6bff" />
                    <StatBar label="Clicks" value={stats.A.CLICK || 0} total={Math.max(totalA, 1)} color="#7c93ff" />
                    <StatBar label="Conversions" value={stats.A.CONVERSION || 0} total={Math.max(totalA, 1)} color="#a5b8ff" />
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-gray-500 text-xs">Conversion Rate: <span className="text-brand-400 font-bold">{aConvRate}%</span></p>
                    </div>
                  </div>

                  {/* Variant B */}
                  <div className="space-y-3 p-4 rounded-xl bg-accent-500/5 border border-accent-500/10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded bg-accent-500 text-white text-xs font-bold flex items-center justify-center">B</span>
                      <span className="text-white font-medium text-sm">Horizontal Card</span>
                    </div>
                    <StatBar label="Views" value={stats.B.VIEW || 0} total={Math.max(totalB, 1)} color="#f97316" />
                    <StatBar label="Clicks" value={stats.B.CLICK || 0} total={Math.max(totalB, 1)} color="#fb923c" />
                    <StatBar label="Conversions" value={stats.B.CONVERSION || 0} total={Math.max(totalB, 1)} color="#fdba74" />
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-gray-500 text-xs">Conversion Rate: <span className="text-accent-400 font-bold">{bConvRate}%</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

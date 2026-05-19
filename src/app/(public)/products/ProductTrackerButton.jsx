'use client'

import { useState } from 'react'

export default function ProductTrackerButton({ product }) {
  const [loading, setLoading] = useState(false)
  const [tracked, setTracked] = useState(false)

  const handleTrackClick = async () => {
    if (tracked || loading) return
    setLoading(true)

    try {
      // เรียก API เพื่อ track ว่าสินค้านี้ถูกคลิก/สนใจ
      await fetch('/api/ab-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          variant: 'A', // ใส่ default เป็น A เพราะไม่ได้ทำ A/B test จริงๆ แค่อยากเก็บ click
          eventType: 'CLICK',
        }),
      })
      setTracked(true)
    } catch (error) {
      console.error('Failed to track click', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleTrackClick}
      disabled={loading || tracked}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
        tracked
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'btn-ghost hover:scale-105'
      }`}
    >
      {tracked ? '✓ สนใจแล้ว' : (loading ? 'กำลังบันทึก...' : 'สนใจสินค้านี้')}
    </button>
  )
}

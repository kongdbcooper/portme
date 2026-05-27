'use client'

import { useEffect, useMemo, useState } from 'react'

// ================= SAFE CLOCK =================
function useNow(interval = 60000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [interval])

  return now
}

// ================= DATE PARSER (SaaS FIX) =================
function parseDateSafe(iso) {
  if (!iso) return null

  let date = new Date(iso)
  if (!isNaN(date.getTime())) return date

  if (iso.includes('/')) {
    const [d, t] = iso.split(' ')
    if (!d || !t) return null

    const [day, month, year] = d.split('/')
    const y = Number(year) - 543

    date = new Date(`${y}-${month}-${day}T${t}`)
    if (!isNaN(date.getTime())) return date
  }

  return null
}

export default function ReportsClient() {
  const [reports, setReports] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const now = useNow()

  // ================= FETCH =================
  const fetchReports = async () => {
    const res = await fetch('/api/admin/reports', { cache: 'no-store' })
    const json = await res.json()
    return json.reports || []
  }

  // ================= INIT + SYNC (SaaS realtime-lite) =================
  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const data = await fetchReports()
        if (alive) setReports(data)
      } catch (err) {
        console.error(err)
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()

    // 🔥 auto sync (ลบแล้วหาย / เพิ่มแล้วขึ้น)
    const interval = setInterval(load, 5000)

    return () => {
      alive = false
      clearInterval(interval)
    }
  }, [])

  // ================= SORT (NEW FIRST) =================
  const sorted = useMemo(() => {
    return [...reports].sort((a, b) => {
      const ta = parseDateSafe(a.timestamp)?.getTime() || 0
      const tb = parseDateSafe(b.timestamp)?.getTime() || 0
      return tb - ta
    })
  }, [reports])

  // ================= FILTER =================
  const filtered = useMemo(() => {
    const q = search.toLowerCase()

    return sorted.filter((r) => {
      return (
        (r.content || '').toLowerCase().includes(q) ||
        (r.timestamp || '').toLowerCase().includes(q)
      )
    })
  }, [sorted, search])

  // ================= TIME AGO =================
  const timeAgo = (iso) => {
    const date = parseDateSafe(iso)
    if (!date) return '-'

    const diff = now - date.getTime()
    const mins = Math.floor(diff / 60000)

    if (mins < 1) return 'เมื่อสักครู่'
    if (mins < 60) return `${mins} นาทีที่แล้ว`

    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`

    const days = Math.floor(hours / 24)
    return `${days} วันที่แล้ว`
  }

  // ================= DATE FORMAT (UI unchanged) =================
  function formatThaiDateTime(iso) {
    const date = parseDateSafe(iso)
    if (!date) return '-'

    return new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  }

  // ================= UI (UNCHANGED STYLE) =================
  if (loading) {
    return <div className="p-4">กำลังโหลด...</div>
  }

  return (
    <div className="p-4 space-y-4">
      <input
        type="text"
        placeholder="ค้นหา..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-3 py-2 rounded w-full"
      />

      <div className="space-y-2">
        {filtered.map((r) => (
          <div key={r.id} className="border p-3 rounded bg-black shadow-sm">
            <div className="text-sm text-white-500">
              {timeAgo(r.timestamp)}
            </div>

            <div className="mt-1 whitespace-pre-wrap">
              {r.content}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-gray-400">ไม่พบข้อมูล</div>
        )}
      </div>
    </div>
  )
}
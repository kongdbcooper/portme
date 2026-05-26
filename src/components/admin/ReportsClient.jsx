'use client'

import { useEffect, useMemo, useState } from 'react'

// ✅ custom hook กัน Date.now impure
function useNow(interval = 60000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now())
    }, interval)

    return () => clearInterval(id)
  }, [interval])

  return now
}

export default function ReportsClient() {
  const [reports, setReports] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // ✅ ใช้ hook ที่ pure แล้ว
  const now = useNow()

  // ✅ fetch function (ไม่มี setState)
  const fetchReports = async () => {
    const res = await fetch('/api/admin/reports', { cache: 'no-store' })
    const json = await res.json()
    return json.reports || []
  }

  // ✅ effect แบบถูกต้อง
  useEffect(() => {
    let ignore = false

    const load = async () => {
      try {
        const data = await fetchReports()

        if (!ignore) {
          setReports(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [])

  // ✅ filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase()

    return reports.filter((r) => {
      return (
        (r.content || '').toLowerCase().includes(q) ||
        (r.timestamp || '').toLowerCase().includes(q)
      )
    })
  }, [reports, search])

  // ✅ timeAgo (pure เพราะใช้ now จาก hook)
  const timeAgo = (iso) => {
    try {
      const diff = now - new Date(iso).getTime()
      const mins = Math.floor(diff / 60000)

      if (mins < 1) return 'เมื่อสักครู่'
      if (mins < 60) return `${mins} นาทีที่แล้ว`

      const hours = Math.floor(mins / 60)
      if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`

      const days = Math.floor(hours / 24)
      return `${days} วันที่แล้ว`
    } catch {
      return '-'
    }
  }

  // ================= UI =================

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
          <div
            key={r.id}
            className="border p-3 rounded bg-white shadow-sm"
          >
            <div className="text-sm text-gray-500">
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
'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { FiCheckCircle, FiSearch, FiAlertTriangle, FiX, FiClock, FiCheck, FiTrash2 } from 'react-icons/fi'

// ================= SAFE CLOCK =================
function useNow(interval = 60000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [interval])

  return now
}

// ================= DATE PARSER (Bangkok Time Fix) =================
function parseDateSafe(iso) {
  if (!iso) return null

  // If it's a valid ISO string with timezone or Zulu, parse directly
  if (typeof iso === 'string' && (iso.endsWith('Z') || iso.includes('+') || (iso.includes('-') && iso.split('-').length === 3 && iso.includes('T')))) {
    const date = new Date(iso)
    if (!isNaN(date.getTime())) return date
  }

  // Handle Thai locale format: e.g. "27/5/2569 21:11:29" or "27/5/2026 21:11:29"
  if (typeof iso === 'string' && iso.includes('/')) {
    const [d, t] = iso.split(' ')
    if (!d || !t) return null

    const parts = d.split('/')
    if (parts.length !== 3) return null
    const [day, month, year] = parts

    let y = Number(year)
    // If year is in Buddhist Calendar (typically > 2400)
    if (y > 2400) {
      y = y - 543
    }

    // Force interpretation as Bangkok time (+07:00)
    const mm = month.padStart(2, '0')
    const dd = day.padStart(2, '0')
    const date = new Date(`${y}-${mm}-${dd}T${t}+07:00`)
    if (!isNaN(date.getTime())) return date
  }

  const date = new Date(iso)
  if (!isNaN(date.getTime())) return date

  return null
}

export default function ReportsClient() {
  const [reports, setReports] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

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

    // auto sync (ลบแล้วหาย / เพิ่มแล้วขึ้น) - disabled when modal/action is active
    const interval = setInterval(() => {
      if (!confirmId && !resolvingId) {
        load()
      }
    }, 8000)

    return () => {
      alive = false
      clearInterval(interval)
    }
  }, [confirmId, resolvingId])

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

  // ================= SELECTION =================
  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === filtered.length) {
        return new Set()
      }
      return new Set(filtered.map(r => r.id))
    })
  }, [filtered])

  // ================= ACTIONS =================
  const handleBulkResolve = async () => {
    const idsToDelete = Array.from(selectedIds)
    if (idsToDelete.length === 0) return

    setResolvingId('bulk')
    try {
      await Promise.all(
        idsToDelete.map(id =>
          fetch(`/api/admin/reports?id=${id}`, { method: 'DELETE' })
        )
      )
      setReports(prev => prev.filter(r => !selectedIds.has(r.id)))
      setSelectedIds(new Set())
      setBulkConfirm(false)
      const updated = await fetchReports()
      setReports(updated)
    } catch (err) {
      console.error(err)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    } finally {
      setResolvingId(null)
    }
  }
  const handleResolve = async (id) => {
    setResolvingId(id)
    try {
      const res = await fetch(`/api/admin/reports?id=${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        // อัพเดต state ทันทีเพื่อความลื่นไหล จากนั้นดึงข้อมูลล่าสุดเพื่ออัพเดต index ให้ถูกต้อง
        setReports((prev) => prev.filter((r) => r.id !== id))
        setConfirmId(null)
        const updated = await fetchReports()
        setReports(updated)
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการลบข้อมูล')
      }
    } catch (err) {
      console.error(err)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์')
    } finally {
      setResolvingId(null)
    }
  }

  // ================= TIME AGO =================
  const timeAgo = (iso) => {
    const date = parseDateSafe(iso)
    if (!date) return '-'

    const diff = Math.max(0, now - date.getTime())
    const mins = Math.floor(diff / 60000)

    if (mins < 1) return 'เมื่อสักครู่'
    if (mins < 60) return `${mins} นาทีที่แล้ว`

    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`

    const days = Math.floor(hours / 24)
    return `${days} วันที่แล้ว`
  }

  // ================= DATE FORMAT =================
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm">กำลังโหลดรายงาน...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative group max-w-md">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-400 transition-colors">
          <FiSearch className="text-lg" />
        </div>
        <input
          type="text"
          placeholder="ค้นหาข้อความ หรือวันที่..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm"
        />
      </div>

      {/* Bulk Actions Toolbar */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-4 py-3 px-4 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                selectedIds.size === filtered.length && filtered.length > 0
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : selectedIds.size > 0
                  ? 'bg-brand-500/50 border-brand-500 text-white'
                  : 'border-gray-500 hover:border-brand-400'
              }`}
            >
              {selectedIds.size > 0 && (
                <FiCheck className={`text-xs ${selectedIds.size === filtered.length ? '' : 'text-xs'}`} />
              )}
            </button>
            <span className="text-sm text-gray-400">
              {selectedIds.size > 0
                ? `เลือกแล้ว ${selectedIds.size} รายการ`
                : 'เลือกทั้งหมด'}
            </span>
          </div>

          {selectedIds.size > 0 && (
            <button
              onClick={() => setBulkConfirm(true)}
              disabled={resolvingId === 'bulk'}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all disabled:opacity-50"
            >
              {resolvingId === 'bulk' ? (
                <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
              ) : (
                <FiTrash2 />
              )}
              แก้ไขสำเร็จ ({selectedIds.size})
            </button>
          )}
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((r) => {
          const isSelected = selectedIds.has(r.id)
          return (
            <div
              key={r.id}
              className={`glass-card p-5 flex flex-col justify-between hover:border-brand-500/30 transition-all duration-300 animate-fade-in group/card cursor-pointer ${
                isSelected ? 'border-brand-500/50 ring-1 ring-brand-500/20' : ''
              }`}
              onClick={() => toggleSelect(r.id)}
            >
              <div>
                {/* Header Info */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-brand-500 border-brand-500 text-white'
                          : 'border-gray-600 group-hover/card:border-gray-400'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSelect(r.id)
                      }}
                    >
                      {isSelected && <FiCheck className="text-xs" />}
                    </div>
                    <span className="flex items-center gap-1.5 font-medium text-brand-400">
                      <FiClock /> {timeAgo(r.timestamp)}
                    </span>
                  </div>
                  <span>{formatThaiDateTime(r.timestamp)}</span>
                </div>

                {/* Message Content */}
                <div className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed min-h-[60px]">
                  {r.content}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-white/5 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmId(r.id)
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-xl transition-all duration-200 border border-green-500/20 hover:border-green-500/40"
                >
                  <FiCheckCircle className="text-sm" /> แก้ไขสำเร็จ
                </button>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center glass-card border border-white/5 rounded-2xl">
            <p className="text-gray-500">ไม่พบข้อมูลรายงาน</p>
          </div>
        )}
      </div>

      {/* Bulk Confirmation Modal */}
      {bulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md bg-surface-800 border border-white/10 rounded-3xl p-6 shadow-2xl animate-scale-in"
            style={{ background: 'linear-gradient(135deg, #111118 0%, #1a1a2e 100%)' }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-xl flex-shrink-0">
                <FiTrash2 />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Prompt, sans-serif' }}>
                  ยืนยันการดำเนินการ
                </h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  คุณแน่ใจหรือไม่ว่าต้องการทำเครื่องหมายว่า <strong className="text-green-400">แก้ไขสำเร็จ</strong> ทั้งหมด <strong className="text-brand-400">{selectedIds.size} รายการ</strong>?
                  <br />
                  การดำเนินการนี้จะลบรายงานออกจากระบบ Dashboard และจาก Google Sheets อย่างถาวร
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-white/5 pt-4">
              <button
                onClick={() => setBulkConfirm(false)}
                disabled={resolvingId === 'bulk'}
                className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleBulkResolve}
                disabled={resolvingId === 'bulk'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/30 transition-all disabled:opacity-50"
              >
                {resolvingId === 'bulk' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    กำลังลบ...
                  </>
                ) : (
                  <>
                    <FiTrash2 /> ยืนยันการแก้ไข ({selectedIds.size})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md bg-surface-800 border border-white/10 rounded-3xl p-6 shadow-2xl animate-scale-in"
            style={{ background: 'linear-gradient(135deg, #111118 0%, #1a1a2e 100%)' }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 text-xl flex-shrink-0">
                <FiAlertTriangle />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Prompt, sans-serif' }}>
                  ยืนยันการดำเนินการ
                </h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  คุณแน่ใจหรือไม่ว่าต้องการทำเครื่องหมายว่า <strong className="text-green-400">แก้ไขสำเร็จ</strong>?<br />
                  การดำเนินการนี้จะลบรายงานออกจากระบบ Dashboard และจาก Google Sheets อย่างถาวร
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-white/5 pt-4">
              <button
                onClick={() => setConfirmId(null)}
                disabled={resolvingId !== null}
                className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleResolve(confirmId)}
                disabled={resolvingId !== null}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/30 transition-all disabled:opacity-50"
              >
                {resolvingId ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    กำลังลบ...
                  </>
                ) : (
                  <>
                    <FiCheck /> ยืนยันการแก้ไข
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Key maps ─────────────────────────────────────────────────────────────────
const QTY_KEYS  = ['จำนวนคงเหลือ','qty','quantity','คงเหลือ','จำนวน']
const MIN_KEYS  = ['จำนวนขั้นต่ำ','min_qty','minimum','ขั้นต่ำ']
const NAME_KEYS = ['ชื่อวัสดุ','ชื่อ','name','item','รายการ','material']
const CODE_KEYS = ['รหัส','code','sku','id']

const getVal = (item, keys) => { for (const k of keys) if (item[k] !== undefined && item[k] !== '') return item[k]; return null }
const getQty  = item => parseInt(getVal(item, QTY_KEYS) ?? 0, 10) || 0
const getMin  = item => parseInt(getVal(item, MIN_KEYS) ?? 5, 10)  || 5

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ item }) {
  const qty = getQty(item), min = getMin(item)
  if (qty <= 0)    return <span className="badge bg-red-500/20 text-red-400">หมด</span>
  if (qty <= min)  return <span className="badge bg-yellow-500/20 text-yellow-400">ใกล้หมด</span>
  return <span className="badge bg-green-500/20 text-green-400">พร้อมใช้</span>
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="glass-card p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${color} mb-3`}>{icon}</div>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-2xl font-black text-white mt-1" style={{ fontFamily:'Outfit,sans-serif' }}>{value}</p>
    </div>
  )
}

// ─── Add Item Modal ───────────────────────────────────────────────────────────
function AddItemModal({ headers, sheetName, onClose, onSuccess }) {
  const [form, setForm]     = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const displayHeaders =
    headers && headers.length > 0
      ? headers.filter(h => h !== '_rowIndex')
      : []

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const values = displayHeaders.map(h => form[h] ?? '')
      const res = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet: sheetName, values }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-card p-6 border-brand-500/30 z-10 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg" style={{ fontFamily:'Outfit,sans-serif' }}>
            ➕ เพิ่มรายการวัสดุ
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl">✕</button>
        </div>

        {displayHeaders.length === 0 ? (
          <p className="text-gray-500 text-sm">ยังไม่มีข้อมูล Header จาก Sheet — กรุณาโหลดข้อมูลก่อน</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {displayHeaders.map(h => (
              <div key={h}>
                <label className="form-label">{h}</label>
                <input
                  type={QTY_KEYS.includes(h) || MIN_KEYS.includes(h) ? 'number' : 'text'}
                  min="0"
                  placeholder={`กรอก ${h}...`}
                  value={form[h] ?? ''}
                  onChange={e => setForm(f => ({ ...f, [h]: e.target.value }))}
                  className="form-input text-sm"
                />
              </div>
            ))}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
                ยกเลิก
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 btn-gradient py-2.5 text-sm disabled:opacity-50">
                {loading ? '⟳ กำลังบันทึก...' : '✓ บันทึก'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Delete Confirm Dialog ─────────────────────────────────────────────────────
function DeleteDialog({ item, sheetGid, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const name = getVal(item, NAME_KEYS) || getVal(item, CODE_KEYS) || `แถวที่ ${item._rowIndex}`

  const handleDelete = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/inventory?row=${item._rowIndex}&gid=${sheetGid ?? 0}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      onSuccess()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm glass-card p-6 border-red-500/30 z-10">
        <div className="text-center mb-4">
          <div className="text-4xl mb-3">🗑️</div>
          <h3 className="text-white font-bold text-lg" style={{ fontFamily:'Outfit,sans-serif' }}>ลบรายการ</h3>
          <p className="text-gray-400 text-sm mt-2">
            คุณต้องการลบ <span className="text-white font-semibold">{name}</span> ออกจาก Google Sheet ใช่หรือไม่?
          </p>
          <p className="text-red-400/70 text-xs mt-1">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
        </div>

        {error && <p className="text-red-400 text-xs text-center mb-3 bg-red-500/10 p-2 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium disabled:opacity-50">
            ยกเลิก
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-sm font-semibold disabled:opacity-50">
            {loading ? '⟳ กำลังลบ...' : '🗑️ ลบออก'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const [items, setItems]     = useState([])
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [lastFetch, setLastFetch] = useState(null)
  const [sheetName, setSheetName] = useState('Inventory')
  const [sheetGid, setSheetGid]   = useState(0)
  const [sheets, setSheets]   = useState([])
  const [headers, setHeaders] = useState([])
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [countdown, setCountdown]     = useState(30)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast]     = useState(null)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [isSelling, setIsSelling] = useState(false)
  const intervalRef   = useRef(null)
  const countdownRef  = useRef(null)
  const barcodeInputRef = useRef(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ─── ดึงรายชื่อ Sheets ─────────────────────────────────────────────────────
const fetchSheets = useCallback(async () => {
  try {
    const res = await fetch('/api/inventory', {
      method: 'POST',
    })

    const text = await res.text()

    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.error('POST /api/inventory not JSON:', text)
      throw new Error('API returned invalid JSON')
    }

    if (data.success && data.sheets?.length) {
      setSheets(data.sheets)

      const current = data.sheets.find(s => s.title === sheetName)
      if (current) setSheetGid(current.id)
    }

  } catch (err) {
    console.error(err)
  }
}, [sheetName])

  // ─── ดึงข้อมูล Inventory ──────────────────────────────────────────────────
const fetchInventory = useCallback(async (name = sheetName) => {
  setLoading(true)
  setError(null)

  try {
    const res = await fetch(
      `/api/inventory?sheet=${encodeURIComponent(name)}&t=${Date.now()}`
    )

    const text = await res.text()

    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.error('GET inventory not JSON:', text)
      throw new Error('API returned invalid JSON')
    }

    if (!data.success) throw new Error(data.error || 'โหลดข้อมูลล้มเหลว')

    const items = data.items || []
    setItems(items)
    setStats(data.stats)
    setLastFetch(new Date(data.fetchedAt))

    // 🔥 FIX สำคัญตรงนี้
    if (items.length > 0) {
      setHeaders(Object.keys(items[0]))
    } else {
      setHeaders([
        'สาขา',
        'เลขบาร์โค๊ด',
        'ชื่อสินค้า',
        'ราคาสินค้า',
        'จำนวนคงเหลือ',
        'นำเข้าทั้งหมด',
        'วันที่นำเข้า',
        'ผู้รับเข้า',
        'วันที่ขายสินค้า',
        'ผู้จำหน่ายสินค้า'
      ])
    }

  } catch (e) {
    setError(e.message)
  } finally {
    setLoading(false)
    setCountdown(30)
  }
}, [sheetName])

  useEffect(() => {
    const init = async () => {
      try {
      await fetchSheets()
      await fetchInventory()
    } catch (error) {
      console.error(error)
    }
  }

  init()
}, [fetchSheets, fetchInventory])

  // ─── Auto-refresh ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current  = setInterval(() => fetchInventory(sheetName), 30000)
      countdownRef.current = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 30), 1000)
    }
    return () => { clearInterval(intervalRef.current); clearInterval(countdownRef.current) }
  }, [autoRefresh, sheetName, fetchInventory])

  const handleSheetChange = (name) => {
    setSheetName(name)
    const found = sheets.find(s => s.title === name)
    if (found) setSheetGid(found.id)
    fetchInventory(name)
  }

  const handleAddSuccess = () => {
    setShowAddModal(false)
    fetchInventory(sheetName)
    showToast('✅ เพิ่มรายการสำเร็จ')
  }

  const handleDeleteSuccess = () => {
    setDeleteTarget(null)
    fetchInventory(sheetName)
    showToast('🗑️ ลบรายการสำเร็จ')
  }

  // ─── Barcode & Sell ─────────────────────────────────────────────────────────
  const handleSell = async (item) => {
  if (isSelling) return

  setIsSelling(true)

  try {
    const res = await fetch('/api/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheet: sheetName,
        rowIndex: item._rowIndex
      })
    })

    const data = await res.json()

    if (!data.success) throw new Error(data.error)

    showToast(`🛒 ขายสำเร็จ เหลือ ${data.newValue}`, 'success')

    setItems(prev =>
      prev.map(p =>
        p._rowIndex === item._rowIndex
          ? { ...p, 'จำนวนคงเหลือ': String(data.newValue) }
          : p
      )
    )

  } catch (err) {
    showToast('❌ ตัดสต็อกล้มเหลว: ' + err.message, 'error')
  } finally {
    setIsSelling(false)
  }
}

  const handleBarcodeSubmit = (e) => {
    e.preventDefault()
    if (!barcodeInput.trim()) return

    const code = barcodeInput.trim()
    const item = items.find(i => {
      const itemCode = getVal(i, CODE_KEYS)
      return itemCode && itemCode.toString().toLowerCase() === code.toLowerCase()
    })

    if (item) {
      handleSell(item)
    } else {
      showToast(`❌ ไม่พบสินค้าที่มีรหัส: ${code}`, 'error')
    }

    setBarcodeInput('')
    if (barcodeInputRef.current) barcodeInputRef.current.focus()
  }

  // ─── Filter + Search ──────────────────────────────────────────────────────
  const displayHeaders = headers.filter(h => h !== '_rowIndex')
  const filtered = items.filter(item => {
    const nm   = getVal(item, NAME_KEYS) || ''
    const code = getVal(item, CODE_KEYS) || ''
    const matchSearch = !search || nm.toLowerCase().includes(search.toLowerCase()) || code.toLowerCase().includes(search.toLowerCase())
    const qty = getQty(item), min = getMin(item)
    const matchFilter = filter === 'all' ? true : filter === 'low' ? (qty > 0 && qty <= min) : filter === 'out' ? qty <= 0 : true
    return matchSearch && matchFilter
  })

  const hasWriteConfig = !!(process.env.NEXT_PUBLIC_HAS_SA) // placeholder — always show write buttons

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl font-medium text-sm shadow-2xl transition-all
          ${toast.type === 'success' ? 'bg-green-500/20 border border-green-500/40 text-green-300' : 'bg-red-500/20 border border-red-500/40 text-red-300'}`}>
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddItemModal headers={displayHeaders} sheetName={sheetName} onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />
      )}
      {deleteTarget && (
        <DeleteDialog item={deleteTarget} sheetGid={sheetGid} onClose={() => setDeleteTarget(null)} onSuccess={handleDeleteSuccess} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily:'Outfit,sans-serif' }}>
            🗄️ คลังสินค้า / วัสดุ
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            ข้อมูล real-time จาก Google Sheets
            {lastFetch && <span className="ml-2 text-gray-600">· อัปเดต {lastFetch.toLocaleTimeString('th-TH')}</span>}
            {autoRefresh && lastFetch && <span className="ml-1 text-brand-500/70">· รีเฟรชใน {countdown}s</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setAutoRefresh(a => !a)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${autoRefresh ? 'bg-brand-500/20 border-brand-500/30 text-brand-300' : 'bg-white/5 border-white/10 text-gray-500'}`}>
            {autoRefresh ? '🔄 Auto ON' : '⏸ Auto OFF'}
          </button>
          <button onClick={() => fetchInventory(sheetName)} disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 bg-white/5 text-gray-300 hover:text-white transition-all disabled:opacity-50">
            ↻ รีเฟรช
          </button>
          <button onClick={() => setShowAddModal(true)} id="inventory-add-btn"
            className="btn-gradient px-4 py-2 text-sm">
            ➕ เพิ่มรายการ
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="glass-card p-4 border-red-500/30 bg-red-500/10">
          <div className="flex items-start gap-3">
            <span className="text-red-400 text-lg">⚠️</span>
            <div>
              <p className="text-red-300 font-semibold text-sm">เกิดข้อผิดพลาด</p>
              <p className="text-red-400/80 text-xs mt-1">{error}</p>
              <p className="text-gray-500 text-xs mt-2">
                ตรวจสอบว่าตั้งค่า <code className="bg-white/10 px-1 rounded">GOOGLE_SHEET_ID</code> และ <code className="bg-white/10 px-1 rounded">GOOGLE_SHEETS_API_KEY</code> ใน .env แล้ว
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Setup Guide */}
      {!loading && !error && items.length === 0 && (
        <div className="glass-card p-6 border-brand-500/20">
          <h3 className="text-white font-semibold mb-3">📋 วิธีเชื่อมต่อ Google Sheets</h3>
          <ol className="text-gray-400 text-sm space-y-1.5 list-decimal list-inside">
            <li>เปิดใช้ <strong className="text-white">Google Sheets API</strong> ใน Google Cloud Console</li>
            <li>สร้าง <strong className="text-white">API Key</strong> → ใส่ใน <code className="bg-white/10 px-1 rounded">GOOGLE_SHEETS_API_KEY</code></li>
            <li>ใส่ Sheet ID ใน <code className="bg-white/10 px-1 rounded">GOOGLE_SHEET_ID</code></li>
            <li>สำหรับ เพิ่ม/ลบ รายการ: สร้าง <strong className="text-white">Service Account</strong> → ดูใน .env.example</li>
          </ol>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="รายการทั้งหมด" value={stats.totalItems} icon="📦" color="bg-brand-500/20" />
          <StatCard label="พร้อมใช้งาน"   value={stats.totalItems - stats.lowStockCount - stats.outOfStockCount} icon="✅" color="bg-green-500/20" />
          <StatCard label="ใกล้หมด"       value={stats.lowStockCount}   icon="⚠️" color="bg-yellow-500/20" />
          <StatCard label="หมดสต็อก"      value={stats.outOfStockCount} icon="🚫" color="bg-red-500/20" />
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {sheets.length > 0 && (
          <select value={sheetName} onChange={e => handleSheetChange(e.target.value)} className="form-input w-full sm:w-48 text-sm">
            {sheets.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}
          </select>
        )}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input type="text" placeholder="ค้นหาวัสดุ / รหัส..." value={search}
            onChange={e => setSearch(e.target.value)} className="form-input pl-9 text-sm" />
        </div>
        <form onSubmit={handleBarcodeSubmit} className="relative w-full sm:w-64">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500">📟</span>
          <input 
            type="text" 
            ref={barcodeInputRef}
            placeholder="สแกนบาร์โค้ดเพื่อขาย (-1)..." 
            value={barcodeInput}
            onChange={e => setBarcodeInput(e.target.value)} 
            className="form-input pl-9 text-sm border-brand-500/30 focus:border-brand-500" 
          />
        </form>
        <div className="flex gap-2">
          {[['all','ทั้งหมด'],['low','ใกล้หมด'],['out','หมดสต็อก']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap
                ${filter === v ? 'bg-brand-500/20 border-brand-500/40 text-brand-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
              {l}{v !== 'all' && stats ? ` (${v==='low' ? stats.lowStockCount : stats.outOfStockCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-500 text-sm">กำลังดึงข้อมูลจาก Google Sheets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <div className="text-4xl mb-2">📭</div>
            <p>{search ? `ไม่พบ "${search}"` : 'ไม่มีข้อมูล'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">สถานะ</th>
                {displayHeaders.map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((item, i) => {
                const qty = getQty(item), min = getMin(item)
                const isOut = qty <= 0
                const isLow = qty > 0 && qty <= min
                return (
                  <tr key={i} className={`transition-colors hover:bg-white/3 ${isOut ? 'bg-red-500/5' : isLow ? 'bg-yellow-500/5' : ''}`}>
                    <td className="px-4 py-3"><StatusBadge item={item} /></td>
                    {displayHeaders.map(h => (
                      <td key={h} className={`px-4 py-3 ${QTY_KEYS.includes(h) ? (isOut ? 'text-red-400 font-bold' : isLow ? 'text-yellow-400 font-semibold' : 'text-green-400 font-semibold') : 'text-gray-300'}`}>
                        {item[h] ?? '—'}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSell(item)}
                          disabled={isOut || isSelling}
                          title="ตัดสต็อก (ขาย) 1 ชิ้น"
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-brand-500/30 text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                          🛒 ขาย
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          id={`inventory-delete-row-${item._rowIndex}`}
                          title="ลบรายการนี้ออกจาก Sheet"
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">
                          🗑️ ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Out-of-stock quick delete section */}
      {stats?.outOfStockCount > 0 && (
        <div className="glass-card p-4 border-red-500/20">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-red-300 font-semibold text-sm">🚫 มี {stats.outOfStockCount} รายการที่หมดสต็อก</p>
              <p className="text-gray-500 text-xs mt-0.5">กดปุ่มข้างขวาเพื่อลบรายการที่หมดออกจาก Sheet ทั้งหมด</p>
            </div>
            <button
              onClick={() => setFilter('out')}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">
              ดูรายการหมดสต็อก →
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>แสดง {filtered.length} จาก {items.length} รายการ</span>
        {process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID && (
          <a href={`https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID}/edit`}
            target="_blank" rel="noreferrer"
            className="text-brand-500/60 hover:text-brand-400 transition-colors">
            📊 เปิด Google Sheets →
          </a>
        )}
      </div>
    </div>
  )
}

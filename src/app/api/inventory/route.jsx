// =============================================================================
// src/app/api/inventory/route.jsx — Inventory API (Google Sheets Read + Write)
// GET  — ดึงข้อมูล (API Key)
// PUT  — เพิ่มรายการใหม่ (Service Account)
// DELETE — ลบแถวตาม rowIndex (Service Account)
// POST — ดึงรายชื่อ Sheet tabs
// =============================================================================

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { SignJWT } from 'jose'
import { createPrivateKey } from 'crypto'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SHEET_ID  = process.env.GOOGLE_SHEET_ID
const API_KEY   = process.env.GOOGLE_SHEETS_API_KEY
const SA_EMAIL  = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const SA_KEY    = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

// ─── สร้าง OAuth2 Access Token จาก Service Account JWT ───────────────────────
async function getServiceAccountToken() {
  if (!SA_EMAIL || !SA_KEY) {
    throw new Error('ยังไม่ได้ตั้งค่า GOOGLE_SERVICE_ACCOUNT_EMAIL หรือ GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ใน .env')
  }

  const privateKeyPem = SA_KEY.replace(/\\n/g, '\n')
  const privateKey = createPrivateKey(privateKeyPem)

  const now = Math.floor(Date.now() / 1000)
  const jwt = await new SignJWT({
    iss: SA_EMAIL,
    sub: SA_EMAIL,
    aud: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    iat: now,
    exp: now + 3600,
  })
    .setProtectedHeader({ alg: 'RS256' })
    .sign(privateKey)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Service Account auth failed: ${err}`)
  }

  const data = await res.json()
  return data.access_token
}

// ─── แปลง rows → objects ──────────────────────────────────────────────────────
function rowsToObjects(values) {
  if (!values || values.length < 2) return []
  const [headers, ...rows] = values
  return rows.map((row, idx) => {
    const obj = { _rowIndex: idx + 2 }
    headers.forEach((h, i) => { obj[h?.trim() || `col_${i}`] = row[i] ?? '' })
    return obj
  })
}

// ─── GET /api/inventory ────────────────────────────────────────────────────────
export async function GET(request) {
  try { await requireAdmin() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  try {
    if (!SHEET_ID || !API_KEY) throw new Error('GOOGLE_SHEET_ID หรือ GOOGLE_SHEETS_API_KEY ยังไม่ได้ตั้งค่า')

    const { searchParams } = new URL(request.url)
    const sheet = searchParams.get('sheet') || 'Inventory'
    const range = searchParams.get('range') || 'A1:Z1000'

    const encoded = encodeURIComponent(`${sheet}!${range}`)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encoded}?key=${API_KEY}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Sheets API ${res.status}: ${await res.text()}`)

    const data = await res.json()
    let items = rowsToObjects(data.values)

    // ─── AUTO INITIALIZE & SYNC (เมื่อตารางว่างเปล่า) ───
    if (!data.values || data.values.length === 0) {
      try {
        const token = await getServiceAccountToken()
        const allProducts = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
        
        const headers = ['รหัส (ID)', 'ชื่อสินค้า', 'หมวดหมู่', 'ราคา', 'จำนวนคงเหลือ', 'จำนวนขั้นต่ำ', 'รายละเอียด']
        const rows = [headers]
        
        if (allProducts.length > 0) {
          allProducts.forEach(p => {
            rows.push([
              p.id,
              p.name,
              p.category || '',
              p.price?.toString() || '0',
              '0', // จำนวนคงเหลือ (เริ่มต้น)
              '5', // จำนวนขั้นต่ำ (เริ่มต้น)
              p.description || ''
            ])
          })
        } else {
          rows.push(['P001', 'ตัวอย่างสินค้า', 'ทั่วไป', '100', '10', '5', 'คำอธิบายตัวอย่าง'])
        }

        const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(`${sheet}!A1`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`
        
        await fetch(appendUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: rows }),
        })

        items = rowsToObjects(rows)
      } catch (initErr) {
        console.error('Auto-Initialize failed:', initErr)
      }
    }

    const QTY_KEYS = ['จำนวนคงเหลือ','qty','quantity','คงเหลือ','จำนวน']
    const MIN_KEYS = ['จำนวนขั้นต่ำ','min_qty','minimum','ขั้นต่ำ']
    const getVal = (item, keys) => { for (const k of keys) if (item[k] !== undefined && item[k] !== '') return item[k]; return null }

    const lowStock  = items.filter(i => { const q = parseInt(getVal(i,QTY_KEYS)??0); const m = parseInt(getVal(i,MIN_KEYS)??5); return q > 0 && q <= m })
    const outOfStock = items.filter(i => parseInt(getVal(i,QTY_KEYS)??0) <= 0)

    return NextResponse.json({
      success: true, sheetName: sheet, fetchedAt: new Date().toISOString(),
      stats: { totalItems: items.length, lowStockCount: lowStock.length, outOfStockCount: outOfStock.length },
      items,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

// ─── PUT /api/inventory — เพิ่มรายการใหม่ (append row) ───────────────────────
export async function PUT(request) {
  try { await requireAdmin() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  try {
    const { sheet = 'Inventory', values } = await request.json()
    if (!values || !Array.isArray(values)) throw new Error('values ต้องเป็น array')
    if (!SHEET_ID) throw new Error('GOOGLE_SHEET_ID ยังไม่ได้ตั้งค่า')

    const token = await getServiceAccountToken()
    const encoded = encodeURIComponent(`${sheet}!A1`)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encoded}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`

    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [values] }),
    })

    if (!res.ok) throw new Error(`Sheets write error ${res.status}: ${await res.text()}`)
    const data = await res.json()

    return NextResponse.json({ success: true, updatedRange: data.updates?.updatedRange }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

// ─── DELETE /api/inventory — ลบแถวตาม rowIndex ───────────────────────────────
export async function DELETE(request) {
  try { await requireAdmin() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  try {
    const { searchParams } = new URL(request.url)
    const rowIndex = parseInt(searchParams.get('row'), 10) // 1-based row index ใน Sheet
    const sheetGid = parseInt(searchParams.get('gid') || '0', 10) // Sheet tab ID

    if (!rowIndex || rowIndex < 2) throw new Error('row ต้องมากกว่า 1 (แถวแรกเป็น header)')
    if (!SHEET_ID) throw new Error('GOOGLE_SHEET_ID ยังไม่ได้ตั้งค่า')

    const token = await getServiceAccountToken()
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`

    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetGid,
              dimension: 'ROWS',
              startIndex: rowIndex - 1, // 0-based
              endIndex: rowIndex,       // exclusive
            },
          },
        }],
      }),
    })

    if (!res.ok) throw new Error(`Sheets delete error ${res.status}: ${await res.text()}`)

    return NextResponse.json({ success: true, deletedRow: rowIndex }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

// ─── POST /api/inventory — ดึงรายชื่อ Sheet tabs ─────────────────────────────
export async function POST() {
  try { await requireAdmin() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  try {
    if (!SHEET_ID || !API_KEY) throw new Error('GOOGLE_SHEET_ID หรือ GOOGLE_SHEETS_API_KEY ยังไม่ได้ตั้งค่า')

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}&fields=sheets.properties`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Sheets API error ${res.status}`)

    const data = await res.json()
    const sheets = (data.sheets || []).map(s => ({
      id: s.properties.sheetId,
      title: s.properties.title,
    }))

    return NextResponse.json({ success: true, sheets }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

// ─── PATCH /api/inventory — อัปเดตข้อมูลเซลล์ (ตัดสต็อก) ──────────────────────
export async function PATCH(request) {
  try { await requireAdmin() }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  try {
    const { sheet = 'Inventory', range, value } = await request.json()
    
    // --- Security Validation ---
    if (!range || value === undefined) throw new Error('ต้องระบุ range และ value')
    
    // ป้องกัน Injection ผ่าน Range (อนุญาตเฉพาะตัวอักษรและตัวเลข เช่น A2, Z99)
    if (!/^[a-zA-Z]+[0-9]+$/.test(range)) {
      throw new Error('รูปแบบ Range ไม่ถูกต้อง ป้องกันการโจมตี (Invalid Range Format)')
    }

    // ป้องกันการยัดสคริปต์ (XSS / Type Manipulation) ใน Value
    const numericValue = parseInt(value, 10)
    if (isNaN(numericValue) || numericValue < 0) {
      throw new Error('จำนวนสต็อกต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0 เท่านั้น')
    }
    // ----------------------------

    if (!SHEET_ID) throw new Error('GOOGLE_SHEET_ID ยังไม่ได้ตั้งค่า')

    const token = await getServiceAccountToken()
    const encoded = encodeURIComponent(`${sheet}!${range}`)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encoded}?valueInputOption=USER_ENTERED`

    const res = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [[value]] }),
    })

    if (!res.ok) throw new Error(`Sheets update error ${res.status}: ${await res.text()}`)
    const data = await res.json()

    return NextResponse.json({ success: true, updatedRange: data.updatedRange }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

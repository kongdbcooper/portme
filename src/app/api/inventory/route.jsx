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

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ================= ENV =================
const SHEET_ID = process.env.GOOGLE_SHEET_ID
const SA_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const SA_KEY   = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

// ================= GUARD =================
function ensureEnv() {
  if (!SHEET_ID) throw new Error('Missing GOOGLE_SHEET_ID')
  if (!SA_EMAIL || !SA_KEY) throw new Error('Missing SERVICE ACCOUNT ENV')
}

// ================= TOKEN =================
async function getServiceAccountToken() {
  ensureEnv()

  const privateKey = createPrivateKey(SA_KEY.replace(/\\n/g, '\n'))
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

  const text = await res.text()
  if (!res.ok) throw new Error(text)

  return JSON.parse(text).access_token
}

// ================= SAFE FETCH =================
async function sheetsFetch(url, options = {}) {
  const res = await fetch(url, options)
  const text = await res.text()

  // ❗ กัน HTML error page
  if (!text.trim().startsWith('{')) {
    throw new Error(`Google API invalid response: ${text.slice(0, 200)}`)
  }

  const data = JSON.parse(text)
  if (!res.ok) throw new Error(data.error?.message || 'Sheets API error')

  return data
}

// ================= HELPERS =================
const encodeRange = (sheet, range) =>
  encodeURIComponent(`'${sheet}'!${range}`)

function rowsToObjects(values) {
  if (!values || values.length < 2) return []

  const [headers, ...rows] = values

  return rows.map((row, idx) => {
    const obj = { _rowIndex: idx + 2 }
    headers.forEach((h, i) => {
      obj[h?.trim() || `col_${i}`] = row[i] ?? ''
    })
    return obj
  })
}

// ================= GET =================
export async function GET(req) {
  try {
    await requireAdmin()
    ensureEnv()

    const { searchParams } = new URL(req.url)
    const sheet = searchParams.get('sheet') || 'Inventory'
    const range = searchParams.get('range') || 'A1:Z1000'

    const token = await getServiceAccountToken()

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeRange(sheet, range)}`

    const data = await sheetsFetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })

    return NextResponse.json({
      success: true,
      items: rowsToObjects(data.values),
      fetchedAt: new Date().toISOString(),
    })

  } catch (err) {
    console.error('GET ERROR:', err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}

// ================= POST (sheets tabs) =================
export async function POST() {
  try {
    await requireAdmin()
    ensureEnv()

    const token = await getServiceAccountToken()

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties`

    const data = await sheetsFetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const sheets = (data.sheets || []).map(s => ({
      id: s.properties.sheetId,
      title: s.properties.title
    }))

    return NextResponse.json({ success: true, sheets })

  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}

// ================= PUT =================
export async function PUT(req) {
  try {
    await requireAdmin()
    ensureEnv()

    const { sheet = 'Inventory', values } = await req.json()
    if (!Array.isArray(values)) throw new Error('values must be array')

    const token = await getServiceAccountToken()

    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${sheet}'!A1:append?valueInputOption=USER_ENTERED`

    const data = await sheetsFetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [values] })
    })

    return NextResponse.json({
      success: true,
      updatedRange: data.updates?.updatedRange
    })

  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}

// ================= DELETE =================
export async function DELETE(req) {
  try {
    await requireAdmin()
    ensureEnv()

    const { searchParams } = new URL(req.url)
    const rowIndex = parseInt(searchParams.get('row'), 10)
    const sheetGid = parseInt(searchParams.get('gid') || '0', 10)

    const token = await getServiceAccountToken()

    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`

    await sheetsFetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetGid,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex
            }
          }
        }]
      })
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request) {
  try {
    await requireAdmin()
    ensureEnv()

    const { sheet = 'Inventory', rowIndex } = await request.json()

    if (!rowIndex) {
      throw new Error('missing rowIndex')
    }

    const token = await getServiceAccountToken()

    // ==============================
    // 1. READ CURRENT VALUE (E COLUMN)
    // ==============================
    const readUrl =
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${sheet}'!E${rowIndex}`

    const readRes = await sheetsFetch(readUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const currentValue =
      parseInt(readRes.values?.[0]?.[0] ?? '0', 10)

    if (currentValue <= 0) {
      return NextResponse.json({
        success: false,
        error: 'out of stock'
      }, { status: 400 })
    }

    const newValue = currentValue - 1

    // ==============================
    // 2. WRITE BACK (ATOMIC UPDATE)
    // ==============================
    const writeUrl =
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${sheet}'!E${rowIndex}?valueInputOption=USER_ENTERED`

    const writeRes = await sheetsFetch(writeUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [[newValue]]
      })
    })

    return NextResponse.json({
      success: true,
      oldValue: currentValue,
      newValue,
      updatedRange: writeRes.updatedRange
    })

  } catch (err) {
    console.error('PATCH ERROR:', err)

    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 })
  }
}
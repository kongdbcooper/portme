import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { createPrivateKey } from 'crypto'
import { requireAdmin } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ================= ENV =================
const SHEET_ID = process.env.GOOGLE_SHEET_ID
const SA_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const SA_KEY   = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

// ================= TOKEN =================
async function getServiceAccountToken() {
  if (!SHEET_ID || !SA_EMAIL || !SA_KEY) throw new Error('Missing Google Sheets ENV')

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

// Helper to fetch Google Sheets API securely
async function sheetsFetch(url, options = {}) {
  const res = await fetch(url, options)
  const text = await res.text()

  if (!text.trim().startsWith('{')) {
    throw new Error(`Google API invalid response: ${text.slice(0, 200)}`)
  }

  const data = JSON.parse(text)
  if (!res.ok) throw new Error(data.error?.message || 'Sheets API error')

  return data
}

// ================= GET =================
export async function GET() {
  try {
    await requireAdmin()
    const token = await getServiceAccountToken()
    const sheet = 'store'
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${sheet}'!A:B?majorDimension=ROWS`

    const data = await sheetsFetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    const rows = data.values || []

    // แปลงเป็น array of objects เรียงจากใหม่ -> เก่า
    // เก็บ id: index + 1 เพื่อใช้อ้างอิง row ใน Google Sheets
    const reports = rows.map((row, index) => ({
      id: index + 1,
      timestamp: row[0] || '',
      content: row[1] || '',
    })).reverse()

    return NextResponse.json({ reports, total: reports.length })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ================= DELETE =================
export async function DELETE(req) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const rowIndex = parseInt(searchParams.get('id'), 10)

    if (!rowIndex || isNaN(rowIndex)) {
      return NextResponse.json({ error: 'Missing or invalid report ID' }, { status: 400 })
    }

    const token = await getServiceAccountToken()

    // 1. ดึง metadata ของ sheet เพื่อหา sheetId (gid) ของแผ่นงานชื่อ 'store'
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties`
    const metadata = await sheetsFetch(metadataUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const storeSheet = (metadata.sheets || []).find(
      (s) => s.properties.title === 'store'
    )

    if (!storeSheet) {
      return NextResponse.json({ error: 'Sheet "store" not found' }, { status: 404 })
    }

    const sheetGid = storeSheet.properties.sheetId

    // 2. เรียก batchUpdate เพื่อลบแถวตาม rowIndex (1-based index)
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`

    await sheetsFetch(updateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetGid,
                dimension: 'ROWS',
                startIndex: rowIndex - 1, // 0-based index
                endIndex: rowIndex,
              },
            },
          },
        ],
      }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }
    console.error('Error deleting report:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { createPrivateKey } from 'crypto'

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

// ================= GET =================
export async function GET() {
  try {
    const token = await getServiceAccountToken()
    const sheet = 'store'
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${sheet}'!A:B?majorDimension=ROWS`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    const text = await res.text()
    if (!text.trim().startsWith('{')) {
      throw new Error(`Google API invalid response: ${text.slice(0, 200)}`)
    }

    const data = JSON.parse(text)
    if (!res.ok) throw new Error(data.error?.message || 'Sheets API error')

    const rows = data.values || []

    // แปลงเป็น array of objects เรียงจากใหม่ -> เก่า
    const reports = rows.map((row, index) => ({
      id: index + 1,
      timestamp: row[0] || '',
      content: row[1] || '',
    })).reverse()

    return NextResponse.json({ reports, total: reports.length })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

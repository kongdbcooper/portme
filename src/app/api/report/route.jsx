import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { createPrivateKey } from 'crypto'
import sanitizeHtml from 'sanitize-html'

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

  if (!text.trim().startsWith('{')) {
    throw new Error(`Google API invalid response: ${text.slice(0, 200)}`)
  }

  const data = JSON.parse(text)
  if (!res.ok) throw new Error(data.error?.message || 'Sheets API error')

  return data
}

// ================= TURNSTILE VERIFICATION =================
async function verifyTurnstileToken(token) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY is not set. Skipping verification (Dev mode only).')
    return true
  }

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
  })

  const data = await res.json()
  return data.success
}

export async function POST(request) {
  try {
    const { report, token } = await request.json()

    if (!report) {
      return NextResponse.json({ error: 'Report content is required' }, { status: 400 })
    }

    if (report.length > 2000) {
      return NextResponse.json({ error: 'Report is too long (max 2000 characters)' }, { status: 400 })
    }

    if (!token) {
      return NextResponse.json({ error: 'CAPTCHA token is required' }, { status: 400 })
    }

    const isValidCaptcha = await verifyTurnstileToken(token)
    if (!isValidCaptcha) {
      return NextResponse.json({ error: 'Invalid CAPTCHA' }, { status: 400 })
    }

    // Sanitize input to prevent XSS
    const sanitizedReport = sanitizeHtml(report, {
      allowedTags: [], // Strip all HTML tags
      allowedAttributes: {}
    })

    const googleToken = await getServiceAccountToken()
    const sheet = 'store' // ระบุชื่อชีตที่ต้องการบันทึก
    const timestamp = new Date().toISOString()
    const values = [timestamp, sanitizedReport] // บันทึกลง 2 คอลัมน์

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/'${sheet}'!A1:append?valueInputOption=USER_ENTERED`

    await sheetsFetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [values] })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in report API:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

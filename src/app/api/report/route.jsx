's'

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

function ensureEnv() {
  if (!SHEET_ID || !SA_EMAIL || !SA_KEY) {
    throw new Error('Missing Google Sheets ENV')
  }
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

// ================= SAFE SHEETS =================
async function sheetsFetch(url, options) {
  const res = await fetch(url, options)
  const text = await res.text()

  if (!text.trim().startsWith('{')) {
    throw new Error('Invalid Google API response')
  }

  const data = JSON.parse(text)
  if (!res.ok) throw new Error(data.error?.message || 'Sheets API error')

  return data
}

// ================= TURNSTILE =================
async function verifyTurnstile(token) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true

  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${token}`,
    }
  )

  const data = await res.json()
  return data.success
}

// ================= POST =================
export async function POST(req) {
  try {
    const { report, token } = await req.json()

    if (!report) {
      return NextResponse.json({ error: 'Missing report' }, { status: 400 })
    }

    if (!token) {
      return NextResponse.json({ error: 'Missing CAPTCHA' }, { status: 400 })
    }

    const captchaOk = await verifyTurnstile(token)
    if (!captchaOk) {
      return NextResponse.json({ error: 'Invalid CAPTCHA' }, { status: 400 })
    }

    const clean = sanitizeHtml(report, {
      allowedTags: [],
      allowedAttributes: {},
    })

    const googleToken = await getServiceAccountToken()

    const sheet = 'store'
    const timestamp = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    })

    const values = [timestamp, clean]

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheet}!A1:append?valueInputOption=USER_ENTERED`

    await sheetsFetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${googleToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [values] }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    )
  }
}

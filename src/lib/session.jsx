// =============================================================================
// src/lib/session.js — JWT Session Management
// ใช้ jose library สำหรับ JWT (Edge Runtime compatible)
// ใช้งานร่วมกับ: src/app/api/auth/**, src/middleware.js, src/lib/auth.js
// =============================================================================

import 'server-only' // ป้องกันไม่ให้ import บน client side

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// Secret key สำหรับ sign JWT — MUST be set in .env.local (critical security requirement)
const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey || '')

// SECURITY: ตรวจสอบ SESSION_SECRET เฉพาะตอนจะ sign token
// เพื่อไม่ให้แอพแครชทั้งหน้า layout ตอนแค่ต้องการเช็ค session (จะทำให้ redirect พัง)
if (!secretKey) {
  console.warn('[Session] WARNING: SESSION_SECRET environment variable is not set. JWT signing will fail.');
} else if (secretKey.length < 32) {
  console.warn(`[Session] WARNING: SESSION_SECRET is too short (${secretKey.length} chars, need ≥32).`);
}

// Session duration: 7 วัน
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

// ------------------- Encrypt Session -------------------
// สร้าง JWT token จาก payload (userId, role, email)
export async function encrypt(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

// ------------------- Decrypt Session -------------------
// ตรวจสอบและถอดรหัส JWT token
export async function decrypt(session) {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    // Token หมดอายุหรือ invalid
    return null
  }
}

// ------------------- Create Session Cookie -------------------
// ตั้งค่า session cookie หลัง login สำเร็จ
// HttpOnly + Secure + SameSite = ป้องกัน XSS และ CSRF
export async function createSession(userId, role, email) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  // สร้าง JWT พร้อม payload ที่จำเป็น (ไม่ใส่ข้อมูล sensitive)
  const session = await encrypt({
    userId,
    role,       // ADMIN หรือ USER — ใช้ตรวจ authorization
    email,
    expiresAt: expiresAt.toISOString(),
  })

  console.debug(`[Session] Created JWT token (length: ${session.length})`)

  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,                                    // JS client ไม่อ่านได้ (XSS protection)
    secure: process.env.NODE_ENV === 'production',     // HTTPS เฉพาะ production
    expires: expiresAt,
    sameSite: 'strict',                                // Strict CSRF protection (no cross-site cookies)
    path: '/',
  })
  console.log(`[Session] Cookie set successfully. Expires: ${expiresAt.toISOString()}`)
}

// ------------------- Update Session Cookie -------------------
// ต่ออายุ session เมื่อ user ยังใช้งานอยู่
export async function updateSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!session || !payload) return null

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  // Refresh token
  const newSession = await encrypt({
    ...payload,
    expiresAt: expiresAt.toISOString(),
  })

  cookieStore.set('session', newSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'strict',
    path: '/',
  })

  return payload
}

// ------------------- Delete Session -------------------
// ลบ session cookie เมื่อ logout
export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

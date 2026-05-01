// =============================================================================
// src/lib/auth.js — Authentication Helper Functions
// ใช้ดึง session ปัจจุบันใน Server Components และ API routes
// ใช้งานร่วมกับ: src/lib/session.js, src/app/api/**, src/app/admin/**
// =============================================================================

import 'server-only'

import { cookies } from 'next/headers'
import { decrypt } from './session'

// ------------------- Get Current Session -------------------
// ดึงข้อมูล session ของ user ที่ login อยู่
// return: { userId, role, email, expiresAt } หรือ null
export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value

  if (!session) {
    console.debug('[Auth] No session cookie found')
    return null
  }

  const payload = await decrypt(session)
  if (!payload) {
    console.warn('[Auth] Failed to decrypt session')
  }
  return payload
}

// ------------------- Check Admin Role -------------------
// ตรวจสอบว่า user ปัจจุบันเป็น ADMIN
// ใช้ใน API routes เพื่อ protect endpoints
export async function requireAdmin() {
  const session = await getSession()

  if (!session) {
    console.warn('[Auth] requireAdmin: No session found')
    throw new Error('Unauthorized: No session')
  }

  if (session.role !== 'ADMIN') {
    console.warn(`[Auth] requireAdmin: User role is ${session.role}, not ADMIN`)
    throw new Error('Unauthorized: Admin access required')
  }

  console.debug(`[Auth] requireAdmin: Admin access granted for ${session.email}`)
  return session
}

// ------------------- Check Authenticated -------------------
// ตรวจสอบว่า user ได้ login แล้ว (ไม่ต้องเป็น admin)
export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized: Please login')
  }

  return session
}

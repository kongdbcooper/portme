import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// หมายเหตุ: ถอด prisma ออกจากไฟล์นี้ถ้าไม่ได้ใช้ในส่วนอื่น เพื่อลดการเปิด connection ค้าง
// import { prisma } from './prisma' 

const secretKey = process.env.SESSION_SECRET
if (!secretKey || secretKey.length < 32) {
  throw new Error('SESSION_SECRET must be set and at least 32 characters long')
}
const encodedKey = new TextEncoder().encode(secretKey)
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export async function encrypt(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(session) {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    
    // --- ตัดส่วนที่ Query Prisma ออกเพื่อป้องกัน Connection Leak/Timeout ---
    // การเช็ค sessionVersion ให้ไปทำในระดับ Middleware หรือ Server Component เฉพาะจุดที่สำคัญแทน
    
    return payload
  } catch (error) {
    return null
  }
}

export async function createSession(userId, role, email, sessionVersion = 0) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  const session = await encrypt({
    userId,
    role,
    email,
    sessionVersion,
    expiresAt: expiresAt.toISOString(),
  })

  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'strict',
    path: '/',
  })
}

export async function updateSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!session || !payload) return null

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
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

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
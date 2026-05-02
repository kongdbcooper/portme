// =============================================================================
// src/middleware.js — Route Protection Middleware
// รันก่อน request ทุกตัวเพื่อตรวจสอบ authentication และ authorization
// ใช้งานร่วมกับ: src/lib/session.js
// Protected: /admin/* → ต้อง ADMIN role เท่านั้น
// =============================================================================

import { NextResponse } from 'next/server'
import { decrypt } from './lib/session'

// Routes ที่ต้องการ authentication
const PROTECTED_ROUTES = ['/admin']

// Routes สำหรับ auth pages (ถ้า login แล้ว redirect ไป admin)
// Registration is intentionally not supported in this version.
const AUTH_ROUTES = ['/login']

export async function proxy(request) {
  const { pathname } = request.nextUrl

  // ดึง session cookie
  const sessionCookie = request.cookies.get('session')?.value
  const session = sessionCookie ? await decrypt(sessionCookie) : null
  const isAuthenticated = !!session
  const isAdmin = session?.role === 'ADMIN'

  // ------------------- Protect Admin Routes -------------------
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (!isAdmin) {
      // Login แล้วแต่ไม่ใช่ ADMIN → redirect ไปหน้าหลัก (หรือหน้า Error)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // ------------------- Auth Routes Redirect -------------------
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  if (isAuthRoute && isAuthenticated) {
    // ถ้า login แล้ว พยายามเข้าหน้า Login ให้ส่งไปที่ที่เหมาะสม
    const target = isAdmin ? '/admin' : '/'
    return NextResponse.redirect(new URL(target, request.url))
  }

  // ------------------- A/B Testing & Response -------------------
  const response = NextResponse.next()

  // กำหนด A/B Testing cookie ถ้ายังไม่มี
  // ใช้สำหรับสุ่มการแสดงผลที่ frontend
  const abCookie = request.cookies.get('ab_variant')?.value
  if (!abCookie) {
    const newVariant = Math.random() < 0.5 ? 'A' : 'B'
    response.cookies.set('ab_variant', newVariant, {
      httpOnly: false, // เพื่อให้ client JS อ่านได้ (ถ้าจำเป็น)
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 วัน
      sameSite: 'lax',
      path: '/',
    })
  }

  return response
}

// กำหนด paths ที่ middleware จะทำงาน
// ไม่รวม static files, images, และ Next.js internals
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
}

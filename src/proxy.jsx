// =============================================================================
// src/proxy.jsx — Route Protection Proxy (Next.js 16 breaking change)
// Runs before request completion for authentication, authorization, and A/B testing.
// ใช้งานร่วมกับ: src/lib/session.js
// =============================================================================

import { NextResponse } from 'next/server'
import { decrypt } from './lib/session'

// 1. Define public, auth, and admin routes
const PUBLIC_ROUTES = ['/login', '/signup', '/api/auth/login']
const ADMIN_ROUTES = ['/admin']

// CSRF Protection: Check Origin AND Referer for state-changing requests
// This prevents CSRF attacks by validating that the request comes from the same origin
function validateOrigin(req) {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const host = req.headers.get('host')

  // If both Origin and Referer are missing, block the request (suspicious)
  if (!origin && !referer) {
    console.warn('[CSRF] Request missing both Origin and Referer headers')
    return false
  }

  // Check Origin header (preferred)
  if (origin) {
    try {
      const originUrl = new URL(origin)
      if (originUrl.host === host) return true
    } catch (e) {
      console.warn('[CSRF] Invalid Origin header:', e.message)
    }
  }

  // Check Referer header (fallback)
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      if (refererUrl.host === host) return true
    } catch (e) {
      console.warn('[CSRF] Invalid Referer header:', e.message)
    }
  }

  // No valid origin/referer match found → reject
  console.warn('[CSRF] Origin/Referer validation failed', { origin, referer, host })
  return false
}

/**
 * Proxy function — Next.js 16 convention
 */
export async function proxy(req) {
  const path = req.nextUrl.pathname

  // 1. CSRF Protection for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    if (!validateOrigin(req)) {
      return new NextResponse('Invalid Origin (CSRF Protection)', { status: 403 })
    }
  }

  // 2. Check route types
  const isPublicRoute = PUBLIC_ROUTES.includes(path) || path === '/'
  const isAdminRoute = ADMIN_ROUTES.some((route) => path.startsWith(route)) || path.startsWith('/api/admin')

  // 3. Decrypt the session from the cookie
  let session = null
  const sessionCookie = req.cookies.get('session')?.value
  
  if (sessionCookie) {
    try {
      session = await decrypt(sessionCookie)
    } catch (err) {
      console.warn('[Proxy] Session decryption failed:', err.message)
    }
  }

  // 4. Redirect to /login if the user is not authenticated for admin routes
  if (isAdminRoute && !session) {
    const loginUrl = new URL('/login', req.nextUrl)
    loginUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(loginUrl)
  }

  // 5. Check for admin role
  if (isAdminRoute && session?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  // 6. Redirect to /admin if the user is already authenticated as admin and trying to access login
  if (isPublicRoute && session && session.role === 'ADMIN' && path === '/login') {
    return NextResponse.redirect(new URL('/admin', req.nextUrl))
  }

  // ------------------- A/B Testing & Final Response -------------------
  const response = NextResponse.next()

  // กำหนด A/B Testing cookie ถ้ายังไม่มี
  const abCookie = req.cookies.get('ab_variant')?.value
  if (!abCookie) {
    const newVariant = Math.random() < 0.5 ? 'A' : 'B'
    response.cookies.set('ab_variant', newVariant, {
      httpOnly: false, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
      path: '/',
    })
  }

  return response
}

// Proxy Matcher Config
export const config = {
  matcher: [
    // Runs on everything except static assets and auth internal api
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth/logout).*)',
  ],
}
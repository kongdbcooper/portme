import { NextResponse } from 'next/server'
import { decrypt } from './lib/session'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create a new ratelimiter, that allows 5 requests per 10 seconds
let ratelimit = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '10 s'),
      analytics: true,
    })
  } catch (e) {
    console.warn("Upstash Redis initialization failed. Rate limiting is disabled.")
  }
} else {
  console.warn("Upstash Redis credentials missing in .env. Rate limiting is disabled.")
}

// กำหนดเส้นทางต่างๆ ในระบบ
const PUBLIC_ROUTES = ['/login', '/signup']
const ADMIN_PATHS = ['/admin', '/api/admin'] // สำหรับ UI และ CRUD API ของ Admin

/**
 * ฟังก์ชันตรวจสอบความปลอดภัย CSRF
 * ป้องกันการส่ง Request จากโดเมนอื่นที่ไม่ได้อนุญาต
 */
function validateCSRF(req) {
  // ข้ามการเช็คในโหมด Development
  if (process.env.NODE_ENV === 'development') return true

  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  const referer = req.headers.get('referer')

  if (origin) {
    try {
      const originHost = new URL(origin).host
      if (originHost === host) return true
    } catch (e) {
      console.error('[CSRF] Invalid Origin format')
    }
  }

  if (referer) {
    try {
      const refererHost = new URL(referer).host
      if (refererHost === host) return true
    } catch (e) {
      console.error('[CSRF] Invalid Referer format')
    }
  }

  return false
}

/**
 * Next.js 16 Standard Proxy (Interception Layer)
 */
export async function proxy(req) {
  const { pathname } = req.nextUrl
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  
  // Basic origin check: allow localhost for dev, and any vercel.app domain
  const isAllowedOrigin = !origin || origin.includes('localhost') || origin.endsWith('.vercel.app')

  // --- NEW: Security and Rate Limiting for /api routes ---
  if (pathname.startsWith('/api')) {
    // 1. CORS Preflight
    if (req.method === 'OPTIONS') {
      const preflightHeaders = {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
      return NextResponse.json({}, { headers: preflightHeaders })
    }

    // 2. CORS Block unauthorized origins
    if (origin && !isAllowedOrigin) {
      return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 })
    }

    // 3. Rate Limiting Logic
    if (ratelimit) {
      const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
      
      try {
        const { success, limit, reset, remaining } = await ratelimit.limit(ip)
        if (!success) {
          return NextResponse.json({ error: 'Too Many Requests' }, { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
            }
          })
        }
      } catch (err) {
        console.error('Rate limit error:', err.message)
      }
    }
  }
  // --------------------------------------------------------

  const response = NextResponse.next()

  // 1. CSRF Protection สำหรับ POST Request (เช่น Login, Logout)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    if (!validateCSRF(req)) {
      console.warn(`[Security] CSRF Blocked: ${req.method} ${pathname}`)
      return new NextResponse(
        JSON.stringify({ error: 'Security breach: Invalid Origin detected.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // 2. Session Decryption & Validation
  let session = null
  const sessionCookie = req.cookies.get('session')?.value

  if (sessionCookie) {
    try {
      session = await decrypt(sessionCookie)

      // If decrypt returns null (expired/invalid token or version mismatch), treat as invalid
      if (!session) throw new Error('Invalid or expired session')

      /**
       * ฟีเจอร์ตรวจสอบรหัสผ่านแบบใช้ Seed:
       * เพื่อรองรับฟีเจอร์เปลี่ยนรหัสผ่านของคุณ หาก Seed ใน Session ไม่ตรงกับค่าปัจจุบัน
       * ระบบจะถือว่า Session หมดอายุทันที เพื่อความปลอดภัย
       */
      if (session.passwordSeed && session.currentSeed && session.currentSeed !== session.passwordSeed) {
         throw new Error('Password seed changed - session invalidated')
      }
    } catch (err) {
      console.error('[Proxy] Session rejected:', err.message)

      // ถ้าเป็น API ให้ส่ง 401 Unauthorized
      if (pathname.startsWith('/api/')) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      }

      // ถ้าเป็นหน้าเว็บปกติ ให้ Redirect ไปหน้า Login และลบ Cookie ทิ้ง
      const loginUrl = new URL('/login', req.nextUrl)
      const responseWithClear = NextResponse.redirect(loginUrl)
      responseWithClear.cookies.delete('session')
      return responseWithClear
    }
  }

  // 3. Routing Logic (Authorization)
  const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path))
  const isPublicPath = PUBLIC_ROUTES.includes(pathname)

  // กรณี: พยายามเข้าถึงส่วนของ Admin แต่ไม่มี Session (หรือยังไม่ได้ Login)
  if (isAdminPath && !session) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'Admin access required' }), { status: 401 })
    }
    const loginUrl = new URL('/login', req.nextUrl)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // กรณี: มี Session แต่ Role ไม่ใช่ ADMIN และพยายามเข้าหน้า Admin
  if (isAdminPath && session?.role !== 'ADMIN') {
    console.warn(`[Auth] Forbidden access by ${session?.email || 'unknown'}`)
    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  // กรณี: ถ้าเป็น Admin อยู่แล้ว ไม่ต้องให้เข้าหน้า Login/Signup ซ้ำ
  if (isPublicPath && session?.role === 'ADMIN') {
    return NextResponse.redirect(new URL('/admin', req.nextUrl))
  }

  // 4. Security Enhancements (Headers)
  if (origin && isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

/**
 * Matcher Configuration
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}

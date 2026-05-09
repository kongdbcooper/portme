// =============================================================================
// src/app/(auth)/login/page.js — Login Page
// หน้า login สำหรับ Admin พร้อม glassmorphism design
// ใช้งานร่วมกับ: src/app/api/auth/login/route.js, src/middleware.js
//               src/app/globals.css
// =============================================================================

'use client'

import { useState, useActionState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Server Action สำหรับ login
async function loginAction(prevState, formData) {
  const email = formData.get('email')
  const password = formData.get('password')

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { error: data.error || 'เข้าสู่ระบบไม่สำเร็จ' }
    }

    return { success: true, redirectTo: data.redirectTo }
  } catch {
    return { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }
  }
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/admin'
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, isPending] = useActionState(loginAction, undefined)

  // Redirect เมื่อ login สำเร็จ (ย้ายเข้า useEffect เพื่อป้องกัน Error)
  useEffect(() => {
    if (state?.success) {
      router.push(callbackUrl)
    }
  }, [state, callbackUrl, router])

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #111118 50%, #1a1a2e 100%)' }}
    >
      {/* Background orbs */}
      <div
        className="absolute top-1/4 -left-32 w-72 h-72 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #5a6bff, transparent 70%)', filter: 'blur(60px)' }}
      />
      <div
        className="absolute bottom-1/4 -right-32 w-72 h-72 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c4dff, transparent 70%)', filter: 'blur(60px)' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
              <span className="text-white font-bold text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>P</span>
            </div>
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Port<span className="gradient-text">Me</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">เข้าสู่ระบบ</h1>
          <p className="text-gray-500 text-sm">สำหรับ Admin เท่านั้น</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <form action={formAction} className="space-y-5">
            {/* Email */}
            <div>
              <label className="form-label" htmlFor="login-email">อีเมล</label>
              <div className="relative">
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@example.com"
                  className="form-input pl-11"
                  disabled={isPending}
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="form-label" htmlFor="login-password">รหัสผ่าน</label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="form-input pl-11 pr-11"
                  disabled={isPending}
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {state?.error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {state.error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isPending}
              className="btn-gradient w-full py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>

        {/* Back to home */}
        <p className="text-center mt-6 text-gray-600 text-sm">
          <Link href="/" className="text-brand-400 hover:text-brand-300 transition-colors">
            ← กลับสู่หน้าหลัก
          </Link>
        </p>
      </div>
    </div>
  )
}

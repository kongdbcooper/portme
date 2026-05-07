// =============================================================================
// src/components/admin/AdminHeader.js — Admin Dashboard Header
// Header สำหรับ admin dashboard พร้อม logout button
// =============================================================================

'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminHeader() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
      router.refresh()
    } catch {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 px-6 lg:px-8 py-4"
      style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center justify-between">
        <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
        <div className="flex-1 lg:flex-none">
          <h1 className="text-white font-semibold text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Admin Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Logged in as Admin
          </span>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </header>
  )
}
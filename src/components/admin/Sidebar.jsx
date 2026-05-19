// =============================================================================
// src/components/admin/Sidebar.js — Admin Dashboard Sidebar
// แสดงเมนู navigation สำหรับ Admin พร้อม logout
// ใช้งานร่วมกับ: src/app/admin/layout.js, src/app/api/auth/logout/route.js
// =============================================================================

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import EditableBlock from './EditableBlock'

// เมนู sidebar สำหรับ Admin
const MENU_ITEMS = [
  {
    label: 'ภาพรวม',
    href: '/admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'โปรดักซ์ทั้งหมด',
    href: '/admin/products',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: 'เพิ่มโปรดักซ์',
    href: '/admin/products/new',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    label: 'จัดการวิดีโอ',
    href: '/admin/videos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'A/B Testing',
    href: '/admin/ab-test',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'การวิเคราะห์ข้อมูล',
    href: '/admin/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    label: 'จัดการแบนเนอร์',
    href: '/admin/banners',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'คลังสินค้า',
    href: '/admin/inventory',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2M8 4v4h8V4M8 4h8M9 14h6M9 17h6" />
      </svg>
    ),
  },
  {
    label: 'ตั้งค่าเว็บไซต์',
    href: '/admin/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function Sidebar({ user, logoUrl, siteName }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Logout function
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

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-white/5">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="relative h-12 flex items-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-full w-auto object-contain drop-shadow-[0_4px_12px_rgba(90,107,255,0.3)] transition-transform group-hover:scale-110 duration-300"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-brand flex items-center justify-center shadow-lg shadow-brand-500/20">
                <span className="text-white font-bold text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>M</span>
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {siteName || 'Monkey'} <span className="gradient-text">Admin</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-brand-400 font-bold opacity-80">
              Control Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 mb-3">
          <EditableBlock as="span" settingKey="sidebar_main_menu" defaultText="เมนูหลัก" />
        </p>
        {MENU_ITEMS.map(({ label, href, icon }) => {
          const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setIsMobileOpen(false)}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              {icon}
              <span><EditableBlock as="span" settingKey={`sidebar_menu_${href.replace(/[^a-zA-Z0-9]/g,'_')}_label`} defaultText={label} /></span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />}
            </Link>
          )
        })}
      </nav>

      {/* User info + Logout */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="glass-card p-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-sm font-bold text-brand-300">
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.email || 'Admin'}</p>
              <p className="text-brand-400 text-xs"><EditableBlock as="span" settingKey="sidebar_user_role" defaultText="Administrator" /></p>
            </div>
          </div>
        </div>
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {isLoggingOut ? <EditableBlock as="span" settingKey="sidebar_logout_in_progress" defaultText="กำลังออก..." /> : <EditableBlock as="span" settingKey="sidebar_logout" defaultText="ออกจากระบบ" />}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 z-40 border-r border-white/5"
        style={{ background: 'linear-gradient(180deg, #111118 0%, #0d0d18 100%)' }}>
        {sidebarContent}
      </aside>

      {/* Mobile Toggle Button */}
      <button
        id="sidebar-mobile-toggle"
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-surface-800 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle sidebar"
      >
        {isMobileOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 border-r border-white/5 animate-slide-in-left"
            style={{ background: 'linear-gradient(180deg, #111118 0%, #0d0d18 100%)' }}>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}

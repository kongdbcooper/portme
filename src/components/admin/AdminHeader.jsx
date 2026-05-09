// =============================================================================
// src/components/admin/AdminHeader.js — Admin Dashboard Header
// Header สำหรับ admin dashboard พร้อม logout button
// =============================================================================

'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import EditableBlock from './EditableBlock'

export default function AdminHeader() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
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
      <div className="lg:hidden w-10" /> 
      <div className="flex-1 lg:flex-none">
        {/* Static title to avoid inline-edit interaction on dashboard */}
        <div className="text-white font-semibold text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Admin Dashboard
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <EditableBlock settingKey="admin_logged_label" defaultText="Logged in as Admin" />
        </span>

        {/* วิธีแก้: แยกส่วน Editable ออกจาก Button เพื่อไม่ให้ปุ่มซ้อนกัน */}
        <div className="flex items-center gap-2">
           <div className="text-xs text-gray-500">
              <EditableBlock 
                settingKey={isLoggingOut ? "admin_logout_loading" : "admin_logout_label"} 
                defaultText={isLoggingOut ? "Logging out..." : "Logout"} 
              />
           </div>
           <button
             onClick={handleLogout}
             disabled={isLoggingOut}
             className="px-2 py-1 text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors disabled:opacity-50"
           >
             ยืนยัน
           </button>
        </div>
      </div>
    </div>
  </header>
  )
}
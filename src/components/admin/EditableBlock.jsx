'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// =============================================================================
// EditableBlock Component
// สำหรับ Admin เพื่อแก้ไขข้อความต่างๆ บนหน้าเว็บแบบ Inline 
// จะตรวจจับสิทธิ์ Admin จาก /api/auth/me
// =============================================================================
export default function EditableBlock({ settingKey, defaultText, as: Component = 'span', className = '', multiline = false }) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(() => defaultText || '')
  const [isLoading, setIsLoading] = useState(false)

  // ตรวจสอบสิทธิ์ Admin เมื่อ Component โหลดฝั่ง Client
  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated && data.role === 'ADMIN') {
            setIsAdmin(true)
          }
        }
      } catch (e) {
        console.error('Failed to check auth status', e)
      }
    }
    checkAdmin()
  }, [])

  // Sync กับ defaultText หากมีการโหลดข้อมูลใหม่
  // Avoid synchronous setState in effect to prevent cascading renders.
  useEffect(() => {
    if (isEditing) return // don't overwrite while editing
    if ((defaultText ?? '') === text) return
    const id = setTimeout(() => {
      setText(defaultText ?? '')
    }, 0)
    return () => clearTimeout(id)
  })

  const handleSave = async () => {
    if (text === (defaultText ?? '')) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: settingKey, value: text })
      })

      if (res.ok) {
        setIsEditing(false)
        router.refresh() // รีโหลด cache ของหน้าเว็บทันที
      } else {
        alert('บันทึกไม่สำเร็จ กรุณาลองใหม่')
      }
    } catch (e) {
      console.error(e)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setIsLoading(false)
    }
  }

  // หากไม่ได้เป็น Admin หรือกำลังไม่ได้แก้ไข ให้แสดงข้อความปกติ
  const content = (text?.trim() || defaultText?.trim());
  if (!isAdmin) {
    if (!content) return null; // Hide entirely if no content for public users
    return <Component className={className}>{content}</Component>
  }

  // โหมดแสดงข้อความ + Hover Effect สำหรับ Admin
  const hasContent = (text?.trim() || defaultText?.trim());
  
  if (!isEditing) {
    return (
      <Component
        className={`${className} cursor-pointer hover:ring-2 hover:ring-brand-500 hover:ring-offset-2 hover:ring-offset-surface-900 rounded transition-all duration-200 relative group min-w-[20px] min-h-[1em] inline-block ${!hasContent ? 'border-2 border-dashed border-brand-500/30 px-4 py-1' : ''}`}
        onClick={() => setIsEditing(true)}
        title="คลิกเพื่อแก้ไข (Admin Only)"
      >
        {hasContent ? (text || defaultText) : <span className="opacity-50 italic">คลิกเพื่อเพิ่มข้อความ</span>}
        
        {/* Edit Badge - Premium Pill Style (Always visible on hover) */}
        <span className="absolute -top-7 -right-2 bg-brand-500 text-white text-[12px] px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none font-black uppercase tracking-tighter shadow-[0_10px_20px_rgba(90,107,255,0.5)] z-[70] flex items-center justify-center gap-1.5 scale-90 group-hover:scale-100 border border-white/30 whitespace-nowrap min-w-fit">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span className="leading-none inline-block">EDIT</span>
        </span>
      </Component>
    )
  }

  // โหมดแก้ไขข้อความ
  const isGradient = className.includes('gradient-text') || className.includes('animated-gradient-text');
  
  return (
    <div className={`relative inline-block w-full max-w-full group/edit ${className}`}>
      {multiline ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-transparent border-b-2 border-brand-500/50 focus:border-brand-500 focus:outline-none focus:ring-0 p-0 m-0 resize-y transition-all"
          style={{ 
            fontSize: 'inherit', 
            fontWeight: 'inherit', 
            lineHeight: 'inherit',
            color: '#fff', // Force white text color for visibility
            fontFamily: 'inherit',
            textAlign: 'inherit',
            letterSpacing: 'inherit',
            minHeight: '1.5em'
          }}
          autoFocus
        />
      ) : (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-transparent border-b-2 border-brand-500/50 focus:border-brand-500 focus:outline-none focus:ring-0 p-0 m-0 transition-all"
          style={{ 
            fontSize: 'inherit', 
            fontWeight: 'inherit', 
            lineHeight: 'inherit',
            color: '#fff', // Force white text color for visibility
            fontFamily: 'inherit',
            textAlign: 'inherit',
            letterSpacing: 'inherit'
          }}
          autoFocus
        />
      )}
      
      {/* Controls - Floating Toolbar Style */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-20 md:-bottom-16 flex items-center gap-4 z-[100] p-2 bg-surface-900/95 backdrop-blur-3xl rounded-3xl border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-4 duration-300 min-w-max">
        <button
          onClick={() => {
            setText(defaultText || '')
            setIsEditing(false)
          }}
          className="flex items-center justify-center w-12 h-12 md:w-10 md:h-10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-2xl transition-all"
          title="ยกเลิก (Esc)"
          disabled={isLoading}
        >
          <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="w-[1px] h-8 md:h-6 bg-white/10 mx-1" />
        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 px-8 md:px-6 h-12 md:h-10 bg-brand-500 hover:bg-brand-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-brand-500/40 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="w-5 h-5 md:w-4 md:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm md:text-xs">บันทึก</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

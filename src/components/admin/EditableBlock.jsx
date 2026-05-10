"use client"

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

// =============================================================================
// EditableBlock Component
// =============================================================================
export default function EditableBlock({ settingKey, defaultText, as: Component = 'span', className = '', multiline = false }) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(() => defaultText || '')
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef(null)
  const [toolbarPos, setToolbarPos] = useState(null)

  // 1. ตรวจสอบสิทธิ์ Admin
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

  // 2. Sync กับ defaultText เมื่อมีการโหลดข้อมูลใหม่
  useEffect(() => {
    if (isEditing) return
    if ((defaultText ?? '') === text) return
    const id = setTimeout(() => {
      setText(defaultText ?? '')
    }, 0)
    return () => clearTimeout(id)
  }, [defaultText, isEditing, text])

  // 3. รวม useLayoutEffect ไว้ที่เดียวและวางไว้ก่อน Early Return
  useLayoutEffect(() => {
    function updatePos() {
      const el = wrapperRef.current
      if (!el) {
        setToolbarPos(null)
        return
      }
      const rect = el.getBoundingClientRect()
      setToolbarPos({
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
      })
    }

    if (isAdmin) {
      updatePos()
      window.addEventListener('resize', updatePos)
      window.addEventListener('scroll', updatePos, true)
    }

    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [isAdmin, isEditing, text, defaultText])

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
        router.refresh()
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

  const content = (text?.trim() || defaultText?.trim())

  // --- Early Returns สำหรับคนที่ไม่ใช่ Admin ---
  if (!isAdmin) {
    if (!content) return null
    return <Component className={className}>{content}</Component>
  }

  // --- โหมด Admin: แสดงปกติ (ไม่ได้แก้ไข) ---
  if (!isEditing) {
    const hasContent = !!content
    return (
      <Component
        ref={wrapperRef}
        className={`${className} cursor-pointer hover:ring-2 hover:ring-brand-500 hover:ring-offset-2 hover:ring-offset-surface-900 rounded transition-all duration-200 relative group min-w-[20px] min-h-[1em] inline-block ${!hasContent ? 'border-2 border-dashed border-brand-500/30 px-4 py-1' : ''}`}
        onClick={() => setIsEditing(true)}
        title="คลิกเพื่อแก้ไข (Admin Only)"
      >
        {hasContent ? (text || defaultText) : <span className="opacity-50 italic">คลิกเพื่อเพิ่มข้อความ</span>}
        
        {/* Edit Badge Portal - แสดงเมื่อ Hover */}
        {typeof document !== 'undefined' && toolbarPos && createPortal(
          <div style={{ position: 'fixed', left: (toolbarPos.right - 12) + 'px', top: (toolbarPos.top - 28) + 'px', transform: 'translateX(-50%)', zIndex: 9998 }} className="pointer-events-none">
             <span className="bg-brand-500 text-white text-[12px] px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 font-black uppercase tracking-tighter shadow-lg flex items-center justify-center gap-1.5 border border-white/30">
               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
               </svg>
               EDIT
             </span>
          </div>, document.body
        )}
      </Component>
    )
  }

  // --- โหมด Admin: โหมดแก้ไขข้อความ ---
  return (
    <div ref={wrapperRef} className={`relative inline-block w-full max-w-full group/edit ${className} overflow-visible`}>
      {multiline ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-transparent border-b-2 border-brand-500/50 focus:border-brand-500 focus:outline-none focus:ring-0 p-0 m-0 resize-y transition-all text-white"
          style={{ fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit', minHeight: '1.5em' }}
          autoFocus
        />
      ) : (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-transparent border-b-2 border-brand-500/50 focus:border-brand-500 focus:outline-none focus:ring-0 p-0 m-0 transition-all text-white"
          style={{ fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit' }}
          autoFocus
        />
      )}
      
      {/* Toolbar Portal - ปุ่มบันทึก/ยกเลิก */}
      {typeof document !== 'undefined' && toolbarPos && createPortal(
        <div style={{ position: 'fixed', left: toolbarPos.centerX + 'px', top: toolbarPos.top + 'px', transform: 'translateX(-50%) translateY(-110%)', zIndex: 9999 }}>
          <div className="flex items-center gap-4 p-2 bg-surface-900/95 backdrop-blur-3xl rounded-3xl border border-white/20 shadow-2xl animate-in fade-in duration-200 min-w-max">
            <button
              onClick={() => { setText(defaultText || ''); setIsEditing(false); }}
              className="flex items-center justify-center w-10 h-10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-2xl transition-all"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="w-[1px] h-6 bg-white/10" />
            <button
              onClick={handleSave}
              className="flex items-center justify-center gap-2 px-6 h-10 bg-brand-500 hover:bg-brand-600 text-white font-black rounded-2xl transition-all disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "บันทึก"}
            </button>
          </div>
        </div>, document.body
      )}
    </div>
  )
}
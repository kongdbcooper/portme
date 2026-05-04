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
  const [text, setText] = useState(defaultText || '')
  const [isLoading, setIsLoading] = useState(false)

  // ตรวจสอบสิทธิ์ Admin เมื่อ Component โหลดฝั่ง Client
  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
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
  useEffect(() => {
    setText(defaultText ?? '')
  }, [defaultText])

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
  if (!isAdmin) {
    return <Component className={className}>{text || defaultText}</Component>
  }

  // โหมดแสดงข้อความ + Hover Effect สำหรับ Admin
  if (!isEditing) {
    return (
      <Component
        className={`${className} cursor-pointer hover:ring-2 hover:ring-brand-500 hover:ring-offset-2 hover:ring-offset-surface-900 rounded transition-all duration-200 relative group`}
        onClick={() => setIsEditing(true)}
        title="คลิกเพื่อแก้ไข (Admin Only)"
      >
        {text || defaultText || <span className="opacity-50 italic">คลิกเพื่อเพิ่มข้อความ</span>}
        <span className="absolute -top-3 -right-3 bg-brand-500 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Edit
        </span>
      </Component>
    )
  }

  // โหมดแก้ไขข้อความ
  return (
    <div className={`relative inline-block w-full max-w-full ${className}`}>
      {multiline ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-surface-800/80 text-white border border-brand-500 rounded p-3 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
          rows={4}
          autoFocus
        />
      ) : (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-surface-800/80 text-white border border-brand-500 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
          autoFocus
        />
      )}
      
      <div className="absolute -bottom-12 right-0 flex gap-2 z-50">
        <button
          onClick={() => {
            setText(defaultText || '')
            setIsEditing(false)
          }}
          className="px-3 py-1 text-xs bg-surface-700 hover:bg-surface-600 text-white rounded transition-colors"
          disabled={isLoading}
        >
          ยกเลิก
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-xs bg-brand-500 hover:bg-brand-600 text-white rounded transition-colors flex items-center gap-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : 'บันทึก'}
        </button>
      </div>
    </div>
  )
}

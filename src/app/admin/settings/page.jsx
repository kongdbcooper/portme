// =============================================================================
// src/app/admin/settings/page.js — Site Settings Page
// จัดการการตั้งค่าเว็บไซต์ เช่น Hero Background Image
// =============================================================================

'use client'

import { useState, useEffect } from 'react'
import ImageUploader from '@/components/admin/ImageUploader'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // ------------------- Load Settings -------------------
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings')
        const data = await res.json()
        setSettings(data)
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [])

  // ------------------- Handle Save -------------------
  const saveSetting = async (key, value) => {
    setIsSaving(true)
    setMessage({ type: '', text: '' })
    
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      
      if (res.status === 403) {
        throw new Error('คุณไม่มีสิทธิ์แก้ไขการตั้งค่า (เฉพาะ Admin เท่านั้น)')
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      const data = await res.json()
      if (data.success) {
        setSettings(prev => ({ ...prev, [key]: value }))
        setMessage({ type: 'success', text: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' })
      } else {
        throw new Error(data.error || 'Failed to save')
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          ตั้งค่าเว็บไซต์
        </h1>
        <p className="text-gray-400">จัดการข้อมูลพื้นฐานและธีมของเว็บไซต์</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Hero Section Settings */}
      <section className="glass-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Hero Section</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-400">Hero Background Image</label>
            <ImageUploader 
              folder="settings"
              initialImage={settings.hero_background_url}
              onUploadSuccess={(url) => saveSetting('hero_background_url', url)}
            />
            <p className="text-xs text-gray-500 italic">* แนะนำขนาด 1920x1080px (WebP/JPG) ≤ 5MB</p>
          </div>

          <div className="space-y-4">
             <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-medium text-white mb-3">📋 วิธีการใช้งาน</h3>
                <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                   <li><strong>อัปโหลด:</strong> ลากรูปวางตรงนี้ หรือคลิกเลือกไฟล์</li>
                   <li><strong>บันทึก:</strong> รูปจะบันทึกโดยอัตโนมัติลง Database + R2</li>
                   <li><strong>ลบ:</strong> เลื่อนเมาส์ไปที่รูป แล้วกดปุ่มลบ</li>
                   <li><strong>แสดงผล:</strong> พื้นหลังนี้จะปรากฎบนหน้า Landing ใหม่</li>
                </ul>
             </div>

             {settings.hero_background_url && (
               <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400">
                 ✓ บันทึกรูป Hero Background สำเร็จแล้ว
               </div>
             )}
          </div>
        </div>
      </section>

      {/* อื่นๆ ในอนาคต */}
      <div className="p-6 rounded-2xl border border-dashed border-white/5 text-center">
         <p className="text-gray-600 text-sm italic">ฟีเจอร์อื่นๆ เช่น การแก้ไข Text จะถูกเพิ่มในเวอร์ชันถัดไป</p>
      </div>
    </div>
  )
}

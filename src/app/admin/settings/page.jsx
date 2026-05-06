'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUploader from '@/components/admin/ImageUploader'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const router = useRouter()

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

  const saveMediaSetting = async ({ urlKey, keyKey, successText }, url, key) => {
    setIsSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const responses = await Promise.all([
        fetch('/api/admin/settings', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: urlKey, value: url || '' }),
        }),
        fetch('/api/admin/settings', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: keyKey, value: key || '' }),
        }),
      ])

      const failed = responses.find((res) => !res.ok)
      if (failed) {
        const data = await failed.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      setSettings((prev) => ({
        ...prev,
        [urlKey]: url || '',
        [keyKey]: key || '',
      }))
      setMessage({ type: 'success', text: successText })
      router.refresh()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  const addHeroImage = async (url, key) => {
    setIsSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const current = settings.hero_background_images ? JSON.parse(settings.hero_background_images) : []
      const updated = [...current, { url, key }]

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'hero_background_images', value: JSON.stringify(updated) }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save hero images')
      }

      setSettings((prev) => ({ ...prev, hero_background_images: JSON.stringify(updated) }))
      setMessage({ type: 'success', text: 'Hero background added.' })
      router.refresh()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const removeHeroImage = async (index) => {
    setIsSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const current = settings.hero_background_images ? JSON.parse(settings.hero_background_images) : []
      const updated = current.filter((_, i) => i !== index)

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'hero_background_images', value: JSON.stringify(updated) }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove hero image')
      }

      setSettings((prev) => ({ ...prev, hero_background_images: JSON.stringify(updated) }))
      setMessage({ type: 'success', text: 'Hero background removed.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const saveSiteLogo = (url, key) =>
    saveMediaSetting({
      urlKey: 'site_logo_url',
      keyKey: 'site_logo_key',
      successText: 'Site logo saved.',
    }, url, key)

  // ------------------- Profile Images (carousel) -------------------
  const addProfileImage = async (url, key) => {
    setIsSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const current = settings.prod_profile_images ? JSON.parse(settings.prod_profile_images) : []
      const updated = [...current, { url, key }]

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'prod_profile_images', value: JSON.stringify(updated) }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save profile images')
      }

      setSettings((prev) => ({ ...prev, prod_profile_images: JSON.stringify(updated) }))
      setMessage({ type: 'success', text: 'Profile image added.' })
      router.refresh()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const removeProfileImage = async (index) => {
    setIsSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const current = settings.prod_profile_images ? JSON.parse(settings.prod_profile_images) : []
      const updated = current.filter((_, i) => i !== index)

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'prod_profile_images', value: JSON.stringify(updated) }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove profile image')
      }

      setSettings((prev) => ({ ...prev, prod_profile_images: JSON.stringify(updated) }))
      setMessage({ type: 'success', text: 'Profile image removed.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Site Settings
        </h1>
        <p className="text-gray-400">Manage website media and core display settings.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Site Logo</h2>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
          <h3 className="text-sm font-medium text-white mb-2">Where it appears</h3>
          <ul className="text-xs text-gray-400 flex flex-wrap gap-x-6 gap-y-2 list-disc list-inside">
            <li>The navbar and footer use this same logo setting.</li>
            <li>If no logo is uploaded, the site falls back to the letter P mark.</li>
            <li>Changing the logo also removes the previous R2 logo object.</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Uploader Block */}
          <div className="glass-card p-6 border-brand-500/10">
            <label className="block text-sm font-medium text-gray-300 mb-4">เปลี่ยนโลโก้ไซต์</label>
            <ImageUploader
              folder="settings"
              initialImage={settings.site_logo_url}
              onUpload={({ url, key }) => saveSiteLogo(url, key)}
            />
            <p className="text-xs text-gray-500 italic mt-3">แนะนำ: ขนาด 512x512px (จัตุรัส) หรือแบบแนวยาว (ความสูง 128px) เพื่อความคมชัดและการแสดงผลที่สมบูรณ์ 100%</p>
          </div>

          {/* Current Display Block (Seamless) */}
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-400 mb-6">โลโก้ปัจจุบันที่ใช้งานอยู่</label>
            {settings.site_logo_url ? (
              <div className="space-y-6">
                <div className="flex justify-center items-center py-10 transition-transform hover:scale-105 duration-500">
                  <img 
                    src={settings.site_logo_url} 
                    className="max-w-full max-h-[320px] object-contain drop-shadow-[0_0_35px_rgba(90,107,255,0.25)]" 
                    alt="Current Logo" 
                  />
                </div>
                <div className="flex items-center justify-center gap-2 text-green-400 font-medium">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs uppercase tracking-widest">Active on Site</span>
                </div>
              </div>
            ) : (
              <div className="aspect-[3/4] w-full max-w-[280px] mx-auto border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-gray-600">
                <span className="text-4xl mb-3 opacity-20">🖼️</span>
                <p className="text-xs font-medium opacity-40">ยังไม่ได้ตั้งค่าโลโก้</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12m-9 0a9 9 0 1018 0 9 9 0 10-18 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Profile Images (About Me)</h2>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
          <h3 className="text-sm font-medium text-white mb-1">Profile carousel</h3>
          <p className="text-xs text-gray-400">รูปภาพเหล่านี้จะถูกนำไปแสดงในส่วน "เกี่ยวกับฉัน" โดยจะหมุนเวียนแสดงเป็น Carousel บนหน้าเว็บ</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Uploader Block */}
          <div className="glass-card p-6 border-brand-500/10">
            <label className="block text-sm font-medium text-gray-300 mb-4">เพิ่มรูปโปรไฟล์ใหม่</label>
            <ImageUploader
              folder="settings"
              initialImage={null}
              onUploadSuccess={({ url, key }) => addProfileImage(url, key)}
            />
            <p className="text-xs text-gray-500 italic mt-3">แนะนำ: ขนาด 800x1000px (แนวตั้ง 4:5) เพื่อการแสดงผลบนหน้า About ที่สวยงามคมชัด 100%</p>
          </div>

          {/* Management Block (Seamless) */}
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-400 mb-6">รูปโปรไฟล์ปัจจุบัน</label>
            <div className="grid grid-cols-2 gap-6">
              {(settings.prod_profile_images ? JSON.parse(settings.prod_profile_images) : []).map((img, idx) => (
                <div key={idx} className="relative group aspect-square transition-all duration-500 hover:scale-105">
                  <img 
                    src={img.url} 
                    className="w-full h-full object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.3)]" 
                    alt={`Profile ${idx}`} 
                  />
                  <button
                    onClick={() => removeProfileImage(idx)}
                    className="absolute top-0 right-0 w-8 h-8 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 active:scale-95 z-10"
                    title="ลบรูปภาพ"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {isSaving && (
              <div className="mt-8 flex items-center justify-center gap-3 text-brand-400">
                <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium uppercase tracking-widest">Updating...</span>
              </div>
            )}
            
            {(!settings.prod_profile_images || JSON.parse(settings.prod_profile_images).length === 0) && (
              <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-xs text-gray-600 font-medium opacity-40">ยังไม่ได้เพิ่มรูปโปรไฟล์</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Hero Section</h2>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
          <h3 className="text-sm font-medium text-white mb-1">Hero carousel</h3>
          <p className="text-xs text-gray-400">รูปพื้นหลังของหน้าแรก (Hero Section) หากใส่หลายรูปจะเปลี่ยนแบบ Crossfade อัตโนมัติ</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Uploader Block */}
          <div className="glass-card p-6 border-brand-500/10">
            <label className="block text-sm font-medium text-gray-300 mb-4">เพิ่มรูปพื้นหลัง Hero</label>
            <ImageUploader
              folder="settings"
              initialImage={null}
              onUploadSuccess={({ url, key }) => addHeroImage(url, key)}
            />
            <p className="text-xs text-gray-500 italic mt-3">แนะนำ: ขนาด 1920x1080px (16:9) เพื่อรองรับการแสดงผลภาพพื้นหลังทุกหน้าจอให้เต็มประสิทธิภาพ 100%</p>
          </div>

          {/* Management Block (Seamless) */}
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-400 mb-6">รายการรูปพื้นหลังที่ใช้งานอยู่</label>
            <div className="grid grid-cols-1 gap-8">
              {(settings.hero_background_images ? JSON.parse(settings.hero_background_images) : (settings.hero_background_url ? [{url: settings.hero_background_url}] : [])).map((img, idx) => (
                <div key={idx} className="relative group aspect-video transition-all duration-700 hover:scale-[1.02]">
                  <img 
                    src={img.url} 
                    className="w-full h-full object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.5)] rounded-2xl" 
                    alt={`Hero ${idx}`} 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center rounded-2xl">
                    <button
                      onClick={() => removeHeroImage(idx)}
                      className="px-6 py-2.5 bg-red-500 text-white rounded-full text-xs font-bold shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-600 hover:scale-105 active:scale-95"
                    >
                      ลบรูปภาพนี้ออกจากระบบ
                    </button>
                  </div>
                  <div className="absolute -bottom-4 left-4 px-3 py-1 bg-brand-500/10 backdrop-blur-xl border border-white/10 rounded-full text-[10px] text-brand-400 font-bold uppercase tracking-widest">
                    Hero Frame #{idx + 1}
                  </div>
                </div>
              ))}
            </div>

            {isSaving && (
              <div className="mt-12 flex items-center justify-center gap-3 text-brand-400">
                <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium uppercase tracking-widest">Processing...</span>
              </div>
            )}

            {(!settings.hero_background_images && !settings.hero_background_url) && (
              <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-xs text-gray-600 font-medium opacity-40">ยังไม่มีรูปพื้นหลัง (แสดงธีมมาตรฐาน)</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

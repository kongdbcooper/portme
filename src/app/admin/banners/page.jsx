'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUploader from '@/components/admin/ImageUploader'
import Image from 'next/image'

function BannerItem({ banner, onUpdate, onDelete }) {
  const [title, setTitle] = useState(banner.title || '')
  const [subtitle, setSubtitle] = useState(banner.subtitle || '')
  const [description, setDescription] = useState(banner.description || '')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanged, setHasChanged] = useState(false)

  useEffect(() => {
    setTitle(banner.title || '')
    setSubtitle(banner.subtitle || '')
    setDescription(banner.description || '')
    setHasChanged(false)
  }, [banner])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate(banner.id, { title, subtitle, description })
      setHasChanged(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setTitle(banner.title || '')
    setSubtitle(banner.subtitle || '')
    setDescription(banner.description || '')
    setHasChanged(false)
  }

  return (
    <div className="glass-card p-6 flex flex-col gap-5 border-white/5 hover:border-brand-500/20 transition-all bg-white/2 shadow-lg">
      {/* Image Container - Same styling as Upload Box */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-xl group flex-shrink-0 border border-white/10">
        <Image src={banner.imageUrl} alt="Banner" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
           <button
            onClick={() => onDelete(banner.id)}
            className="w-12 h-12 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-xl"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Compact Form */}
      <div className="space-y-4 w-full">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-brand-400 px-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setHasChanged(true); }}
              placeholder="หัวข้อ..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-brand-400 px-1">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => { setSubtitle(e.target.value); setHasChanged(true); }}
              placeholder="รายละเอียด 1..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500/50"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-brand-400 px-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setHasChanged(true); }}
            placeholder="รายละเอียด 2..."
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-brand-500/50 resize-none"
          />
        </div>

        <div className={`grid gap-3 ${hasChanged ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {hasChanged && (
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="py-3 rounded-xl font-bold text-xs bg-white/10 text-white hover:bg-white/20 transition-all border border-white/5"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanged || isSaving}
            className={`py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
              hasChanged 
                ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/10' 
                : 'bg-white/5 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? "Saving..." : "Update Banner"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const router = useRouter()

  useEffect(() => { fetchBanners() }, [])

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners')
      if (res.ok) setBanners(await res.json())
    } catch (e) { console.error(e) } finally { setIsLoading(false) }
  }

  const addBanner = async (type, url, key) => {
    setMessage({ type: '', text: '' })
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, imageUrl: url, imageKey: key }),
      })
      if (!res.ok) throw new Error('Failed to add')
      await fetchBanners()
      setMessage({ type: 'success', text: 'เพิ่มรูปภาพสำเร็จ!' })
    } catch (err) { setMessage({ type: 'error', text: err.message }) }
  }

  const updateBannerData = async (id, data) => {
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('บันทึกไม่สำเร็จ')
      setBanners(prev => prev.map(b => b.id === id ? { ...b, ...data } : b))
      setMessage({ type: 'success', text: 'บันทึกเรียบร้อย' })
      setTimeout(() => setMessage({ type: '', text: '' }), 2000)
    } catch (err) { alert(err.message) }
  }

  const removeBanner = async (id) => {
    if (!confirm('ยืนยันการลบ?')) return
    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
      if (res.ok) await fetchBanners()
    } catch (err) { alert(err.message) }
  }

  const heroBanners = banners.filter(b => b.type === 'HERO')
  const profileBanners = banners.filter(b => b.type === 'PROFILE')

  if (isLoading) return <div className="p-8 text-white">Loading...</div>

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-32">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Banner Management</h1>
          <p className="text-gray-400 text-sm">จัดการรูปภาพและข้อความสำหรับสไลด์หน้าเว็บ</p>
        </div>
        {message.text && (
          <div className={`px-4 py-2 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {message.text}
          </div>
        )}
      </div>

      {/* HERO SECTION */}
      <section className="space-y-8">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="w-1.5 h-7 bg-brand-500 rounded-full" />
          Hero Banners
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="glass-card p-8 border-white/5 bg-white/2 sticky top-24">
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest opacity-50">Upload New Hero</h3>
            <ImageUploader folder="banners" onUploadSuccess={({ url, key }) => addBanner('HERO', url, key)} />
          </div>
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest opacity-50">Active Banners</h3>
            {heroBanners.length > 0 ? (
              heroBanners.map((banner) => (
                <BannerItem key={banner.id} banner={banner} onUpdate={updateBannerData} onDelete={removeBanner} />
              ))
            ) : (
              <div className="h-48 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center text-gray-600">
                <p>No Hero banners added yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PROFILE SECTION */}
      <section className="space-y-8 pt-16 border-t border-white/10">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="w-1.5 h-7 bg-brand-500 rounded-full" />
          Profile Banners
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="glass-card p-8 border-white/5 bg-white/2 sticky top-24">
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest opacity-50">Upload New Profile</h3>
            <ImageUploader folder="banners" onUploadSuccess={({ url, key }) => addBanner('PROFILE', url, key)} />
          </div>
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest opacity-50">Active Banners</h3>
            {profileBanners.length > 0 ? (
              profileBanners.map((banner) => (
                <BannerItem key={banner.id} banner={banner} onUpdate={updateBannerData} onDelete={removeBanner} />
              ))
            ) : (
              <div className="h-48 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center text-gray-600">
                <p>No Profile banners added yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

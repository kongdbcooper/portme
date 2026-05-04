'use client'

import { useEffect, useState } from 'react'
import ImageUploader from '@/components/admin/ImageUploader'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

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
    <div className="max-w-4xl mx-auto space-y-8">
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

      <section className="glass-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Site Logo</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-400">Logo Image</label>
            <ImageUploader
              folder="settings"
              initialImage={settings.site_logo_url}
              onUpload={({ url, key }) => saveSiteLogo(url, key)}
            />
            <p className="text-xs text-gray-500 italic">Recommended: square PNG/WebP, up to 5MB.</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-white mb-3">Where it appears</h3>
              <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                <li>The navbar and footer use this same logo setting.</li>
                <li>If no logo is uploaded, the site falls back to the letter P mark.</li>
                <li>Changing the logo also removes the previous R2 logo object.</li>
              </ul>
            </div>

            {settings.site_logo_url && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400">
                Site logo is saved.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="glass-card p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12m-9 0a9 9 0 1018 0 9 9 0 10-18 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Profile Images (About Me)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-400">Add Profile Image</label>
            <ImageUploader
              folder="settings"
              initialImage={null}
              onUploadSuccess={({ url, key }) => addProfileImage(url, key)}
            />
            <p className="text-xs text-gray-500 italic">Add multiple images; they will rotate on the public site.</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-white mb-3">Profile carousel</h3>
              <p className="text-xs text-gray-400">Uploaded images are stored in R2 and referenced by the site settings. You can remove images below to delete them from display (R2 object may be removed automatically).</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(settings.prod_profile_images ? JSON.parse(settings.prod_profile_images) : []).map((img, idx) => (
                <div key={idx} className="relative">
                  <img src={img.url} className="w-full h-20 object-cover rounded-md border border-white/10" />
                  <button
                    onClick={() => removeProfileImage(idx)}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {isSaving && (
              <div className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300">
                Saving profile images...
              </div>
            )}
          </div>
        </div>
      </section>

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
            <label className="block text-sm font-medium text-gray-400">Add Hero Background Image</label>
            <ImageUploader
              folder="settings"
              initialImage={null}
              onUploadSuccess={({ url, key }) => addHeroImage(url, key)}
            />
            <p className="text-xs text-gray-500 italic">Add multiple images for a background carousel. Recommended: 1920x1080 WebP/JPG, up to 5MB.</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-white mb-3">Hero carousel</h3>
              <p className="text-xs text-gray-400 mb-2">If multiple images are uploaded, they will crossfade automatically.</p>
              <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                <li>Images upload directly to Cloudflare R2.</li>
                <li>The settings are saved automatically.</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(settings.hero_background_images ? JSON.parse(settings.hero_background_images) : (settings.hero_background_url ? [{url: settings.hero_background_url}] : [])).map((img, idx) => (
                <div key={idx} className="relative group">
                  <img src={img.url} className="w-full h-24 object-cover rounded-md border border-white/10" />
                  <button
                    onClick={() => removeHeroImage(idx)}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {isSaving && (
              <div className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300">
                Saving settings...
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

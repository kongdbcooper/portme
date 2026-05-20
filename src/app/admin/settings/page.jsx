'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUploader from '@/components/admin/ImageUploader'
import Image from 'next/image'

function AdminTeamMemberCard({ member, onUpdate, onRemove, isGlobalSaving }) {
  const [localData, setLocalData] = useState({
    name: member.name || '',
    role: member.role || '',
    desc: member.desc || '',
    url: member.url || '',
    key: member.key || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync with prop changes if modified externally
  useEffect(() => {
    setLocalData({
      name: member.name || '',
      role: member.role || '',
      desc: member.desc || '',
      url: member.url || '',
      key: member.key || ''
    });
  }, [member]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    await onUpdate(member.id, localData);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleImageUpdate = ({ url, key }) => {
    setLocalData(prev => ({ ...prev, url, key }));
  };

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4 relative group">
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-black/40 group/image">
        <Image
          src={localData.url}
          alt={localData.name || 'Team member'}
          fill
          className="object-cover"
          unoptimized
        />
        {/* Overlay to change image */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
          <span className="text-white text-xs font-bold mb-2">เปลี่ยนรูปภาพ</span>
          <ImageUploader folder="about" onUpload={handleImageUpdate} />
        </div>
      </div>
      
      <div className="space-y-3 flex-1">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">ชื่อสมาชิก</label>
          <input
            type="text"
            value={localData.name}
            onChange={(e) => setLocalData({ ...localData, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-brand-500 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">ตำแหน่ง</label>
          <input
            type="text"
            value={localData.role}
            onChange={(e) => setLocalData({ ...localData, role: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-brand-500 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">คำอธิบาย</label>
          <textarea
            value={localData.desc}
            onChange={(e) => setLocalData({ ...localData, desc: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-brand-500 focus:outline-none transition-colors resize-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isGlobalSaving}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 border ${
              saveSuccess 
                ? 'bg-green-500 text-white border-green-500' 
                : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border-emerald-500/20'
            }`}
          >
            {isSaving ? 'กำลังบันทึก...' : saveSuccess ? '✓ บันทึกแล้ว' : 'บันทึกข้อมูล'}
          </button>

          <button
            type="button"
            onClick={() => onRemove(member.id)}
            disabled={isSaving || isGlobalSaving}
            className="flex-1 py-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 text-xs font-bold transition-all disabled:opacity-50"
          >
            ลบสมาชิก
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [accountEmail, setAccountEmail] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [emailChangeStep, setEmailChangeStep] = useState('request')
  const [emailChangeTarget, setEmailChangeTarget] = useState('')
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false)
  const [isVerifyingEmailCode, setIsVerifyingEmailCode] = useState(false)
  const [emailChangeMessage, setEmailChangeMessage] = useState({ type: '', text: '' })
  const router = useRouter()

  useEffect(() => {
    async function fetchSettings() {
      try {
        const [settingsRes, authRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/auth/me', { credentials: 'include' }),
        ])

        const settingsData = await settingsRes.json()
        setSettings(settingsData)

        if (authRes.ok) {
          const authData = await authRes.json()
          setAccountEmail(authData?.user?.email || '')
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const resetEmailChangeForm = () => {
    setPendingEmail('')
    setEmailPassword('')
    setVerificationCode('')
    setEmailChangeStep('request')
    setEmailChangeTarget('')
  }

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
      router.refresh()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const saveSiteLogo = (url, key) =>
    saveMediaSetting({
      urlKey: 'site_logo',
      keyKey: 'site_logo_key',
      successText: 'Site logo saved.',
    }, url, key)

  const saveAboutMainImage = (url, key) =>
    saveMediaSetting({
      urlKey: 'about_image_url',
      keyKey: 'about_image_key',
      successText: 'About Us main image saved.',
    }, url, key)

  const addTeamMember = async (url, key) => {
    setIsSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const current = settings.about_team_images ? JSON.parse(settings.about_team_images) : []
      const newMember = {
        id: Date.now().toString(),
        name: 'ชื่อทีมงานใหม่',
        role: 'ตำแหน่ง',
        desc: 'คำอธิบายสั้นๆ เกี่ยวกับทีมงานคนนี้',
        url,
        key
      }
      const updated = [...current, newMember]

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'about_team_images', value: JSON.stringify(updated) }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add team member')
      }

      setSettings((prev) => ({ ...prev, about_team_images: JSON.stringify(updated) }))
      setMessage({ type: 'success', text: 'เพิ่มสมาชิกทีมเรียบร้อยแล้ว' })
      router.refresh()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const updateTeamMember = async (id, updatedFields) => {
    setIsSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const current = settings.about_team_images ? JSON.parse(settings.about_team_images) : []
      const updated = current.map(m => m.id === id ? { ...m, ...updatedFields } : m)

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'about_team_images', value: JSON.stringify(updated) }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update team member details')
      }

      setSettings((prev) => ({ ...prev, about_team_images: JSON.stringify(updated) }))
      router.refresh()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const removeTeamMember = async (id) => {
    setIsSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const current = settings.about_team_images ? JSON.parse(settings.about_team_images) : []
      const updated = current.filter(m => m.id !== id)

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'about_team_images', value: JSON.stringify(updated) }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove team member')
      }

      setSettings((prev) => ({ ...prev, about_team_images: JSON.stringify(updated) }))
      setMessage({ type: 'success', text: 'ลบสมาชิกทีมเรียบร้อยแล้ว' })
      router.refresh()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsSaving(false)
    }
  }

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
      router.refresh()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const sendEmailChangeCode = async () => {
    setEmailChangeMessage({ type: '', text: '' })

    if (!pendingEmail || !emailPassword) {
      setEmailChangeMessage({ type: 'error', text: 'Please enter the new email and current password.' })
      return
    }

    setIsSendingEmailCode(true)

    try {
      const res = await fetch('/api/admin/change-email/request', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: pendingEmail, currentPassword: emailPassword }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code')
      }

      setVerificationCode('')
      setEmailChangeStep('verify')
      setEmailChangeTarget(data.targetEmail || pendingEmail)
      setEmailChangeMessage({
        type: 'success',
        text: `Verification code sent to ${data.targetEmail || pendingEmail}. The code expires in ${data.expiresInMinutes || 10} minutes.`,
      })
    } catch (error) {
      setEmailChangeMessage({ type: 'error', text: error.message })
    } finally {
      setIsSendingEmailCode(false)
    }
  }

  const verifyEmailChangeCode = async () => {
    setEmailChangeMessage({ type: '', text: '' })

    if (!pendingEmail || !verificationCode) {
      setEmailChangeMessage({ type: 'error', text: 'Please enter the verification code.' })
      return
    }

    setIsVerifyingEmailCode(true)

    try {
      const res = await fetch('/api/admin/change-email/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: pendingEmail, code: verificationCode }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify email change')
      }

      setAccountEmail(data.email || pendingEmail.toLowerCase())
      setEmailChangeMessage({ type: 'success', text: 'Admin email updated successfully.' })
      resetEmailChangeForm()
      router.refresh()
    } catch (error) {
      setEmailChangeMessage({ type: 'error', text: error.message })
    } finally {
      setIsVerifyingEmailCode(false)
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
            <li>The navbar, login page, and admin dashboard all use this same logo setting.</li>
            <li>If no logo is uploaded, the site falls back to the first letter of the site name.</li>
            <li>Changing the logo also removes the previous R2 logo object.</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="glass-card p-6 border-brand-500/10">
            <label className="block text-sm font-medium text-gray-300 mb-4">เปลี่ยนโลโก้ไซต์</label>
            <ImageUploader
              folder="logo"
              initialImage={settings.site_logo}
              onUpload={({ url, key }) => saveSiteLogo(url, key)}
            />
            <p className="text-xs text-gray-500 italic mt-3">แนะนำ: ขนาด 512x512px (จัตุรัส) หรือแบบแนวยาว (ความสูง 128px) เพื่อความคมชัดและการแสดงผลที่สมบูรณ์ 100%</p>
          </div>

          <div className="p-6">
            <label className="block text-sm font-medium text-gray-400 mb-6">โลโก้ปัจจุบันที่ใช้งานอยู่</label>
            {settings.site_logo ? (
              <div className="space-y-6">
                <div className="flex justify-center items-center py-10 transition-transform hover:scale-105 duration-500">
                  <div className="relative w-full max-h-[320px] flex items-center justify-center" style={{ height: '320px' }}>
                    <Image
                      src={settings.site_logo}
                      alt="Current Logo"
                      width={512}
                      height={320}
                      className="max-w-full object-contain drop-shadow-[0_0_35px_rgba(90,107,255,0.25)]"
                    />
                  </div>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">About Us Main Image & Team</h2>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
          <h3 className="text-sm font-medium text-white mb-2">Where it appears</h3>
          <ul className="text-xs text-gray-400 flex flex-wrap gap-x-6 gap-y-2 list-disc list-inside">
            <li>The "About Us" page renders the main image at the top and team members as 3D tilt cards.</li>
            <li>Recommended for main image: High-resolution portrait images (aspect ratio 4:5).</li>
            <li>Removing a member automatically deletes their image file from Cloudflare R2.</li>
          </ul>
        </div>

        {/* About Us Main Image Uploader */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mb-8">
          <div className="glass-card p-6 border-brand-500/10">
            <label className="block text-sm font-medium text-gray-300 mb-4">เปลี่ยนรูปภาพหลักหน้า About Us</label>
            <ImageUploader
              folder="about_main"
              initialImage={settings.about_image_url}
              onUpload={({ url, key }) => saveAboutMainImage(url, key)}
            />
            <p className="text-xs text-gray-500 italic mt-3">แนะนำ: ภาพแนวตั้งอัตราส่วน 4:5 เพื่อให้พอดีกับกรอบรูปบนหน้าเว็บ</p>
          </div>

          <div className="p-6">
            <label className="block text-sm font-medium text-gray-400 mb-6">รูปภาพปัจจุบันที่ใช้งานอยู่</label>
            {settings.about_image_url ? (
              <div className="space-y-6">
                <div className="flex justify-center items-center py-4 transition-transform hover:scale-105 duration-500">
                  <div className="relative w-full max-w-[280px] aspect-[4/5] rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <Image
                      src={settings.about_image_url}
                      alt="About Main"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-green-400 font-medium">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs uppercase tracking-widest">Active on Site</span>
                </div>
              </div>
            ) : (
              <div className="aspect-[4/5] w-full max-w-[240px] mx-auto border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-gray-600">
                <span className="text-4xl mb-3 opacity-20">🖼️</span>
                <p className="text-xs font-medium opacity-40">ใช้รูปภาพเริ่มต้น</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 border-brand-500/10 max-w-xl">
            <label className="block text-sm font-medium text-gray-300 mb-4">เพิ่มสมาชิกทีมคนใหม่ (อัปโหลดรูปภาพ)</label>
            <ImageUploader
              folder="about"
              onUpload={({ url, key }) => addTeamMember(url, key)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settings.about_team_images && JSON.parse(settings.about_team_images).length > 0 ? (
              JSON.parse(settings.about_team_images).map((member) => (
                <AdminTeamMemberCard
                  key={member.id}
                  member={member}
                  onUpdate={updateTeamMember}
                  onRemove={removeTeamMember}
                  isGlobalSaving={isSaving}
                />
              ))
            ) : (
              <div className="col-span-full py-12 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-gray-600">
                <span className="text-4xl mb-3 opacity-20">👥</span>
                <p className="text-xs font-medium opacity-40">ยังไม่มีการเพิ่มรูปภาพทีมแบบกำหนดเอง (กำลังแสดงรายชื่อเริ่มต้น 5 คน)</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-[#ffffff10]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m0 0l3-3m-3 3l3 3m8-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Change Admin Email</h2>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-medium text-white mb-2">Verification flow</h3>
          <ul className="text-xs text-gray-400 flex flex-wrap gap-x-6 gap-y-2 list-disc list-inside">
            <li>The new email receives a 6-digit verification code.</li>
            <li>You must enter your current password before sending the code.</li>
            <li>The code expires in 10 minutes and only the latest request stays active.</li>
          </ul>
        </div>

        <div className="p-6 rounded-xl bg-white/5 border border-white/10 max-w-xl">
          {emailChangeMessage.text && (
            <div className={`p-3 rounded mb-4 ${emailChangeMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {emailChangeMessage.text}
            </div>
          )}

          <label className="block text-sm font-medium text-gray-300">Current Email</label>
          <input
            type="email"
            value={accountEmail}
            readOnly
            className="w-full mt-2 p-3 rounded bg-white/5 border border-white/5 text-gray-400 text-sm"
          />

          <label className="block text-sm font-medium text-gray-300 mt-4">New Email</label>
          <input
            type="email"
            value={pendingEmail}
            onChange={(e) => setPendingEmail(e.target.value)}
            placeholder="new-admin@example.com"
            className="w-full mt-2 p-3 rounded bg-white/5 border border-white/5 text-white text-sm"
          />

          <label className="block text-sm font-medium text-gray-300 mt-4">Current Password</label>
          <input
            type="password"
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            placeholder="Current password"
            className="w-full mt-2 p-3 rounded bg-white/5 border border-white/5 text-white text-sm"
          />

          {emailChangeStep === 'verify' && (
            <>
              <label className="block text-sm font-medium text-gray-300 mt-4">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                className="w-full mt-2 p-3 rounded bg-white/5 border border-white/5 text-white text-sm tracking-[0.35em]"
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter the code sent to {emailChangeTarget || pendingEmail}.
              </p>
            </>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={sendEmailChangeCode}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-400 disabled:opacity-50"
              disabled={isSendingEmailCode || isVerifyingEmailCode}
            >
              {isSendingEmailCode ? 'Sending…' : emailChangeStep === 'verify' ? 'Resend Code' : 'Send Verification Code'}
            </button>

            {emailChangeStep === 'verify' && (
              <button
                onClick={verifyEmailChangeCode}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/15 disabled:opacity-50"
                disabled={isVerifyingEmailCode || isSendingEmailCode}
              >
                {isVerifyingEmailCode ? 'Verifying…' : 'Verify and Change Email'}
              </button>
            )}

            <button
              onClick={() => {
                setEmailChangeMessage({ type: '', text: '' })
                resetEmailChangeForm()
              }}
              className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10"
              disabled={isSendingEmailCode || isVerifyingEmailCode}
            >
              Reset
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
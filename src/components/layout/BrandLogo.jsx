'use client'

import { useState, useEffect } from 'react'
import EditableBlock from '../admin/EditableBlock'

export default function BrandLogo({ logoUrl, className = '', iconClassName = '' }) {
  const [isClient, setIsClient] = useState(false)
  const [siteName, setSiteName] = useState('Monkey')

  useEffect(() => {
    setIsClient(true)
    // Attempt to get from localStorage for instant feedback after admin edits
    try {
      const settings = JSON.parse(localStorage.getItem('site_settings') || '{}')
      if (settings.site_name) setSiteName(settings.site_name)
    } catch (e) {
      console.error('Failed to parse site_settings from localStorage', e)
    }
  }, [])

  if (!isClient) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className={`w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center ${iconClassName}`}>
          <span className="text-white font-black text-xl">M</span>
        </div>
        <span className="text-2xl font-black text-white tracking-tighter">Monkey</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Brand Icon */}
      <div className={`w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20 ${iconClassName}`}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
        ) : (
          <span className="text-white font-black text-xl">M</span>
        )}
      </div>

      {/* Brand Name (Editable) */}
      <div className="text-2xl font-black text-white tracking-tighter">
        <EditableBlock settingKey="site_name" defaultText={siteName} />
      </div>
    </div>
  )
}

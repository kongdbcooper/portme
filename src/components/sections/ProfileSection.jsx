'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import EditableBlock from '../admin/EditableBlock'

export default function ProfileSection({ settings = {}, banners = [], loading = false }) {
  // Profile images (About Me) — settings.prod_profile_images stored as JSON string
  const [profileImages, setProfileImages] = useState(() => {
    if (banners && banners.length > 0) return banners
    try {
      return settings.prod_profile_images ? JSON.parse(settings.prod_profile_images) : []
    } catch (e) {
      return []
    }
  })

  const [profileIndex, setProfileIndex] = useState(0)

  // ตรวจสอบสิทธิ์ Admin เพื่อไม่ให้ Section หายไปเมื่อไม่มีข้อมูล
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => { if (data.role === 'ADMIN') setIsAdmin(true); })
      .catch(() => {});
  }, []);

  if (loading) return null;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, bannersRes] = await Promise.all([
          fetch('/api/settings', { cache: 'no-store' }),
          fetch('/api/banners?type=PROFILE', { cache: 'no-store' })
        ])
        
        let fetchedBanners = []
        if (bannersRes.ok) {
          fetchedBanners = await bannersRes.json()
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setProfileImages(() => {
            if (fetchedBanners.length > 0) return fetchedBanners
            if (data.prod_profile_images) {
              try { return JSON.parse(data.prod_profile_images) } catch(e){}
            }
            return []
          })
        }
      } catch (err) {
        console.error('Failed to sync profile settings', err)
      }
    }

    fetchSettings()

    // Poll every 30 seconds to sync with admin changes
    const pollInterval = setInterval(fetchSettings, 30000)
    return () => clearInterval(pollInterval)
  }, [])

  const handleNext = () => profileImages.length > 0 && setProfileIndex((i) => (i + 1) % profileImages.length)
  const handlePrev = () => profileImages.length > 0 && setProfileIndex((i) => (i - 1 + profileImages.length) % profileImages.length)

  return (
    <div className="relative w-full h-auto lg:h-screen min-h-[600px] flex items-center overflow-hidden group">
        {/* 1. MAIN BACKGROUND (Previous Image) - Immersive Blend */}
      <div className="absolute inset-0 z-0">
        <Image
          src={profileImages[(profileIndex - 1 + profileImages.length) % profileImages.length]?.imageUrl || profileImages[(profileIndex - 1 + profileImages.length) % profileImages.length]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNWE2YmZmIi8+PC9zdmc+'}
          alt="Background Preview"
          fill
          priority
          className="object-cover object-center transition-all duration-1000 ease-in-out opacity-40 blur-[2px]"
          sizes="100vw"
        />
        {/* Softer seamless gradients so next-section text remains readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/80 via-transparent to-[#0a0a0f]/60 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/70 via-[#0a0a0f]/20 to-transparent z-10 pointer-events-none" />

        {/* Subtle Bottom Fade */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#0a0a0f]/40 via-[#0a0a0f]/12 to-transparent z-10 pointer-events-none" />

        {/* Global Darkener */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-0 z-0 pointer-events-none" />
      </div>

      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[60%] h-full bg-brand-500/10 rounded-full blur-[200px] pointer-events-none animate-pulse" />

      <div className="container mx-auto px-4 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center h-full py-20 lg:py-0">
          
          {(() => {
            const currentBanner = profileImages[profileIndex] || {};
            return (
              <>
                {/* Left Side — Content */}
                <div className="space-y-12 lg:space-y-20" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <div className="inline-block mb-1">
                    <EditableBlock 
                      settingKey="prod_badge" 
                      defaultText={settings.prod_badge || "Personal Showcase"} 
                      className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-brand-500/20 border border-brand-500/40 backdrop-blur-3xl text-brand-300 text-sm font-black uppercase tracking-[0.3em] shadow-2xl empty:hidden"
                    />
                  </div>

                  <div className="space-y-8 lg:space-y-12">
                    {/* Intro Text - Dynamic per Banner Image */}
                    <div className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none">
                      {currentBanner?.title ? (
                        <span className="animated-gradient-text block py-3 sm:py-6 break-words whitespace-pre-wrap leading-[1.1]">{currentBanner.title}</span>
                      ) : (
                        <EditableBlock 
                          as="span" 
                          className="animated-gradient-text block py-3 sm:py-6 leading-[1.1]" 
                          settingKey="prod_title_1" 
                          multiline
                          defaultText={settings.prod_title_1 || "I'm Creative Developer"} 
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-10 lg:space-y-16 max-w-4xl">
                     {/* Description - Dynamic per Banner Image */}
                     <div className="text-white text-base sm:text-lg lg:text-xl leading-relaxed font-bold drop-shadow-2xl">
                       {currentBanner?.subtitle ? (
                         <div className="break-words whitespace-pre-wrap">{currentBanner.subtitle}</div>
                       ) : (
                         <EditableBlock
                           as="div"
                           settingKey="prod_desc"
                           multiline
                           defaultText={settings?.prod_desc || "I build high-performance, visually stunning digital products that push the boundaries of modern web development."}
                         />
                       )}
                     </div>

                     {/* Extended Bio Section - Dynamic per Banner Image */}
                     <div className="text-gray-300 text-xs sm:text-sm lg:text-base leading-relaxed font-medium opacity-80 border-l-2 border-brand-500/30 pl-4">
                       {currentBanner?.description ? (
                         <div className="break-words whitespace-pre-wrap">{currentBanner.description}</div>
                       ) : (
                         <EditableBlock
                           as="div"
                           settingKey="prod_long_bio"
                           multiline
                           defaultText={settings?.prod_long_bio || "With over 5 years of experience in the industry, I specialize in React, Next.js, and advanced motion graphics. My work focuses on delivering seamless user interactions and pixel-perfect designs that leave a lasting impression."}
                         />
                       )}
                     </div>
                  </div>

                  <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                    {/* Get Started CTA */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const productsSection = document.getElementById('products')
                        if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 sm:px-10 sm:py-4 bg-brand-500 hover:bg-brand-600 text-white font-black text-sm sm:text-base rounded-xl transition-all duration-500 hover:scale-105 shadow-[0_15px_30px_-5px_rgba(90,107,255,0.6)] group/btn"
                    >
                      <EditableBlock settingKey="prod_cta_text" defaultText={settings.prod_cta_text || "Get Started"} />
                      <svg className="w-7 h-7 group-hover/btn:translate-x-3 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>

                     {profileImages.length > 1 && (
                      <div className="text-white/60 text-base font-black uppercase tracking-[0.5em] flex items-center gap-8 opacity-70 group-hover:opacity-100 transition-all duration-700">
                        <div className="w-24 h-[3px] bg-brand-500/40 group-hover:w-40 group-hover:bg-brand-500 transition-all duration-700" />
                        <EditableBlock settingKey="prod_scroll_text" defaultText={settings.prod_scroll_text || "Scroll to Explore"} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side — Showcase & Navigation */}
                <div className="relative space-y-6 flex flex-col items-center w-full" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {/* Background Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-500/10 rounded-full blur-[150px] scale-90 group-hover:scale-110 transition-transform duration-1000 pointer-events-none" />
                  
                  {/* The Image Container */}
                  <div className="relative w-full max-w-md lg:max-w-2xl aspect-[4/5] lg:aspect-square rounded-[3rem] overflow-hidden shadow-2xl bg-white/5 border border-white/10">
                    {profileImages.length > 0 ? (
                        <Image
                          src={profileImages[profileIndex]?.imageUrl || profileImages[profileIndex]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNWE2YmZmIi8+PC9zdmc+'}
                          alt="Current Showcase"
                          fill
                          sizes="(max-width: 1024px) 100vw, 1200px"
                          className="object-cover transition-transform duration-700 hover:scale-105"
                          priority
                          unoptimized
                        />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-500/10 to-transparent" />
                    )}
                  </div>

                   {/* Consolidated Navigation & CTA Block */}
                   <div className="relative w-full max-w-sm p-4 rounded-2xl bg-surface-900/80 backdrop-blur-3xl border border-white/10 shadow-3xl z-50">
                    <div className="flex justify-between items-center gap-6">
                      {/* Prev Button */}
                      <button
                        onClick={handlePrev}
                        className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-surface-800/80 border border-white/20 flex items-center justify-center text-brand-300 hover:bg-brand-500 hover:border-brand-500 hover:text-white transition-all duration-300 active:scale-90 flex-shrink-0"
                      >
                        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                       {/* Centered Counter & Label */}
                       <div className="flex-1 text-center space-y-1">
                         <div className="text-brand-300 text-[10px] font-black uppercase tracking-[0.3em] opacity-100">
                           <EditableBlock settingKey="prod_nav_label" defaultText={settings.prod_nav_label || "Explore Profile"} />
                         </div>
                         <h4 className="text-white text-3xl font-black tracking-tighter">
                           {profileIndex + 1} <span className="text-white/40">/</span> {profileImages.length}
                         </h4>
                      </div>

                       {/* Next Button */}
                       <button
                         onClick={handleNext}
                         className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-surface-800/80 border border-white/20 flex items-center justify-center text-brand-300 hover:bg-brand-500 hover:border-brand-500 hover:text-white transition-all duration-300 active:scale-90 flex-shrink-0"
                       >
                        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  )
}

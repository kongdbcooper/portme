'use client'

import { useState } from 'react'
import Image from 'next/image'
import EditableBlock from '../admin/EditableBlock'

export default function ProfileSection({ settings = {}, loading = false }) {
  // Profile images (About Me) — settings.prod_profile_images stored as JSON string
  const profileImages = (() => {
    try {
      return settings.prod_profile_images ? JSON.parse(settings.prod_profile_images) : []
    } catch (e) {
      return []
    }
  })()

  const [profileIndex, setProfileIndex] = useState(0)

  // Auto-advance disabled as per user request
  
  if (loading || profileImages.length === 0) return null

  const handleNext = () => setProfileIndex((i) => (i + 1) % profileImages.length)
  const handlePrev = () => setProfileIndex((i) => (i - 1 + profileImages.length) % profileImages.length)

  return (
    <div className="relative w-full min-h-[85vh] flex items-center overflow-hidden group mb-12 -mt-16">
        {/* 1. MAIN BACKGROUND (Previous Image) - Immersive Blend */}
      <div
        className="absolute inset-0 transition-all duration-1000 ease-in-out z-0"
        style={{
          backgroundImage: `url(${profileImages[(profileIndex - 1 + profileImages.length) % profileImages.length]?.url || '/picture/blue.jpg'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Ultra-Strong Seamless Gradient Fades */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-transparent to-[#0a0a0f] z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/30 to-transparent z-10" />
        {/* Global Darkener */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px] z-0" />
      </div>

      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[60%] h-full bg-brand-500/10 rounded-full blur-[200px] pointer-events-none animate-pulse" />

      <div className="container mx-auto px-4 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start py-12 md:py-20 lg:py-32">
          {/* Left Side — Content */}
          <div className="space-y-12 sticky top-32" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-brand-500/20 border border-brand-500/40 backdrop-blur-3xl text-brand-300 text-sm font-black uppercase tracking-[0.3em] shadow-2xl">
              <EditableBlock settingKey="prod_badge" defaultText={settings.prod_badge || "Personal Showcase"} />
            </div>

            <div className="space-y-16">
              {/* Intro Text - Massive Colorful Hero */}
              <div className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-none">
                <EditableBlock 
                  as="span" 
                  className="animated-gradient-text block py-4 sm:py-6" 
                  settingKey="prod_title_1" 
                  defaultText={settings.prod_title_1 || "I'm Creative Developer"} 
                />
              </div>
            </div>

            <div className="space-y-20 max-w-3xl">
               {/* Description - Standardized Left Alignment */}
               <div className="text-white text-xl sm:text-2xl lg:text-4xl leading-relaxed font-bold drop-shadow-2xl opacity-100">
                 <EditableBlock
                   as="div"
                   settingKey="prod_desc"
                   multiline
                   defaultText={settings.prod_desc || "I build high-performance, visually stunning digital products that push the boundaries of modern web development."}
                 />
               </div>

               {/* Extended Bio Section - Better support for long text */}
               <div className="text-gray-300 text-base sm:text-lg lg:text-2xl leading-loose font-medium opacity-90 border-l-2 border-brand-500/30 pl-6 sm:pl-8">
                 <EditableBlock
                   as="div"
                   settingKey="prod_long_bio"
                   multiline
                   defaultText={settings.prod_long_bio || "With over 5 years of experience in the industry, I specialize in React, Next.js, and advanced motion graphics. My work focuses on delivering seamless user interactions and pixel-perfect designs that leave a lasting impression."}
                 />
               </div>
            </div>

            <div className="pt-12 flex flex-col sm:flex-row items-center gap-12">
              {/* Get Started CTA Moved Back to Left */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const contactSection = document.getElementById('contact')
                  if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' })
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-5 px-10 py-5 sm:px-16 sm:py-7 bg-brand-500 hover:bg-brand-600 text-white font-black text-lg sm:text-xl rounded-2xl sm:rounded-[2.5rem] transition-all duration-500 hover:scale-105 shadow-[0_30px_60px_-15px_rgba(90,107,255,0.6)] group/btn"
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
          <div className="relative space-y-12 flex flex-col items-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-500/10 rounded-full blur-[150px] scale-90 group-hover:scale-110 transition-transform duration-1000 pointer-events-none" />
            
              {/* The Image Container with Integrated Small Card */}
            <div
              className="relative w-full max-w-2xl aspect-[4/5] rounded-[2rem] sm:rounded-[6rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] lg:shadow-[0_100px_200px_-40px_rgba(0,0,0,1)] transition-all duration-1000 group-hover:scale-[1.02]"
            >
              {profileImages.length > 0 ? (
                <Image
                  src={profileImages[profileIndex]?.url || '/picture/blue.jpg'}
                  alt="Current Showcase"
                  fill
                  sizes="(max-width: 1024px) 100vw, 1000px"
                  className="object-contain"
                  unoptimized={profileImages[profileIndex]?.url?.startsWith('blob:') ? true : false}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-500/10 to-transparent" />
              )}

              {/* Small Card - Bottom Right, Seamless Blend */}
            {profileImages.length > 1 && (
              <div
                className="absolute bottom-4 right-4 w-1/3 aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 opacity-90 hover:opacity-100"
                onClick={handleNext}
              >
                <Image
                  src={profileImages[(profileIndex + 1) % profileImages.length]?.url || '/picture/blue.jpg'}
                  alt="Next Preview"
                  fill
                  sizes="(max-width: 1024px) 400px"
                  className="object-contain"
                  unoptimized={profileImages[(profileIndex + 1) % profileImages.length]?.url?.startsWith('blob:') ? true : false}
                />
              </div>
            )}
            </div>

             {/* Consolidated Navigation & CTA Block */}
             <div className="relative w-full max-w-2xl p-8 md:p-10 rounded-[4rem] bg-surface-900/80 backdrop-blur-3xl border border-white/10 shadow-3xl z-50">
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
        </div>
      </div>
    </div>
  )
}

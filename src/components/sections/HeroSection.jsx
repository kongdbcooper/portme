// =============================================================================
// src/components/sections/HeroSection.js — Hero Section (Section 1)
// ส่วนแรกของ landing page: headline, CTA, animated background
// ใช้งานร่วมกับ: src/app/page.js, src/app/globals.css, tailwind.config.js
// =============================================================================

'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import EditableBlock from '../admin/EditableBlock'

export default function HeroSection({ settings = {}, banners = [] }) {
  const canvasRef = useRef(null)
  
  const [heroImages, setHeroImages] = useState(() => {
    if (banners && banners.length > 0) return banners
    if (settings?.hero_background_images) {
      try { return JSON.parse(settings.hero_background_images) } catch(e){}
    }
    if (settings?.hero_background_url) return [{ url: settings.hero_background_url }]
    return []
  })
  
  const [currentIndex, setCurrentIndex] = useState(0)

  // ดึง background URL จาก settings API (Fallback if prop is empty)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, bannersRes] = await Promise.all([
          fetch('/api/settings', { cache: 'no-store' }),
          fetch('/api/banners?type=HERO', { cache: 'no-store' })
        ])

        let fetchedBanners = []
        if (bannersRes.ok) {
          fetchedBanners = await bannersRes.json()
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setHeroImages(() => {
            if (fetchedBanners.length > 0) return fetchedBanners
            if (data.hero_background_images) {
              try { return JSON.parse(data.hero_background_images) } catch(e){}
            }
            if (data.hero_background_url) return [{ url: data.hero_background_url }]
            return []
          })
        }
      } catch (err) {
        console.error('Failed to sync hero settings', err)
      }
    }

    fetchSettings()
    
    // Poll every 30 seconds to get the latest admin updates for guests
    // Admin will see updates faster through the admin panel itself
    const pollInterval = setInterval(fetchSettings, 30000)
    return () => clearInterval(pollInterval)
  }, [])

  // Carousel Effect
  useEffect(() => {
    if (heroImages.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length)
    }, 8000) // เปลี่ยนรูปทุก 8 วินาที
    return () => clearInterval(interval)
  }, [heroImages.length])

  // ------------------- Particle Animation -------------------
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    const particleCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 15 : 60
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
        color: Math.random() > 0.5 ? '#5a6bff' : '#f97316',
      })
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.fill()
      })
      ctx.globalAlpha = 1
      animationId = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const currentBanner = heroImages[currentIndex] || {}
  const currentImageUrl = currentBanner.imageUrl || currentBanner.url

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0f]">
      {/* ------------------- Background Carousel ------------------- */}
      {heroImages.length > 0 ? (
        heroImages.map((img, idx) => {
          const url = img.imageUrl || img.url
          return (
            <div
              key={idx}
              className="absolute inset-0 w-full h-full transition-all duration-2000 ease-in-out"
              style={{
                opacity: idx === currentIndex ? 1 : 0,
                transform: idx === currentIndex ? 'scale(1)' : 'scale(1.05)',
                backgroundImage: `url(${url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div className="absolute inset-0 bg-black/60 z-10" />
            </div>
          )
        })
      ) : (
        <div className="absolute inset-0 w-full h-full" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #111118 40%, #1a1a2e 100%)' }} />
      )}

      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: heroImages.length > 0 ? 0.4 : 0.6 }} />

      {/* Hero Content */}
      <div className="relative z-10 w-full text-center px-4 flex flex-col items-center">
        {/* Badge - Dynamic per Banner Image */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm font-medium mb-8 animate-fade-in">
          {currentBanner?.subtitle ? (
            <div className="whitespace-pre-wrap">{currentBanner.subtitle}</div>
          ) : (
            <EditableBlock settingKey="hero_badge" defaultText={settings.hero_badge || "แพลตฟอร์มจัดการโปรดักซ์ยุคใหม่"} />
          )}
        </div>

        {/* Main Headline - Dynamic Sync with Banner Image */}
        <h1 className="text-[2.75rem] sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 animate-fade-up leading-[1.1] sm:leading-none flex flex-col items-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {currentBanner.title ? (
            <span className="animated-gradient-text block text-center py-2 break-words whitespace-pre-wrap">{currentBanner.title}</span>
          ) : (
            <>
              <EditableBlock as="span" className="text-white block text-center" settingKey="hero_title_1" multiline defaultText={settings?.hero_title_1 || "จัดการ"} />
              <EditableBlock as="span" className="animated-gradient-text block text-center" settingKey="hero_title_2" multiline defaultText={settings?.hero_title_2 || "โปรดักซ์"} />
              <EditableBlock as="span" className="text-white block text-center" settingKey="hero_title_3" multiline defaultText={settings?.hero_title_3 || "อย่างมืออาชีพ"} />
            </>
          )}
        </h1>

        {/* Subheadline - Dynamic Sync with Banner Image */}
        <div className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-fade-up text-center" style={{ animationDelay: '0.2s' }}>
          {currentBanner.description ? (
            <div className="break-words whitespace-pre-wrap">{currentBanner.description}</div>
          ) : (
            <EditableBlock 
              as="span" 
              settingKey="hero_subtitle" 
              multiline 
              className="text-center block"
              defaultText={settings.hero_subtitle || "ระบบ Admin Dashboard ที่ครบครัน อัปโหลดรูปภาพสู่ Cloudflare R2 อัตโนมัติ พร้อม A/B Testing และ Google Analytics ในตัว"} 
            />
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <a
            href="#products"
            className="w-full sm:w-auto btn-gradient text-base px-8 py-4 animate-glow"
            onClick={(e) => {
              e.preventDefault()
              document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth' })
              fetch('/api/ab-test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventType: 'CTA_CLICK' }) }).catch(() => {})
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <EditableBlock as="span" settingKey="hero_cta_primary" defaultText={settings.hero_cta_primary || "ดูโปรดักซ์ทั้งหมด"} />
          </a>
          <a href="#contact" className="w-full sm:w-auto btn-ghost text-base px-8 py-4">
            <EditableBlock as="span" settingKey="hero_cta_secondary" defaultText={settings.hero_cta_secondary || "ติดต่อเรา"} />
          </a>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-24 sm:h-32 md:h-36 lg:h-48 bg-gradient-to-t from-[#0a0a0f]/40 via-[#0a0a0f]/12 to-transparent z-10 pointer-events-none" />

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-60 z-30">
        <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">
          <EditableBlock settingKey="hero_scroll_label" defaultText="เลื่อนลง" />
        </span>
        <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1">
          <div className="w-1 h-2 bg-brand-500 rounded-full" />
        </div>
      </div>
    </section>
  )
}

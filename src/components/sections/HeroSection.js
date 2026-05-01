// =============================================================================
// src/components/sections/HeroSection.js — Hero Section (Section 1)
// ส่วนแรกของ landing page: headline, CTA, animated background
// ใช้งานร่วมกับ: src/app/page.js, src/app/globals.css, tailwind.config.js
// =============================================================================

'use client'

import { useEffect, useRef, useState } from 'react'
import EditableBlock from '../admin/EditableBlock'

export default function HeroSection({ settings = {} }) {
  const canvasRef = useRef(null)
  const [heroBgUrl, setHeroBgUrl] = useState(settings.hero_background_url || null)

  // ดึง background URL จาก settings API
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' })
        const settings = await res.json()
        if (settings.hero_background_url) {
          setHeroBgUrl(settings.hero_background_url)
        }
      } catch (error) {
        console.error('Failed to fetch hero background:', error)
      }
    }
    
    // ดึงตอน mount เท่านั้น ถ้าไม่มี prop backgroundUrl
    // เราใช้ settings prop เป็นหลักแล้ว แต่ก็มี fallback เล็กน้อย
    if (!settings.hero_background_url) {
      fetchSettings()
    }
  }, [settings.hero_background_url])

  // ------------------- Particle Animation -------------------
  // สร้าง floating particles บน canvas background
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

    // สร้าง particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        color: Math.random() > 0.5 ? '#5a6bff' : '#f97316',
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

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

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ 
        background: heroBgUrl 
          ? `linear-gradient(rgba(10, 10, 15, 0.7), rgba(17, 17, 24, 0.8)), url(${heroBgUrl}) center/cover no-repeat`
          : 'linear-gradient(135deg, #0a0a0f 0%, #111118 40%, #1a1a2e 100%)'
      }}
    >
      {/* ------------------- Particle Canvas ------------------- */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: heroBgUrl ? 0.4 : 0.6 }}
      />

      {/* ------------------- Gradient Orbs ------------------- */}
      {/* Orb ซ้าย */}
      <div
        className="absolute -left-40 top-1/4 w-96 h-96 rounded-full opacity-20 animate-float"
        style={{
          background: 'radial-gradient(circle, #5a6bff 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      {/* Orb ขวา */}
      <div
        className="absolute -right-40 bottom-1/4 w-96 h-96 rounded-full opacity-20 animate-float"
        style={{
          background: 'radial-gradient(circle, #f97316 0%, transparent 70%)',
          filter: 'blur(60px)',
          animationDelay: '1.5s',
        }}
      />
      {/* Orb กลาง */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
        style={{
          background: 'radial-gradient(circle, #7c4dff 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* ------------------- Hero Content ------------------- */}
      <div className="relative z-10 section-container text-center px-4">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm font-medium mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          <EditableBlock settingKey="hero_badge" defaultText={settings.hero_badge || "แพลตฟอร์มจัดการโปรดักซ์ยุคใหม่"} />
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 animate-fade-up leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
          <EditableBlock as="span" className="text-white block" settingKey="hero_title_1" defaultText={settings.hero_title_1 || "จัดการ"} />
          <EditableBlock as="span" className="animated-gradient-text block" settingKey="hero_title_2" defaultText={settings.hero_title_2 || "โปรดักซ์"} />
          <EditableBlock as="span" className="text-white block" settingKey="hero_title_3" defaultText={settings.hero_title_3 || "อย่างมืออาชีพ"} />
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <EditableBlock 
            as="span" 
            settingKey="hero_subtitle" 
            multiline 
            defaultText={settings.hero_subtitle || "ระบบ Admin Dashboard ที่ครบครัน อัปโหลดรูปภาพสู่ Cloudflare R2 อัตโนมัติ พร้อม A/B Testing และ Google Analytics ในตัว"} 
          />
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <a
            href="#products"
            id="hero-explore-btn"
            className="btn-gradient text-base px-8 py-4 animate-glow"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            ดูโปรดักซ์ทั้งหมด
          </a>
          <a
            href="#contact"
            id="hero-contact-btn"
            className="btn-ghost text-base px-8 py-4"
          >
            ติดต่อเรา
          </a>
        </div>

        {/* ------------------- Stats Row ------------------- */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-16 animate-fade-up" style={{ animationDelay: '0.6s' }}>
          {[
            { value: '500+', label: 'โปรดักซ์' },
            { value: '99.9%', label: 'Uptime' },
            { value: '<100ms', label: 'Response Time' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-black gradient-text mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {value}
              </div>
              <div className="text-gray-500 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------- Scroll Indicator ------------------- */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-gray-600 text-xs">เลื่อนลง</span>
        <div className="w-5 h-8 rounded-full border border-gray-700 flex items-start justify-center p-1">
          <div className="w-1 h-2 bg-brand-500 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  )
}

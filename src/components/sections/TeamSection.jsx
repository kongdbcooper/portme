'use client'

import { useEffect, useState, useRef } from 'react'
import TeamCard from './TeamCard'

const DEFAULT_MEMBERS = [
  { id: '1', name: 'คุณนพรัตน์ ชัยชนะ', role: 'CEO & Founder', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', desc: 'ผู้นำวิสัยทัศน์และการพัฒนาผลิตภัณฑ์หลักขององค์กร' },
  { id: '2', name: 'คุณพิมพ์ใจ รัตนศิริ', role: 'Creative Director', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', desc: 'ดูแลด้านการออกแบบและประสบการณ์ใช้งานทั้งหมด' },
  { id: '3', name: 'คุณสมชาย ยอดรัก', role: 'Lead Developer', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', desc: 'ผู้รับผิดชอบระบบหลังบ้าน โครงสร้างพื้นฐาน และเทคโนโลยีคลาวด์' },
  { id: '4', name: 'คุณกิตติคุณ ศิริเจริญ', role: 'Marketing Lead', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80', desc: 'วิเคราะห์การตลาดและขับเคลื่อนการเติบโตของแบรนด์' },
  { id: '5', name: 'คุณธวัชชัย ดีเลิศ', role: 'Product Manager', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', desc: 'ประสานงานโครงการและดูแลเป้าหมายของผลิตภัณฑ์หลัก' },
]

export default function TeamSection({ settings = {} }) {
  const [members, setMembers] = useState(() => {
    if (settings.about_team_images) {
      try {
        const parsed = JSON.parse(settings.about_team_images)
        if (parsed && parsed.length > 0) return parsed
      } catch (e) {}
    }
    return DEFAULT_MEMBERS
  })

  const [isPaused, setIsPaused] = useState(false)
  const scrollRef = useRef(null)
  const autoScrollRef = useRef(null)
  const scrollSpeed = 1 // pixels per frame

  // Sync state if settings update dynamically
  useEffect(() => {
    if (settings.about_team_images) {
      try {
        const parsed = JSON.parse(settings.about_team_images)
        if (parsed && parsed.length > 0) {
          setMembers(parsed)
          return
        }
      } catch (e) {}
    }
    setMembers(DEFAULT_MEMBERS)
  }, [settings.about_team_images])

  // Auto-scroll loop
  useEffect(() => {
    if (isPaused || !scrollRef.current || members.length <= 3) return

    const container = scrollRef.current
    let animationId

    const step = () => {
      if (!container) return
      container.scrollLeft += scrollSpeed

      // Loop back to start when reaching end
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 2) {
        container.scrollLeft = 0
      }

      animationId = requestAnimationFrame(step)
    }

    animationId = requestAnimationFrame(step)
    autoScrollRef.current = animationId

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [isPaused, members])

  // Manual button scroll
  const scrollBy = (direction) => {
    if (!scrollRef.current) return
    
    // Pause auto-scroll briefly
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 5000)

    const cardWidth = window.innerWidth < 640 ? window.innerWidth * 0.8 : 300
    const gap = window.innerWidth < 640 ? 16 : 32
    const scrollAmount = (cardWidth + gap) * direction

    scrollRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <div className="relative w-full mt-40 sm:mt-56 py-8 overflow-visible">
      {/* Background text "TEAM" - double-layered for intense foggy volumetric glow */}
      <div className="absolute top-12 sm:top-20 md:top-24 left-1/2 -translate-x-1/2 pointer-events-none select-none z-0 text-center leading-none">
        {/* Massive volumetric foggy glow layer */}
        <div 
          className="absolute inset-0 text-[9rem] sm:text-[14rem] md:text-[18rem] font-black tracking-[0.15em] text-white filter blur-[15px] sm:blur-[25px] md:blur-[35px]"
          style={{ 
            fontFamily: 'Outfit, sans-serif',
            textShadow: '0 0 30px #ffffff, 0 0 60px #ffffff, 0 0 100px #ffffff, 0 0 150px rgba(255, 255, 255, 0.9), 0 0 250px rgba(255, 255, 255, 0.6)',
            opacity: 0.85
          }}
        >
          TEAM
        </div>
        
        {/* Core bright white text layer */}
        <div 
          className="relative text-[9rem] sm:text-[14rem] md:text-[18rem] font-black tracking-[0.15em] text-white/95"
          style={{ 
            fontFamily: 'Outfit, sans-serif',
            textShadow: '0 0 15px #ffffff, 0 0 30px rgba(255, 255, 255, 0.8), 0 0 50px rgba(255, 255, 255, 0.6)'
          }}
        >
          TEAM
        </div>
      </div>

      {/* Cards container pushed down further to avoid overlapping with the TEAM text */}
      <div className="relative z-10 max-w-full mt-40 sm:mt-56 md:mt-64">
        {/* ---- Previous Button ---- */}
        <button
          onClick={() => scrollBy(-1)}
          className="absolute -left-4 sm:left-2 md:-left-12 lg:-left-20 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-surface-800/90 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-brand-300 hover:bg-brand-500 hover:border-brand-500 hover:text-white transition-all duration-300 active:scale-90 shadow-2xl pointer-events-auto"
          aria-label="Previous team member"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* ---- Carousel Container ---- */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-hide scroll-smooth px-4 sm:px-6 py-6 touch-pan-x"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {members.map((member, index) => (
            <TeamCard
              key={member.id || index}
              imageUrl={member.url}
              name={member.name}
              role={member.role}
              desc={member.desc}
              index={index}
            />
          ))}
        </div>

        {/* ---- Next Button ---- */}
        <button
          onClick={() => scrollBy(1)}
          className="absolute -right-4 sm:right-2 md:-right-12 lg:-right-20 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-surface-800/90 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-brand-300 hover:bg-brand-500 hover:border-brand-500 hover:text-white transition-all duration-300 active:scale-90 shadow-2xl pointer-events-auto"
          aria-label="Next team member"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

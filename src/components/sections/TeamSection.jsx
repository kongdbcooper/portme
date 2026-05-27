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

  const [centerIndex, setCenterIndex] = useState(2)
  const [isPaused, setIsPaused] = useState(false)
  const [windowWidth, setWindowWidth] = useState(1200)
  const [selectedMember, setSelectedMember] = useState(null)

  // Track window resizing for 3D layout offsets
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth)
      const handleResize = () => setWindowWidth(window.innerWidth)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Sync state if settings update dynamically
  useEffect(() => {
    if (settings.about_team_images) {
      try {
        const parsed = JSON.parse(settings.about_team_images)
        if (parsed && parsed.length > 0) {
          setMembers(parsed)
          setCenterIndex(Math.floor(parsed.length / 2))
          return
        }
      } catch (e) {}
    }
    setMembers(DEFAULT_MEMBERS)
    setCenterIndex(2)
  }, [settings.about_team_images])

  // Auto-rotate center card every 4 seconds
  useEffect(() => {
    if (isPaused || members.length <= 1) return

    const interval = setInterval(() => {
      setCenterIndex((prev) => (prev + 1) % members.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isPaused, members.length])

  // Rotate manually using arrows or card clicks
  const rotateBy = (direction) => {
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 8000) // Hold auto-scroll for 8 seconds

    setCenterIndex((prev) => {
      const nextIdx = prev + direction
      if (nextIdx < 0) return members.length - 1
      if (nextIdx >= members.length) return 0
      return nextIdx
    })
  }

  // Calculate circular offset relative to centerIndex
  const getOffset = (index) => {
    let offset = index - centerIndex
    if (offset < -Math.floor(members.length / 2)) {
      offset += members.length
    } else if (offset > Math.floor(members.length / 2)) {
      offset -= members.length
    }
    return offset
  }

  // Generate 3D transform matrices dynamically based on screen sizes
  const getCardStyle = (offset) => {
    const isMobile = windowWidth < 640
    const isTablet = windowWidth >= 640 && windowWidth < 1024
    
    let xOffset = 260
    let scaleStep = 0.15
    let rotateYDeg = 30
    
    if (isMobile) {
      xOffset = 80
      scaleStep = 0.15
      rotateYDeg = 15
    } else if (isTablet) {
      xOffset = 170
      scaleStep = 0.15
      rotateYDeg = 25
    }
    
    const absOffset = Math.abs(offset)
    
    // Hide cards that are beyond 2 offsets (out of 5 visible slots)
    if (absOffset > 2) {
      return {
        transform: `translateX(${offset > 0 ? 120 : -120}%) scale(0.4) rotateY(${offset > 0 ? -40 : 40}deg) translateZ(-300px)`,
        opacity: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }
    }
    
    const translateX = offset * xOffset
    const scale = 1 - absOffset * scaleStep
    const rotateY = -offset * rotateYDeg
    const opacity = absOffset === 0 ? 1 : absOffset === 1 ? 0.85 : 0.4
    const zIndex = 30 - absOffset * 10
    
    return {
      transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg) translateZ(${-absOffset * 100}px)`,
      opacity,
      zIndex,
      pointerEvents: 'auto',
      transition: 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
    }
  }

  return (
    <div className="relative w-full mt-40 md:mt-64 pt-12 md:pt-24 pb-12 overflow-visible" id="team">
      {/* Cards container containing the absolute background text TEAM */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Background text "TEAM" - curved arc path positioned directly behind the cards */}
        <div className="absolute top-[10%] md:top-[15%] -translate-y-1/2 left-0 w-full pointer-events-none select-none z-0 flex justify-center overflow-visible">
          <svg viewBox="0 -100 1600 700" className="w-full max-w-[1200px] overflow-visible">
            <defs>
              {/* Volumetric foggy glow layer */}
              <filter id="team-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="15" result="blur1" />
                <feGaussianBlur stdDeviation="8" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur1" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              
              {/* Path for the arched text */}
              <path id="curve-path" d="M -100,500 Q 800,50 1700,500" fill="none" />
              
              <linearGradient id="glow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.02" />
                <stop offset="25%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="75%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            
            {/* Volumetric glow text path */}
            <text 
              filter="url(#team-glow)"
              className="font-black uppercase"
              fontSize="350"
              transform="scale(1, 1.3)"
              transformOrigin="center bottom"
              opacity="0.5"
              style={{ 
                fontFamily: 'Noto Serif Thai, serif',
                letterSpacing: '0.15em',
              }}
              fill="url(#glow-grad)"
            >
              <textPath href="#curve-path" startOffset="50%" textAnchor="middle">
                TEAM
              </textPath>
            </text>
            
            {/* Sharp core layer */}
            <text 
              className="font-black uppercase"
              fontSize="350"
              transform="scale(1, 1.3)"
              transformOrigin="center bottom"
              style={{ 
                fontFamily: 'Noto Serif Thai, serif',
                letterSpacing: '0.15em',
              }}
              fill="url(#glow-grad)"
            >
              <textPath href="#curve-path" startOffset="50%" textAnchor="middle">
                TEAM
              </textPath>
            </text>
          </svg>
        </div>

        {/* ---- Previous Button ---- */}
        <button
          onClick={() => rotateBy(-1)}
          className="absolute left-2 sm:left-4 md:-left-12 lg:-left-20 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-surface-800/90 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-brand-300 hover:bg-brand-500 hover:border-brand-500 hover:text-white transition-all duration-300 active:scale-90 shadow-2xl pointer-events-auto"
          aria-label="Previous team member"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* ---- 3D Coverflow Container ---- */}
        <div
          className="relative w-full h-[360px] sm:h-[420px] lg:h-[480px] flex items-center justify-center overflow-visible select-none z-10"
          style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {members.map((member, index) => {
            const offset = getOffset(index)
            const style = getCardStyle(offset)
            const isActive = offset === 0

            return (
              <div
                key={member.id || index}
                className="absolute transition-all duration-700 ease-out"
                style={style}
                onClick={() => {
                  if (!isActive) {
                    rotateBy(offset)
                  } else {
                    setSelectedMember(member)
                  }
                }}
              >
                <div 
                  style={{
                    animation: 'floatBob 6s ease-in-out infinite',
                    animationDelay: `${index * 0.4}s`
                  }}
                  className="w-full h-full"
                >
                  <TeamCard
                    imageUrl={member.url}
                    name={member.name}
                    role={member.role}
                    desc={member.desc}
                    index={index}
                    isActive={isActive}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* ---- Next Button ---- */}
        <button
          onClick={() => rotateBy(1)}
          className="absolute right-2 sm:right-4 md:-right-12 lg:-right-20 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-surface-800/90 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-brand-300 hover:bg-brand-500 hover:border-brand-500 hover:text-white transition-all duration-300 active:scale-90 shadow-2xl pointer-events-auto"
          aria-label="Next team member"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ---- Detailed Member Modal Popup ---- */}
      {selectedMember && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all duration-300"
          onClick={() => setSelectedMember(null)}
        >
          <div 
            className="relative w-full max-w-4xl bg-surface-950/90 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-3xl flex flex-col md:flex-row items-stretch animate-[scaleIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: 'Noto Serif Thai, serif' }}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-black/60 hover:bg-brand-500 hover:scale-105 active:scale-95 text-white flex items-center justify-center transition-all border border-white/10 backdrop-blur-md shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Left Side: Photo */}
            <div className="relative w-full md:w-1/2 min-h-[300px] md:min-h-[480px]">
              <img 
                src={selectedMember.url} 
                alt={selectedMember.name} 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-surface-950 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Right Side: Detailed Info */}
            <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center space-y-6 bg-surface-950/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
                <span className="text-brand-300 text-xs sm:text-sm font-black uppercase tracking-[0.25em]">{selectedMember.role}</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                {selectedMember.name}
              </h2>

              <div className="h-[2px] w-20 bg-brand-500/50" />

              <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-medium whitespace-pre-wrap">
                {selectedMember.desc || 'มุ่งส่งมอบนวัตกรรมและเทคโนโลยีที่ดีที่สุดสำหรับคุณ'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

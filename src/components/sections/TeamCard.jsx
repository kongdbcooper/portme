'use client'

import { useState, useRef, useEffect } from 'react'

export default function TeamCard({ imageUrl, name, role, desc, index, isActive = true }) {
  const cardRef = useRef(null)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isClicked, setIsClicked] = useState(false)

  const handleMouseMove = (e) => {
    if (!cardRef.current || !isActive) return
    const card = cardRef.current
    const rect = card.getBoundingClientRect()
    
    // Calculate mouse position relative to the center of the card (-0.5 to 0.5)
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    
    setCoords({ x, y })
  }

  const handleMouseEnter = () => {
    if (isActive) setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setCoords({ x: 0, y: 0 })
  }

  const handleClick = () => {
    if (!isActive) return
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 300) // Reset after animation
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  // Calculate 3D rotate style values (adds default tilt on focus if no mouse)
  const rotateX = (isHovered && isActive) ? -coords.y * 20 : (isFocused && isActive) ? 6 : 0
  const rotateY = (isHovered && isActive) ? coords.x * 20 : (isFocused && isActive) ? -6 : 0
  const scale = isClicked ? 0.95 : ((isHovered || isFocused) && isActive) ? 1.05 : 1
  const showGlow = (isHovered || isFocused) && isActive

  return (
    <div 
      ref={cardRef}
      className={`relative group rounded-2xl overflow-hidden bg-surface-900/40 backdrop-blur-md border transition-all duration-700 ease-out focus:outline-none flex-shrink-0 w-[240px] sm:w-[280px] lg:w-[320px] aspect-[3/4] ${
        !isActive ? 'cursor-pointer select-none border-white/5 hover:border-white/10 shadow-none' :
        isFocused ? 'ring-2 ring-brand-500 border-brand-400 shadow-[0_0_40px_rgba(90,107,255,0.5)]' :
        isHovered ? 'border-white/40 shadow-[0_0_50px_rgba(255,255,255,0.25)]' :
        'border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.12)]'
      }`}
      style={{ 
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => isActive && setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isActive ? 0 : -1}
      role="button"
      aria-label={`${name} - ${role}`}
    >
      {/* Spotlight Radial Glow Effect */}
      {showGlow && (
        <div 
          className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-300"
          style={{
            background: isHovered 
              ? `radial-gradient(400px circle at ${(coords.x + 0.5) * 100}% ${(coords.y + 0.5) * 100}%, rgba(90, 107, 255, 0.25), transparent 60%)`
              : 'radial-gradient(400px circle at 50% 50%, rgba(90, 107, 255, 0.2), transparent 50%)'
          }}
        />
      )}

      {/* Card Content (image) */}
      <div className="absolute inset-0 overflow-hidden w-full h-full">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name || 'Team Member'} 
            className={`w-full h-full object-cover transition-all duration-700 pointer-events-none select-none ${isActive ? 'scale-100 filter-none' : 'scale-95 blur-[1px] brightness-75'}`}
            style={{
              transform: ((isHovered || isFocused) && isActive) ? 'scale(1.08) translateZ(10px)' : 'scale(1) translateZ(0px)',
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-500/10 via-surface-900 to-orange-500/10 flex flex-col items-center justify-center p-6 text-center select-none">
            <span className="text-5xl mb-3 opacity-20">👥</span>
            <p className="text-gray-500 text-xs font-semibold">No Image</p>
          </div>
        )}
      </div>

      {/* Vignette Shadow Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-700 z-15 pointer-events-none ${isActive ? 'opacity-100' : 'opacity-30'}`} />

      {/* Card Inner Details Overlay */}
      <div 
        className={`absolute bottom-0 inset-x-0 p-6 z-20 flex flex-col justify-end pointer-events-none select-none transition-all duration-700 ${
          isActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'
        }`}
        style={{ transform: 'translateZ(25px)' }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          <span className="text-brand-300 text-[10px] font-bold uppercase tracking-[0.2em]">{role || 'Team Member'}</span>
        </div>
        <h3 className="text-lg sm:text-xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {name || 'ชื่อสมาชิก'}
        </h3>
        <p className="text-gray-400 text-xs mt-2 line-clamp-2 leading-relaxed font-medium">
          {desc || 'มุ่งส่งมอบนวัตกรรมและเทคโนโลยีที่ดีที่สุดสำหรับคุณ'}
        </p>
      </div>
    </div>
  )
}

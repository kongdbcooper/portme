'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import EditableBlock from '../admin/EditableBlock'

// ------------------- 3D Tilt Card Component -------------------
function TiltCard({ children, className, style, onClick, isActive }) {
  const cardRef = useRef(null)
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 })

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -8
    const rotateY = ((x - centerX) / centerX) * 8
    const glowX = (x / rect.width) * 100
    const glowY = (y / rect.height) * 100
    setTilt({ rotateX, rotateY })
    setGlowPos({ x: glowX, y: glowY })
  }, [])

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => {
    setIsHovered(false)
    setTilt({ rotateX: 0, rotateY: 0 })
    setGlowPos({ x: 50, y: 50 })
  }

  return (
    <div
      ref={cardRef}
      className={`${className} ${isActive ? 'ring-2 ring-brand-500 shadow-brand-500/50' : ''}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
      tabIndex={0}
      style={{
        ...style,
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        transform: isHovered || isActive
          ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.05, 1.05, 1.05)`
          : 'rotateX(0) rotateY(0) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        zIndex: isHovered || isActive ? 50 : 1,
      }}
    >
      {(isHovered || isActive) && (
        <div
          className="absolute inset-0 z-10 pointer-events-none rounded-2xl opacity-60"
          style={{
            background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(90,107,255,0.2) 0%, transparent 60%)`,
          }}
        />
      )}
      {children}
    </div>
  )
}

// ------------------- Video Thumbnail Component -------------------
function VideoThumbnail({ video }) {
  const videoRef = useRef(null)

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((e) => console.log('Autoplay blocked:', e))
    }
  }
  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    <div
      className="h-72 overflow-hidden bg-transparent relative transition-colors"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={video.videoUrl}
        muted
        loop
        playsInline
        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-90 group-hover:scale-100">
        <div className="w-16 h-16 rounded-full bg-brand-500/80 backdrop-blur-md flex items-center justify-center hover:bg-brand-500 transition-all shadow-lg shadow-brand-500/30">
          <svg className="w-8 h-8 text-white fill-white ml-1" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-white font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
        ▶ Preview
      </div>
    </div>
  )
}

// ------------------- Main VideoSection Component -------------------
export default function VideoSection({ initialVideos = [] }) {
  const [videos, setVideos] = useState(initialVideos)
  const [loading, setLoading] = useState(initialVideos.length === 0)
  const [selectedVideo, setSelectedVideo] = useState(initialVideos[0] || null)
  const [showRelated, setShowRelated] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  
  const scrollRef = useRef(null)
  const playerRef = useRef(null)
  const videoElementRef = useRef(null)
  const autoScrollRef = useRef(null)
  const scrollSpeed = 0.5 // Slow and smooth

  // Fetch videos if NOT provided as props (fallback)
  useEffect(() => {
    if (initialVideos.length > 0) return

    async function fetchVideos() {
      try {
        const res = await fetch('/api/videos?limit=1000')
        if (res.ok) {
          const data = await res.json()
          const activeVideos = (data.videos || []).filter(v => v.isActive)
          setVideos(activeVideos)
          if (activeVideos.length > 0) {
            setSelectedVideo(activeVideos[0])
          }
        }
      } catch (err) {
        console.error('Failed to fetch videos', err)
      } finally {
        setLoading(false)
      }
    }
    fetchVideos()
  }, [initialVideos.length])

  // Auto-scroll logic for the carousel
  useEffect(() => {
    if (isPaused || !scrollRef.current || videos.length <= 3) return

    const container = scrollRef.current
    let animationId

    const step = () => {
      if (!container) return
      container.scrollLeft += scrollSpeed

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
  }, [isPaused, videos])

  const scrollBy = (direction) => {
    if (!scrollRef.current) return
    
    // Temporarily pause auto-scroll to allow manual navigation
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 5000) // Resume after 5s

    const cardWidth = window.innerWidth < 640 ? window.innerWidth * 0.85 : 380
    const gap = window.innerWidth < 640 ? 16 : 32
    const scrollAmount = (cardWidth + gap) * direction

    scrollRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    })
  }

  const handleCardClick = (video) => {
    setSelectedVideo(video)
    setShowRelated(false)
    
    // Smooth scroll to player
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleVideoEnd = () => {
    setShowRelated(true)
  }

  const playNext = () => {
    const currentIndex = videos.findIndex(v => v.id === selectedVideo?.id)
    const nextIndex = (currentIndex + 1) % videos.length
    handleCardClick(videos[nextIndex])
  }

  const playPrev = () => {
    const currentIndex = videos.findIndex(v => v.id === selectedVideo?.id)
    const prevIndex = (currentIndex - 1 + videos.length) % videos.length
    handleCardClick(videos[prevIndex])
  }

  return (
    <section className="py-24 bg-[#0a0a0f] overflow-hidden" id="videos">
      <div className="container mx-auto px-4">
        
        {/* ================= 1. THE COLLECTION AREA ================= */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <EditableBlock 
              settingKey="video_badge" 
              defaultText="Video Showcase" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-bold uppercase tracking-widest empty:hidden"
            />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            <EditableBlock as="span" settingKey="video_title_1" defaultText="My " />
            <EditableBlock as="span" className="gradient-text" settingKey="video_title_2" defaultText="Video Collection" />
          </h2>
          <div className="text-xl text-gray-400 max-w-2xl mx-auto">
            <EditableBlock 
              settingKey="video_desc" 
              multiline 
              defaultText="สำรวจคลังวิดีโอทั้งหมดของเรา เลือกชมผลงานที่น่าสนใจได้จากรายการด้านล่างนี้" 
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 bg-surface-900/50 rounded-3xl border border-white/5">
            <p className="text-gray-500 text-lg">ยังไม่มีวิดีโอในขณะนี้</p>
          </div>
        ) : (
          <div className="relative mb-32">
            {/* Carousel Controls */}
            <button
              onClick={() => scrollBy(-1)}
              className="absolute -left-4 md:-left-12 lg:-left-28 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-surface-800/90 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-brand-300 hover:bg-brand-500 hover:border-brand-500 hover:text-white transition-all duration-300 active:scale-90 shadow-3xl pointer-events-auto group"
              aria-label="Previous"
            >
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div
              ref={scrollRef}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
              className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-hide scroll-smooth px-4 sm:px-2 py-8 touch-pan-x"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {videos.map((video) => (
                <TiltCard
                  key={video.id}
                  onClick={() => handleCardClick(video)}
                  isActive={selectedVideo?.id === video.id}
                  className="relative group cursor-pointer rounded-[2rem] overflow-hidden transition-all duration-500 flex-shrink-0 w-[85vw] sm:w-[380px]"
                >
                  <VideoThumbnail video={video} />
                  <div className="p-8 relative z-20">
                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-brand-400 transition-colors duration-300 line-clamp-1">
                      {video.title}
                    </h3>
                    <p className="text-gray-400 mb-6 h-12 overflow-hidden text-sm leading-relaxed line-clamp-2">
                      {video.description || 'Watch this amazing video showcase.'}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-brand-500/80 uppercase tracking-widest">
                        <EditableBlock settingKey="video_card_cta_hint" defaultText="Click to play" />
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-500 transition-colors">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>

            <button
              onClick={() => scrollBy(1)}
              className="absolute -right-4 md:-right-12 lg:-right-28 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-surface-800/90 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-brand-300 hover:bg-brand-500 hover:border-brand-500 hover:text-white transition-all duration-300 active:scale-90 shadow-3xl pointer-events-auto group"
              aria-label="Next"
            >
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* ================= 2. DEDICATED PLAYER AREA ================= */}
        <div ref={playerRef} className="pt-20 scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              <EditableBlock as="span" settingKey="video_player_title_1" defaultText="ผลงานของเรา " />
              <span className="text-brand-500">
                <EditableBlock as="span" settingKey="video_player_title_2" defaultText="ในรูปแบบวิดีโอ" />
              </span>
            </h2>
            <div className="text-gray-400">
              <EditableBlock settingKey="video_player_desc" defaultText="รับชมวิดีโอแนะนำตัวและผลงานของเราได้ที่นี่" />
            </div>
          </div>

          {selectedVideo && (
            <div className="relative w-full max-w-[95%] lg:max-w-[85%] mx-auto group">
              {/* Main Player Container */}
              <div className="relative aspect-video bg-black rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-[0_0_120px_rgba(90,107,255,0.2)] border border-white/10 animate-fade-in">
                
                {/* Video Element */}
                <video
                  ref={videoElementRef}
                  key={selectedVideo.id}
                  src={selectedVideo.videoUrl}
                  controls={!showRelated}
                  autoPlay
                  onEnded={handleVideoEnd}
                  className={`w-full h-full object-contain ${showRelated ? 'opacity-30 scale-95' : 'opacity-100 scale-100'} transition-all duration-700`}
                />

                {/* Related Videos Overlay (When ended) */}
                {showRelated && (
                  <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-fade-in">
                    <h3 className="text-2xl font-bold text-white mb-8">
                      <EditableBlock settingKey="video_related_title" defaultText="Up Next" />
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl">
                      {/* ... existing videos map ... */}
                    </div>
                    <button 
                      onClick={() => setShowRelated(false)}
                      className="mt-10 px-8 py-3 rounded-full bg-brand-500 text-white font-bold hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/30"
                    >
                      <EditableBlock settingKey="video_replay_btn" defaultText="Replay" />
                    </button>
                  </div>
                )}

                {/* Navigation Arrows inside player */}
                {!showRelated && (
                  <>
                    <button 
                      onClick={playPrev}
                      className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-surface-900/40 md:bg-surface-900/20 hover:bg-brand-500 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 backdrop-blur-md z-50 shadow-2xl border border-white/5"
                    >
                      <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button 
                      onClick={playNext}
                      className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-surface-900/40 md:bg-surface-900/20 hover:bg-brand-500 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 backdrop-blur-md z-50 shadow-2xl border border-white/5"
                    >
                      <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </>
                )}
              </div>

              {/* Video Info below player */}
              <div className="mt-10 flex flex-col md:flex-row justify-between items-start gap-8 px-4">
                <div className="flex-1">
                  <h3 className="text-3xl font-black text-white mb-4 tracking-tight">{selectedVideo.title}</h3>
                  <p className="text-lg text-gray-400 leading-relaxed max-w-3xl">
                    {selectedVideo.description || 'เพลิดเพลินกับการรับชมวิดีโอคุณภาพสูงของเรา หากคุณมีคำถามสามารถติดต่อเราได้ทันที'}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-surface-800 text-white hover:bg-surface-700 transition-colors border border-white/5">
                    <svg className="w-5 h-5 text-brand-500" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>
                    <EditableBlock settingKey="video_share_btn" defaultText="แชร์วิดีโอ" />
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-500 text-white hover:bg-brand-600 transition-all hover:scale-105 shadow-lg shadow-brand-500/30">
                    <EditableBlock settingKey="video_contact_btn" defaultText="ติดต่อเรา" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  )
}

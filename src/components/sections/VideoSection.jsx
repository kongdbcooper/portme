'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import EditableBlock from '../admin/EditableBlock'

// ------------------- 3D Tilt Card Component -------------------
function TiltCard({ children, className, style, onClick }) {
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
      className={`${className} relative transition-all duration-500`}
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
        transform: isHovered && typeof window !== 'undefined' && window.innerWidth >= 768
          ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.03, 1.03, 1.03)`
          : 'rotateX(0) rotateY(0) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        zIndex: 1,
      }}
    >
      <div 
        className="absolute inset-0 z-30 pointer-events-none transition-opacity duration-500 rounded-xl sm:rounded-[2rem]"
        style={{
          background: isHovered 
            ? `radial-gradient(280px circle at ${glowPos.x}% ${glowPos.y}%, rgba(249, 115, 22, 0.15), rgba(90, 107, 255, 0.05), transparent 70%)` 
            : 'none',
          opacity: isHovered ? 1 : 0
        }}
      />
      {children}
    </div>
  )
}

// ------------------- VideoThumbnail Component -------------------
function VideoThumbnail({ video }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef(null)

  const handleMouseEnter = () => {
    setIsPlaying(true)
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }

  const handleMouseLeave = () => {
    setIsPlaying(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative aspect-video w-full overflow-hidden bg-black/40"
    >
      {video.thumbnail ? (
        <img
          src={video.thumbnail}
          alt={video.title}
          className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105 opacity-0' : 'scale-100 opacity-100'}`}
        />
      ) : null}
      
      <video
        ref={videoRef}
        src={video.videoUrl}
        muted
        playsInline
        loop
        preload="metadata"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-brand-500/80 backdrop-blur-md flex items-center justify-center hover:bg-brand-500 transition-all shadow-lg shadow-brand-500/30">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white ml-0.5 sm:ml-1" viewBox="0 0 24 24">
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
  const [isPlaying, setIsPlaying] = useState(false)
  
  const [centerIndex, setCenterIndex] = useState(0)
  const [windowWidth, setWindowWidth] = useState(1200)

  const playerRef = useRef(null)
  const videoElementRef = useRef(null)

  // Track window resizing for 3D layout offsets
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth)
      const handleResize = () => setWindowWidth(window.innerWidth)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Sync videos if initialVideos changes
  useEffect(() => {
    if (initialVideos.length > 0) {
      setVideos(initialVideos)
      setCenterIndex(Math.floor(initialVideos.length / 2))
      if (!selectedVideo) {
        setSelectedVideo(initialVideos[0])
      }
    }
  }, [initialVideos])

  // Fetch videos if NOT provided as props
  useEffect(() => {
    if (initialVideos.length > 0) return

    async function fetchVideos() {
      try {
        const res = await fetch('/api/videos?limit=1000', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const activeVideos = (data.videos || []).filter(v => v.isActive)
          setVideos(activeVideos)
          setCenterIndex(Math.floor(activeVideos.length / 2))
          if (activeVideos.length > 0 && !selectedVideo) {
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

  // Auto-rotate center card every 4 seconds
  useEffect(() => {
    if (isPaused || videos.length <= 1) return

    const interval = setInterval(() => {
      setCenterIndex((prev) => (prev + 1) % videos.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isPaused, videos.length])

  // Rotate manually using arrows or card clicks
  const rotateBy = (direction) => {
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 8000) // Hold auto-scroll for 8 seconds

    setCenterIndex((prev) => {
      const nextIdx = prev + direction
      if (nextIdx < 0) return videos.length - 1
      if (nextIdx >= videos.length) return 0
      return nextIdx
    })
  }

  // Calculate circular offset relative to centerIndex
  const getOffset = (index) => {
    let offset = index - centerIndex
    if (offset < -Math.floor(videos.length / 2)) {
      offset += videos.length
    } else if (offset > Math.floor(videos.length / 2)) {
      offset -= videos.length
    }
    return offset
  }

  // Generate 3D transform matrices dynamically based on screen sizes
  const getCardStyle = (offset) => {
    const isMobile = windowWidth < 640
    const isTablet = windowWidth >= 640 && windowWidth < 1024
    
    let xOffset = 300
    let scaleStep = 0.15
    let rotateYDeg = 30
    
    if (isMobile) {
      xOffset = 100
      scaleStep = 0.15
      rotateYDeg = 15
    } else if (isTablet) {
      xOffset = 210
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

  // Fix: คำนวณหา 4 วิดีโอแนะนำที่ไม่ซ้ำกับตัวที่กำลังเล่นอยู่
  const relatedVideos = useMemo(() => {
    return videos
      .filter(v => v.id !== selectedVideo?.id)
      .slice(0, 4)
  }, [videos, selectedVideo])

  const handleCardClick = (video) => {
    setSelectedVideo(video)
    setShowRelated(false)
    setIsPlaying(false)
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handlePlayClick = () => {
    if (videoElementRef.current) {
      videoElementRef.current.play().catch((e) => console.log('Play blocked:', e))
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
    <section className="py-24 bg-[#0a0a0f] overflow-hidden relative" id="videos">
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#0a0a0f]/70 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#0a0a0f]/40 via-[#0a0a0f]/12 to-transparent z-10 pointer-events-none" />

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
            <button
              onClick={() => rotateBy(-1)}
              className="absolute -left-4 md:-left-12 lg:-left-28 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-surface-800/90 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-brand-300 hover:bg-brand-500 hover:border-brand-500 hover:text-white transition-all duration-300 active:scale-90 shadow-3xl pointer-events-auto group"
              aria-label="Previous"
            >
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* ---- 3D Coverflow Container ---- */}
            <div
              className="relative w-full h-[320px] sm:h-[450px] lg:h-[480px] flex items-center justify-center overflow-visible select-none"
              style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              {videos.map((video, idx) => {
                const offset = getOffset(idx)
                const style = getCardStyle(offset)
                const isActive = offset === 0

                return (
                  <div
                    key={video.id}
                    style={style}
                    className="absolute transition-all duration-700 ease-out w-[240px] sm:w-[380px] h-full"
                    onClick={() => {
                      if (!isActive) {
                        rotateBy(offset)
                      } else {
                        handleCardClick(video)
                      }
                    }}
                  >
                    <div
                      style={{
                        animation: 'breathScale 6s ease-in-out infinite',
                        animationDelay: `${idx * 0.5}s`
                      }}
                      className="w-full h-full"
                    >
                      <TiltCard
                        onClick={() => {}}
                        isActive={selectedVideo?.id === video.id}
                        className="w-full h-full relative group cursor-pointer rounded-xl sm:rounded-[2rem] overflow-hidden bg-gradient-to-br from-surface-950/90 to-surface-900/70 border border-white/5 shadow-[0_0_20px_rgba(249,115,22,0.03)] hover:border-brand-500/40 hover:shadow-[0_0_45px_rgba(249,115,22,0.22)] focus:outline-none"
                      >
                        <VideoThumbnail video={video} />
                        <div className="p-3 sm:p-8 relative z-20">
                          <h3 className="text-xs sm:text-2xl font-bold text-white mb-1 sm:mb-3 group-hover:text-brand-400 transition-colors duration-300 line-clamp-1">
                            {video.title}
                          </h3>
                          <p className="text-gray-400 mb-1 sm:mb-6 h-6 sm:h-12 overflow-hidden text-[10px] sm:text-sm leading-relaxed line-clamp-2">
                            {video.description || 'Watch this amazing video showcase.'}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] sm:text-xs font-bold text-brand-500/80 uppercase tracking-widest">
                              <EditableBlock settingKey="video_card_cta_hint" defaultText="Click to play" />
                            </span>
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-500 transition-colors">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          </div>
                        </div>
                      </TiltCard>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => rotateBy(1)}
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
              <div className="relative w-full bg-[#0a0a0f]/60 rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-[0_0_120px_rgba(90,107,255,0.15)] border border-white/10 animate-fade-in flex items-center justify-center">
                
                <video
                  ref={videoElementRef}
                  key={selectedVideo.id}
                  src={selectedVideo.videoUrl}
                  controls={!showRelated && isPlaying}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={handleVideoEnd}
                  className={`w-full h-auto max-h-[75vh] md:max-h-[85vh] object-contain ${showRelated ? 'opacity-30 scale-95' : 'opacity-100 scale-100'} transition-all duration-700`}
                />

                {/* Play button overlay — visible when video is NOT playing */}
                {!isPlaying && !showRelated && (
                  <div
                    onClick={handlePlayClick}
                    className="absolute inset-0 z-30 flex items-center justify-center cursor-pointer bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 hover:bg-black/30"
                  >
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-brand-500/90 backdrop-blur-xl flex items-center justify-center hover:bg-brand-500 hover:scale-110 transition-all duration-300 shadow-[0_0_60px_rgba(90,107,255,0.5)]">
                      <svg className="w-10 h-10 md:w-14 md:h-14 text-white fill-white ml-1.5 md:ml-2" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}

                {showRelated && (
                  <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
                    <button 
                      onClick={playNext}
                      className="group flex flex-col items-center mb-6 md:mb-10 transition-transform hover:scale-105 active:scale-95"
                    >
                      <span className="text-brand-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mb-2">Up Next</span>
                      <h3 className="text-xl md:text-3xl font-black text-white group-hover:text-brand-400 transition-colors text-center px-4">
                        <EditableBlock settingKey="video_related_title" defaultText="เล่นวิดีโอถัดไป" />
                      </h3>
                      <div className="w-12 h-1 bg-brand-500 mt-3 rounded-full transition-all group-hover:w-24" />
                    </button>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 w-full max-w-5xl mb-8">
                      {relatedVideos.map((video) => (
                        <div 
                          key={video.id} 
                          onClick={() => handleCardClick(video)}
                          className="cursor-pointer group/item flex flex-col"
                        >
                          <div className="aspect-video bg-white/5 rounded-lg md:rounded-xl overflow-hidden mb-2 ring-1 ring-white/10 group-hover/item:ring-brand-500 transition-all shadow-xl relative">
                             {video.thumbnail ? (
                               <img 
                                 src={video.thumbnail} 
                                 alt="" 
                                 className="w-full h-full object-cover transition-transform group-hover/item:scale-110" 
                               />
                             ) : (
                               <video 
                                 src={video.videoUrl}
                                 muted
                                 playsInline
                                 preload="metadata"
                                 className="w-full h-full object-cover transition-transform group-hover/item:scale-110"
                                 onMouseOver={(e) => e.currentTarget.play()}
                                 onMouseOut={(e) => {
                                   e.currentTarget.pause();
                                   e.currentTarget.currentTime = 0;
                                 }}
                                />
                             )}
                             <div className="absolute inset-0 bg-black/20 group-hover/item:bg-transparent transition-colors" />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center shadow-lg">
                                  <svg className="w-4 h-4 text-white fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                             </div>
                          </div>
                          <p className="text-[10px] md:text-xs font-bold text-gray-300 truncate group-hover/item:text-brand-400 uppercase tracking-tighter">
                            {video.title}
                          </p>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => setShowRelated(false)}
                      className="px-6 py-2.5 md:px-8 md:py-3 rounded-full bg-white/10 text-white text-xs md:text-sm font-bold hover:bg-white/20 transition-all border border-white/10 flex items-center gap-2"
                    >
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <EditableBlock settingKey="video_replay_btn" defaultText="Replay" />
                    </button>
                  </div>
                )}
                
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
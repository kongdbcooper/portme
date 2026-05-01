'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

// ------------------- 3D Tilt Card Component -------------------
function TiltCard({ children, className, onClick }) {
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
    const rotateX = ((y - centerY) / centerY) * -12
    const rotateY = ((x - centerX) / centerX) * 12
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
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        transform: isHovered
          ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.03, 1.03, 1.03)`
          : 'rotateX(0) rotateY(0) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
      }}
    >
      {isHovered && (
        <div
          className="absolute inset-0 z-10 pointer-events-none rounded-2xl opacity-60"
          style={{
            background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(90,107,255,0.15) 0%, transparent 60%)`,
          }}
        />
      )}
      {children}
    </div>
  )
}

// ------------------- Main VideoSection Component -------------------
export default function VideoSection() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [isPaused, setIsPaused] = useState(false)
  const scrollRef = useRef(null)
  const autoScrollRef = useRef(null)
  const scrollSpeed = 1 // pixels per frame

  // Fetch ALL videos (unlimited)
  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch('/api/videos?limit=1000')
        if (res.ok) {
          const data = await res.json()
          const activeVideos = (data.videos || []).filter(v => v.isActive)
          setVideos(activeVideos)
        }
      } catch (err) {
        console.error('Failed to fetch videos', err)
      } finally {
        setLoading(false)
      }
    }
    fetchVideos()
  }, [])

  // ------------------- Auto-scroll Logic -------------------
  useEffect(() => {
    if (isPaused || !scrollRef.current || videos.length <= 3) return

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
  }, [isPaused, videos])

  // ------------------- Manual Scroll -------------------
  const scrollBy = (direction) => {
    if (!scrollRef.current) return
    const cardWidth = 380
    const gap = 32
    const scrollAmount = (cardWidth + gap) * direction

    scrollRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    })
  }

  const handleCardClick = (video) => {
    setSelectedVideo(video)
  }

  // Close modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedVideo(null)
    }
    if (selectedVideo) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedVideo])

  return (
    <section className="py-20 bg-[#0a0a0f]" id="videos">
      <div className="container mx-auto px-4">
        {/* ================= Section Heading ================= */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            My Videos Collection
          </h2>
          <p className="text-lg text-gray-400">
            Watch my latest videos and tutorials
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Loading videos...</div>
        ) : videos.length === 0 ? (
          <div className="text-center text-gray-500">No videos available</div>
        ) : (
          <div className="relative">
            {/* ---- Previous Button ---- */}
            <button
              onClick={() => scrollBy(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-30 w-12 h-12 bg-surface-800/90 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-brand-500 hover:border-brand-500 hover:scale-110 transition-all duration-300 shadow-xl group"
              aria-label="Previous"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* ---- Carousel Container ---- */}
            <div
              ref={scrollRef}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth px-2 py-4"
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
                  className="relative group cursor-pointer bg-surface-800/50 backdrop-blur-sm border border-white/5 rounded-2xl shadow-xl overflow-hidden transition-shadow duration-500 hover:shadow-brand-500/20 hover:border-brand-500/30 focus:shadow-brand-500/30 focus:border-brand-500/40 focus:outline-none flex-shrink-0"
                  style={{ width: '380px' }}
                >
                  {/* Video Thumbnail */}
                  <div className="h-72 overflow-hidden bg-black/40 relative">
                    <video
                      src={video.videoUrl}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors">
                        <svg className="w-8 h-8 text-white fill-white" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-white font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      ▶ Play
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="p-7 relative z-20">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-400 transition-colors duration-300 line-clamp-1">
                      {video.title}
                    </h3>
                    <p className="text-gray-400 mb-6 h-12 overflow-hidden text-sm line-clamp-2">
                      {video.description || 'No description'}
                    </p>
                    <div className="flex justify-end items-center pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCardClick(video)
                        }}
                        className="px-7 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20 hover:scale-105"
                      >
                        Watch
                      </button>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>

            {/* ---- Next Button ---- */}
            <button
              onClick={() => scrollBy(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-30 w-12 h-12 bg-surface-800/90 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-brand-500 hover:border-brand-500 hover:scale-110 transition-all duration-300 shadow-xl group"
              aria-label="Next"
            >
              <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* ---- Navigation Labels ---- */}
            <div className="flex justify-between items-center mt-6 px-16 text-xs text-gray-500">
              <span>← Click or scroll</span>
              <span>{videos.length} Videos</span>
              <span>Click to play →</span>
            </div>
          </div>
        )}
      </div>

      {/* ================= Video Player Modal ================= */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video Player */}
            <div className="bg-black rounded-2xl overflow-hidden border border-white/10">
              <video
                src={selectedVideo.videoUrl}
                controls
                autoPlay
                className="w-full aspect-video"
              />
            </div>

            {/* Video Details */}
            <div className="mt-6 space-y-3">
              <h2 className="text-3xl font-bold text-white">{selectedVideo.title}</h2>
              <p className="text-gray-400 text-lg">
                {selectedVideo.description || 'No description available'}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

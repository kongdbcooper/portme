'use client'

import { useRef, useState, useEffect } from 'react'
import EditableBlock from '../admin/EditableBlock'

export default function ContactSection({ settings = {}, videos = [] }) {
  const scrollRef = useRef(null)
  const autoScrollRef = useRef(null)
  const [isPaused, setIsPaused] = useState(false)
  const scrollSpeed = 1 // pixels per frame

  // ------------------- Auto-scroll Logic -------------------
  useEffect(() => {
    if (isPaused || !scrollRef.current || videos.length <= 1) return

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


  const scrollBy = (direction) => {
    if (!scrollRef.current) return
    const cardWidth = 380 // approx width
    const gap = 32
    const scrollAmount = (cardWidth + gap) * direction

    scrollRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <section
      id="contact"
      className="section-py relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 100%)' }}
    >
      {/* Decorative orb */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #5a6bff 0%, transparent 70%)', filter: 'blur(60px)' }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-medium mb-4">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
              <EditableBlock settingKey="contact_badge" defaultText={settings.contact_badge || "Showcase & Contact"} />
            </div>
            <h2 className="section-heading text-white">
              <EditableBlock as="span" settingKey="contact_title_1" defaultText={settings.contact_title_1 || "ผลงานของเรา "} />
              <EditableBlock as="span" className="gradient-text" settingKey="contact_title_2" defaultText={settings.contact_title_2 || "ในรูปแบบวิดีโอ"} />
            </h2>
            <div className="text-gray-500 mt-3">
              <EditableBlock 
                as="span" 
                settingKey="contact_desc" 
                multiline 
                defaultText={settings.contact_desc || "รับชมวิดีโอแนะนำตัวและผลงานของเราได้ที่นี่"} 
              />
            </div>
          </div>

          {/* Video Carousel */}
          <div className="mb-16 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            {videos.length === 0 ? (
              <div className="w-full aspect-video rounded-3xl bg-black/40 border border-white/10 flex flex-col items-center justify-center text-gray-500 shadow-[0_0_50px_-12px_rgba(90,107,255,0.25)]">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p>ยังไม่มีวิดีโอแสดงผล</p>
              </div>
            ) : (
              <div className="relative">
                {/* Previous Button */}
                <button
                  onClick={() => scrollBy(-1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-30 w-12 h-12 bg-surface-800/90 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-brand-500 hover:border-brand-500 hover:scale-110 transition-all duration-300 shadow-xl group"
                  aria-label="Previous"
                >
                  <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Carousel Container */}
                <div
                  ref={scrollRef}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                  className="flex gap-8 overflow-x-auto scroll-smooth px-2 py-4"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {videos.map(video => (
                    <div
                      key={video.id}
                      className="relative group bg-surface-800/50 backdrop-blur-sm border border-white/5 rounded-3xl shadow-[0_0_30px_-10px_rgba(90,107,255,0.15)] overflow-hidden transition-shadow duration-500 hover:shadow-[0_0_50px_-10px_rgba(90,107,255,0.3)] hover:border-brand-500/30 flex-shrink-0 flex flex-col"
                      style={{ width: '380px', minWidth: '300px' }}
                    >
                      <div className="aspect-video bg-black relative">
                        <video 
                          src={video.videoUrl} 
                          controls 
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                      <div className="p-6 relative z-20 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-400 transition-colors duration-300">
                          {video.title}
                        </h3>
                        {video.description && (
                          <p className="text-gray-400 text-sm line-clamp-3">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => scrollBy(1)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-30 w-12 h-12 bg-surface-800/90 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-brand-500 hover:border-brand-500 hover:scale-110 transition-all duration-300 shadow-xl group"
                  aria-label="Next"
                >
                  <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <style jsx global>{`
                  .overflow-x-auto::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-up max-w-4xl mx-auto" style={{ animationDelay: '0.4s' }}>
            <div className="glass-card p-6 text-center hover:-translate-y-1 transition-transform duration-300">
              <div className="text-3xl mb-3">📧</div>
              <div className="text-gray-500 text-sm mb-1">
                <EditableBlock settingKey="contact_label_1" defaultText={settings.contact_label_1 || "Email"} />
              </div>
              <div className="text-white text-base font-medium">
                <EditableBlock settingKey="contact_value_1" defaultText={settings.contact_value_1 || "hello@portme.co"} />
              </div>
            </div>
            <div className="glass-card p-6 text-center hover:-translate-y-1 transition-transform duration-300">
              <div className="text-3xl mb-3">📱</div>
              <div className="text-gray-500 text-sm mb-1">
                <EditableBlock settingKey="contact_label_2" defaultText={settings.contact_label_2 || "Line"} />
              </div>
              <div className="text-white text-base font-medium">
                <EditableBlock settingKey="contact_value_2" defaultText={settings.contact_value_2 || "@portme"} />
              </div>
            </div>
            <div className="glass-card p-6 text-center hover:-translate-y-1 transition-transform duration-300">
              <div className="text-3xl mb-3">🕐</div>
              <div className="text-gray-500 text-sm mb-1">
                <EditableBlock settingKey="contact_label_3" defaultText={settings.contact_label_3 || "เวลาทำการ"} />
              </div>
              <div className="text-white text-base font-medium">
                <EditableBlock settingKey="contact_value_3" defaultText={settings.contact_value_3 || "จ-ศ 9:00-18:00"} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

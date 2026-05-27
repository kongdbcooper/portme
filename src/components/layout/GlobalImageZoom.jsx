'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function GlobalImageZoom() {
  const [zoomUrl, setZoomUrl] = useState(null)

  useEffect(() => {
    const handleDocumentClick = (e) => {
      const img = e.target.closest('img')
      if (!img) return

      // Skip non-zoomable content
      const isHeader = e.target.closest('header') || e.target.closest('nav')
      const isFooter = e.target.closest('footer')
      const isButton = e.target.closest('button') || e.target.closest('a')
      const isIcon = img.width < 50 || img.height < 50
      const isNoZoom = img.classList.contains('no-zoom') || img.getAttribute('data-no-zoom') === 'true'

      if (isHeader || isFooter || isButton || isIcon || isNoZoom) return

      e.preventDefault()
      e.stopPropagation()
      setZoomUrl(img.src)
    }

    document.addEventListener('click', handleDocumentClick, true)
    return () => document.removeEventListener('click', handleDocumentClick, true)
  }, [])

  useEffect(() => {
    if (!zoomUrl) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setZoomUrl(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [zoomUrl])

  if (!zoomUrl) return null

  return (
    <div 
      onClick={() => setZoomUrl(null)}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
    >
      <button
        onClick={() => setZoomUrl(null)}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all border border-white/15 z-[110]"
        aria-label="Close image zoom"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative max-w-full max-h-[85vh] flex items-center justify-center p-2 z-[105]">
        {/* Background Blur backing for vertical fit */}
        <div 
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 scale-105 pointer-events-none rounded-2xl"
          style={{ backgroundImage: `url(${zoomUrl})` }}
        />
        
        <img
          src={zoomUrl} 
          alt="Zoomed view" 
          className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl z-40 animate-scale-in cursor-default border border-white/10"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}

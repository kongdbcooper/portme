'use client'

import { useState, useEffect } from 'react'

export default function ProductGallery({ images, productName }) {
  const [activeImage, setActiveImage] = useState(images[0] || null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  // ================= KEYBOARD NAVIGATION FOR LIGHTBOX =================
  const activeIndex = images.findIndex(img => img.imageUrl === activeImage?.imageUrl)

  const navigate = (direction) => {
    if (images.length <= 1) return
    const offset = direction === 'next' ? 1 : -1
    const nextIdx = (activeIndex + offset + images.length) % images.length
    setActiveImage(images[nextIdx])
  }

  const handlePrev = (e) => {
    e?.stopPropagation()
    navigate('prev')
  }

  const handleNext = (e) => {
    e?.stopPropagation()
    navigate('next')
  }

  useEffect(() => {
    if (!isLightboxOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false)
      } else if (e.key === 'ArrowLeft') {
        navigate('prev')
      } else if (e.key === 'ArrowRight') {
        navigate('next')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  },)

  if (!activeImage) {
    return (
      <div className="w-full aspect-[4/5] bg-surface-800 rounded-3xl flex items-center justify-center text-gray-500 border border-white/5">
        ไม่มีรูปภาพสินค้า
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">
      {/* Active Main Image Container - Adaptive to image's natural aspect ratio */}
      <div 
        onClick={() => setIsLightboxOpen(true)}
        className="relative w-full group flex flex-col items-center justify-center cursor-zoom-in"
      >
        {/* Blurred background backing for horizontal/vertical image fit */}
        <div 
          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110 pointer-events-none rounded-3xl"
          style={{ backgroundImage: `url(${activeImage.imageUrl})` }}
        />
        
        {/* Border and backdrop wrapper that shrinks to fit the exact image shape */}
        <div className="relative z-20 w-auto max-w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-surface-950/80 flex items-center justify-center transition-all duration-300 group-hover:border-brand-500/40">
          <img
            src={activeImage.imageUrl}
            alt={productName}
            className="max-w-full h-auto max-h-[45vh] sm:max-h-[60vh] lg:max-h-[75vh] object-contain transition-all duration-500 ease-out group-hover:scale-[1.015]"
            key={activeImage.id || activeImage.imageUrl}
            data-no-zoom="true"
          />

          {/* Hover Zoom Icon & Hint Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-30 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md border border-white/20 p-3 rounded-full text-white scale-90 group-hover:scale-100 transition-transform duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Overlay Navigation Buttons on Main Image */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 bg-black/60 hover:bg-brand-500 hover:scale-105 active:scale-95 text-white rounded-full flex items-center justify-center transition-all border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 bg-black/60 hover:bg-brand-500 hover:scale-105 active:scale-95 text-white rounded-full flex items-center justify-center transition-all border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Next image"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail List */}
      {images.length > 1 && (
        <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
          {images.map((img, idx) => {
            const isActive = activeImage.imageUrl === img.imageUrl
            return (
              <button
                key={img.id || idx}
                onClick={() => setActiveImage(img)}
                className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-surface-900 border transition-all duration-300 ${
                  isActive
                    ? 'border-brand-500 ring-2 ring-brand-500/20 scale-95 shadow-md shadow-brand-500/20'
                    : 'border-white/10 hover:border-white/30 hover:scale-102'
                }`}
              >
                <img
                  src={img.imageUrl}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  data-no-zoom="true"
                />
              </button>
            )
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between items-center p-4 sm:p-8 select-none animate-fade-in"
        >
          {/* Lightbox Header */}
          <div className="w-full flex items-center justify-between text-white z-50">
            <span className="text-sm font-semibold truncate max-w-[70%] drop-shadow-md">
              {productName} {images.length > 1 && `(${activeIndex + 1}/${images.length})`}
            </span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all border border-white/15"
              aria-label="Close fullscreen view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Lightbox Main Image & Navigation */}
          <div className="relative flex-1 w-full flex items-center justify-center">
            {/* Background Blur backing for vertical fit inside Lightbox */}
            <div 
              className="absolute inset-0 bg-cover bg-center blur-2xl opacity-15 scale-110 pointer-events-none"
              style={{ backgroundImage: `url(${activeImage.imageUrl})` }}
            />

            <img
              src={activeImage.imageUrl}
              alt={productName}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-[75vh] sm:max-h-[80vh] object-contain rounded-xl shadow-2xl z-40 animate-scale-in"
              data-no-zoom="true"
            />

            {/* Navigation Arrows inside Lightbox */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-white/5 hover:bg-white/15 active:scale-95 text-white rounded-full flex items-center justify-center transition-all border border-white/10 backdrop-blur-md shadow-lg"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-white/5 hover:bg-white/15 active:scale-95 text-white rounded-full flex items-center justify-center transition-all border border-white/10 backdrop-blur-md shadow-lg"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Lightbox Footer (Thumbnail Strip) */}
          {images.length > 1 && (
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="w-full flex justify-center gap-2 overflow-x-auto py-2 z-50 max-w-full scrollbar-hide"
            >
              {images.map((img, idx) => {
                const isActive = activeImage.imageUrl === img.imageUrl
                return (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-surface-900 border transition-all duration-300 flex-shrink-0 ${
                      isActive
                        ? 'border-brand-500 ring-2 ring-brand-500/20 scale-95'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <img
                      src={img.imageUrl}
                      alt={`${productName} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      data-no-zoom="true"
                    />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

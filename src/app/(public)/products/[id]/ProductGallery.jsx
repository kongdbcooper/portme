'use client'

import { useState } from 'react'

export default function ProductGallery({ images, productName }) {
  const [activeImage, setActiveImage] = useState(images[0] || null)

  if (!activeImage) {
    return (
      <div className="w-full aspect-[4/5] bg-surface-800 rounded-3xl flex items-center justify-center text-gray-500 border border-white/5">
        ไม่มีรูปภาพสินค้า
      </div>
    )
  }

  const activeIndex = images.findIndex(img => img.imageUrl === activeImage?.imageUrl)

  const handlePrev = (e) => {
    e.stopPropagation()
    const prevIdx = activeIndex <= 0 ? images.length - 1 : activeIndex - 1
    setActiveImage(images[prevIdx])
  }

  const handleNext = (e) => {
    e.stopPropagation()
    const nextIdx = activeIndex >= images.length - 1 ? 0 : activeIndex + 1
    setActiveImage(images[nextIdx])
  }

  return (
    <div className="space-y-4">
      {/* Active Main Image Container - Adaptive to image's natural aspect ratio */}
      <div className="relative w-full group flex flex-col items-center justify-center">
        {/* Blurred background backing for horizontal/vertical image fit */}
        <div 
          className="absolute inset-0 bg-cover bg-center blur-3xl opacity-35 scale-110 pointer-events-none rounded-3xl"
          style={{ backgroundImage: `url(${activeImage.imageUrl})` }}
        />
        
        {/* Border and backdrop wrapper that shrinks to fit the exact image shape */}
        <div className="relative z-20 w-auto max-w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-surface-950/80 flex items-center justify-center">
          <img
            src={activeImage.imageUrl}
            alt={productName}
            className="max-w-full h-auto max-h-[80vh] lg:max-h-[85vh] object-contain transition-all duration-300 ease-out group-hover:scale-[1.01]"
            key={activeImage.id || activeImage.imageUrl}
          />
        </div>

        {/* Overlay Navigation Buttons */}
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
        <div className="flex flex-wrap gap-2 pt-1">
          {images.map((img, idx) => {
            const isActive = activeImage.imageUrl === img.imageUrl
            return (
              <button
                key={img.id || idx}
                onClick={() => setActiveImage(img)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-surface-900 border transition-all duration-300 ${
                  isActive
                    ? 'border-brand-500 ring-2 ring-brand-500/20 scale-95 shadow-md shadow-brand-500/20'
                    : 'border-white/10 hover:border-white/30 hover:scale-102'
                }`}
              >
                <img
                  src={img.imageUrl}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

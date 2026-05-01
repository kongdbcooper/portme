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

// ------------------- Main ProductSection Component -------------------
export default function ProductSection({ abVariant }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isPaused, setIsPaused] = useState(false)
  const scrollRef = useRef(null)
  const autoScrollRef = useRef(null)
  const scrollSpeed = 1 // pixels per frame

  // Fetch ALL products (no limit)
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products?limit=100')
        if (res.ok) {
          const data = await res.json()
          setProducts(data.products || [])
        }
      } catch (err) {
        console.error('Failed to fetch products', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // ------------------- Auto-scroll Logic -------------------
  useEffect(() => {
    if (isPaused || !scrollRef.current || products.length <= 3) return

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
  }, [isPaused, products])

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

  const handleProductClick = async (productId, e) => {
    e.stopPropagation()
    try {
      await fetch('/api/ab-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, variant: abVariant, eventType: 'CLICK' })
      })
    } catch (err) {
      console.error('Failed to record click', err)
    }
  }

  const handleCardClick = (product) => {
    setSelectedProduct(product)
  }

  // Close modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedProduct(null)
    }
    if (selectedProduct) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedProduct])

  // Featured product = first product (the base product for the ad)
  const featuredProduct = products.length > 0 ? products[0] : null

  return (
    <section className="py-20 bg-[#0a0a0f]" id="products">
      <div className="container mx-auto px-4">

        {/* ================= Ad / Promotion Banner ================= */}
        {!loading && featuredProduct && (
          <div
            className="relative mb-16 rounded-3xl overflow-hidden border border-white/5 cursor-pointer group"
            onClick={() => handleCardClick(featuredProduct)}
            style={{
              background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1035 40%, #0d0d1f 100%)',
            }}
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-600/5 rounded-full blur-3xl" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8 md:p-12 lg:p-16">
              {/* Left Side — Self Introduction */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                  About Me
                </div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                  Hi, I'm <span className="text-brand-400">Pang</span>
                </h2>

                <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                  A passionate developer who loves building modern web applications. I specialize in full-stack development with Next.js, React, and Node.js. Let's create something amazing together.
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Full-Stack Developer
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-600" />
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Thailand
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const contactSection = document.getElementById('contact')
                    if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl shadow-brand-500/20 group/btn"
                >
                  Get in Touch
                  <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              {/* Right Side — Profile Image */}
              <div className="relative flex items-center justify-center">
                {/* Glow behind image */}
                <div className="absolute inset-0 bg-brand-500/10 rounded-full blur-3xl scale-75 group-hover:scale-90 transition-transform duration-700" />

                <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-black/50 group-hover:scale-105 transition-transform duration-700 border border-white/5">
                  <img
                    src="/picture/blue.jpg"
                    alt="About Me"
                    className="w-full h-full object-cover"
                  />
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= Section Heading ================= */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Try to click the image
          </h2>
          <p className="text-lg text-gray-400">
            {abVariant === 'A' ? 'You will see the pop up' : 'You will see the button'}
          </p>
        </div>


        {loading ? (
          <div className="text-center text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-500">No picture of me</div>
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
              {products.map(product => (
                <TiltCard
                  key={product.id}
                  onClick={() => handleCardClick(product)}
                  className="relative group cursor-pointer bg-surface-800/50 backdrop-blur-sm border border-white/5 rounded-2xl shadow-xl overflow-hidden transition-shadow duration-500 hover:shadow-brand-500/20 hover:border-brand-500/30 focus:shadow-brand-500/30 focus:border-brand-500/40 focus:outline-none flex-shrink-0"
                  style={{ width: '380px' }}
                >
                  {product.imageUrl && (
                    <div className="h-72 overflow-hidden bg-black/40 relative">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-white font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        ✨ Quick View
                      </div>
                    </div>
                  )}
                  <div className="p-7 relative z-20">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-400 transition-colors duration-300">
                      {product.name}
                    </h3>
                    <p className="text-gray-400 mb-6 h-12 overflow-hidden text-sm line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex justify-end items-center pt-2">
                      <button
                        onClick={(e) => handleProductClick(product.id, e)}
                        className="px-7 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20 hover:scale-105"
                      >
                        Click me
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
            <div className="flex justify-between items-center mt-6 px-2">
              <button
                onClick={() => scrollBy(-1)}
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-medium group"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {/* Auto-scroll indicator */}
              <div className="flex items-center gap-2 text-gray-600 text-xs">
                <div className={`w-2 h-2 rounded-full transition-colors ${isPaused ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`} />
                {isPaused ? 'Paused' : 'Auto-scrolling'}
              </div>

              <button
                onClick={() => scrollBy(1)}
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-medium group"
              >
                Next
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------- 3D Pop-out Modal ------------------- */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
          onClick={() => setSelectedProduct(null)}
          style={{ animation: 'fadeIn 0.3s ease-out forwards' }}
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
          <div
            className="relative w-full max-w-3xl overflow-visible flex items-center justify-center"
            style={{ perspective: '2000px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative w-full"
              style={{
                transformStyle: 'preserve-3d',
                animation: 'pop3d 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              }}
            >
              <div className="rounded-3xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5),0_30px_60px_-30px_rgba(90,107,255,0.3)]">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full max-h-[60vh] object-contain bg-black/50"
                  style={{ filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))' }}
                />
              </div>
              <div
                className="mt-6 mx-auto max-w-lg bg-surface-800/80 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-2xl text-center"
                style={{ transform: 'translateZ(80px)', animation: 'slideUp 0.5s 0.2s ease-out both' }}
              >
                <h2 className="text-3xl font-black text-white mb-2">{selectedProduct.name}</h2>
                <p className="text-gray-300 mb-4">{selectedProduct.description}</p>
                <div className="text-3xl font-black text-brand-400">
                  ฿{Number(selectedProduct.price).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute -top-4 -right-4 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 hover:rotate-90 transition-all duration-300 z-50"
                style={{ transform: 'translateZ(120px)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- Animations + Hide Scrollbar ------------------- */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pop3d {
          0% {
            opacity: 0;
            transform: scale(0.4) rotateX(25deg) translateY(120px);
          }
          60% {
            transform: scale(1.05) rotateX(-3deg) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotateX(0deg) translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateZ(80px) translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateZ(80px) translateY(0);
          }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}

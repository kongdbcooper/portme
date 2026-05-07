'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
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
      className={className}
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
          ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.05, 1.05, 1.05)`
          : 'rotateX(0) rotateY(0) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        zIndex: isHovered ? 50 : 1,
      }}
    >
      {isHovered && (
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

// ------------------- Main ProductSection Component -------------------
export default function ProductSection({ abVariant, settings = {}, initialProducts = [] }) {
  const [products, setProducts] = useState(initialProducts)
  const [loading, setLoading] = useState(initialProducts.length === 0)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isPaused, setIsPaused] = useState(false)
  const scrollRef = useRef(null)
  const autoScrollRef = useRef(null)
  const scrollSpeed = 1 // pixels per frame

  // Fetch products if NOT provided as props (fallback)
  useEffect(() => {
    if (initialProducts.length > 0) return

    async function fetchProducts() {
      try {
        const res = await fetch('/api/products?limit=1000')
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
  }, [initialProducts.length])

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

  const handleProductClick = async (product, e) => {
    e.stopPropagation()
    setSelectedProduct(product) // Open Modal
    try {
      await fetch('/api/ab-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, variant: abVariant, eventType: 'CLICK' })
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

  return (
    <section className="bg-[#0a0a0f] overflow-hidden relative" id="products">
      {/* Seamless Transition Overlays */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent z-30 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-[#0a0a0f] to-transparent z-30 pointer-events-none" />

      <div className="container mx-auto px-6">
        {/* ================= Section Heading ================= */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <EditableBlock 
              settingKey="prod_badge_label" 
              defaultText="Product Collection" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-bold uppercase tracking-widest empty:hidden"
            />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 tracking-tight">
            <EditableBlock as="span" settingKey="prod_section_title_1" defaultText="Explore " />
            <EditableBlock as="span" className="gradient-text" settingKey="prod_section_title_2" defaultText="Our Collection" />
          </h2>
          <div className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            <EditableBlock settingKey="prod_section_desc" defaultText="สัมผัสผลงานและผลิตภัณฑ์ทั้งหมดของเรา เลือกชมรายละเอียดแต่ละชิ้นได้จากรายการด้านล่าง" />
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-20">
            <EditableBlock settingKey="prod_loading_text" defaultText="Loading products..." />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <EditableBlock settingKey="prod_empty_text" defaultText="No products found" />
          </div>
        ) : (
          <div className="relative">
            {/* ---- Previous Button ---- */}
            <button
              onClick={() => scrollBy(-1)}
              className="absolute -left-4 md:-left-10 lg:-left-24 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-surface-800/90 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-brand-300 hover:bg-brand-500 hover:border-brand-500 hover:text-white transition-all duration-300 active:scale-90 shadow-3xl pointer-events-auto group"
              aria-label="Previous"
            >
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* ---- Carousel Container ---- */}
            <div
              ref={scrollRef}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
              className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-hide scroll-smooth px-4 sm:px-2 py-4 touch-pan-x"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {products.map((product) => (
                <TiltCard
                  key={product.id}
                  onClick={() => handleCardClick(product)}
                  className="relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-brand-500/10 focus:outline-none flex-shrink-0 w-[82vw] sm:w-[45%] lg:w-[380px]"
                >
                  <div className="h-64 sm:h-72 lg:h-80 overflow-hidden bg-surface-900 relative">
                    <Image
                      src={product.imageUrl || '/picture/blue.jpg'}
                      alt={product.name || 'Product'}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 380px"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      unoptimized={product.imageUrl?.startsWith('blob:') ? true : false}
                      priority={products.indexOf(product) < 3} 
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="w-16 h-16 rounded-full bg-brand-500/80 backdrop-blur-md flex items-center justify-center hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/30">
                        <svg className="w-8 h-8 text-white fill-white" viewBox="0 0 24 24">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <h3 className="text-2xl font-black text-white group-hover:text-brand-400 transition-colors line-clamp-1">{product.name}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">{product.description}</p>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/50 font-bold uppercase tracking-wider">
                          <EditableBlock settingKey="prod_card_label" defaultText="Product" />
                        </span>
                      </div>
                      <button 
                        onClick={(e) => handleProductClick(product, e)}
                        className="text-brand-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-1 transition-transform"
                      >
                        <EditableBlock settingKey="prod_card_cta" defaultText="Details" />
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>

            {/* ---- Next Button ---- */}
            <button
              onClick={() => scrollBy(1)}
              className="absolute -right-4 md:-right-10 lg:-right-24 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-surface-800/90 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-brand-300 hover:bg-brand-500 hover:border-brand-500 hover:text-white transition-all duration-300 active:scale-90 shadow-3xl pointer-events-auto group"
              aria-label="Next"
            >
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ================= Product Modal ================= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            onClick={() => setSelectedProduct(null)}
          />
          <div className="relative w-full max-w-6xl max-h-[90vh] bg-surface-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 md:top-8 md:right-8 z-50 w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="w-full md:w-1/2 h-[40vh] md:h-auto relative bg-black/40">
              <Image
                src={selectedProduct.imageUrl || '/picture/blue.jpg'}
                alt={selectedProduct.name}
                fill
                className="object-contain p-12"
              />
            </div>

            <div className="w-full md:w-1/2 p-12 md:p-20 overflow-y-auto space-y-10">
              <div className="space-y-4">
                <div className="inline-block px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-widest">
                  <EditableBlock settingKey="prod_modal_badge" defaultText="Featured Product" />
                </div>
                <h3 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-tight">
                  {selectedProduct.name}
                </h3>
              </div>

              <div className="space-y-6">
                <h4 className="text-white text-lg font-bold uppercase tracking-widest opacity-50">
                  <EditableBlock settingKey="prod_modal_desc_label" defaultText="Description" />
                </h4>
                <p className="text-xl text-gray-400 leading-relaxed font-medium">
                  {selectedProduct.description}
                </p>
              </div>

              <div className="pt-10 flex flex-wrap gap-6">
                <a
                  href={selectedProduct.abVariant || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto px-8 md:px-12 py-4 md:py-6 bg-brand-500 hover:bg-brand-600 text-white font-black text-lg rounded-2xl transition-all hover:scale-105 shadow-xl shadow-brand-500/20 text-center">
                  <EditableBlock settingKey="prod_modal_cta" defaultText="View Live Project" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
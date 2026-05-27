// =============================================================================
// src/components/layout/Navbar.js — Main Navigation Bar
// Responsive navbar พร้อม mobile menu, smooth scroll links
// ใช้งานร่วมกับ: src/app/layout.js, src/app/globals.css
// =============================================================================

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import BrandLogo from './BrandLogo'
import EditableBlock from '../admin/EditableBlock'
import { MdSearch } from 'react-icons/md'

// Navigation links สำหรับ smooth scroll ไปแต่ละ section
const NAV_LINKS = [
  { label: 'Home', href: '#hero' },
  { label: 'Products', href: '#products' },
  { label: 'About Me', href: '#contact' },
]

export default function Navbar({ settings = {} }) {
  const [isScrolled, setIsScrolled] = useState(false) 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const logoUrl = settings.site_logo || ''
  const siteName = settings.site_name || 'Monkey'

  // ------------------- Scroll Detection -------------------
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Toggle sticky style
      setIsScrolled(currentScrollY > 20)

      // Smart Header Logic: Hide on scroll down, Show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false) // Scrolling down
      } else {
        setIsVisible(true)  // Scrolling up
      }
      
      setLastScrollY(currentScrollY)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // ------------------- Active Section Detection -------------------
  // Highlight nav link ที่ตรงกับ section ที่กำลังอยู่
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-50% 0px -50% 0px' }
    )

    const sections = document.querySelectorAll('section[id]')
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  // ------------------- Autocomplete / Live Search Suggestions -------------------
  useEffect(() => {
    if (!searchQuery.trim()) {
      return
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(searchQuery.trim())}&limit=5`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.products || [])
          setShowDropdown(true)
        }
      } catch (err) {
        console.error('Failed to fetch search suggestions:', err)
      } finally {
        setIsLoading(false)
      }
    }, 250) // 250ms debounce delay

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#navbar-search-container')) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // ------------------- Search Handler -------------------
  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setIsMobileMenuOpen(false)
    setShowDropdown(false)
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 transform ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isScrolled
          ? 'bg-surface-900/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <nav className="section-container">
        <div className="flex items-center h-20 gap-2">

          {/* ------------------- Left: Logo ------------------- */}
          <div className="flex items-center shrink-0 w-[140px] sm:w-[160px] lg:w-1/4">
            <BrandLogo
              href="/#hero"
              logoUrl={logoUrl}
              siteName={siteName}
              className="flex items-center gap-2 sm:gap-3"
              iconClassName="shadow-glow group-hover:scale-110 transition-transform duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </div>

          {/* ------------------- Center: Search Bar + Nav Links (together) ------------------- */}
          <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 px-2">
            <div id="navbar-search-container" className="relative w-full max-w-[200px] sm:max-w-sm md:max-w-md lg:max-w-lg transition-all duration-300">
              <form onSubmit={handleSearch} className="relative group">
                <MdSearch size={22} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="ค้นหา..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                  className="w-full bg-surface-800/80 border border-white/10 rounded-full py-2 sm:py-2.5 pl-11 pr-4 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-brand-500/50 focus:bg-surface-800 focus:shadow-[0_0_15px_rgba(90,107,255,0.15)] transition-all duration-300"
                />
                {isLoading && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                  </span>
                )}
              </form>

              {/* Suggestions Dropdown */}
              {showDropdown && (suggestions.length > 0 || isLoading) && (
                <div className="absolute left-0 right-0 w-full mt-2 bg-surface-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-fade-in">
                  <div className="p-2 max-h-60 overflow-y-auto space-y-1 scrollbar-thin">
                    {suggestions.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setShowDropdown(false)
                          setSearchQuery('')
                          router.push(`/search?q=${encodeURIComponent(product.name)}`)
                        }}
                        className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-800 shrink-0 border border-white/5">
                          {product.imageUrl ? (
                            <image src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/20">
                              {product.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-semibold text-white truncate">{product.name}</h4>
                          <span className="text-[10px] text-brand-400">{product.category || 'สินค้า'}</span>
                        </div>
                        <div className="text-[11px] font-black text-white shrink-0">
                          ฿{Number(product.price).toLocaleString()}
                        </div>
                      </button>
                    ))}

                    {!isLoading && suggestions.length === 0 && (
                      <div className="text-center py-4 text-xs text-gray-500">
                        ไม่พบสินค้าที่ตรงกัน
                      </div>
                    )}
                  </div>

                  {suggestions.length > 0 && (
                    <button
                      onClick={() => {
                        setShowDropdown(false)
                        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                      }}
                      className="w-full text-center py-2.5 text-[11px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border-t border-white/5 font-medium"
                    >
                      ดูผลลัพธ์ทั้งหมดสำหรับ {searchQuery}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Desktop Nav Links — right next to search bar */}
            <ul className="hidden lg:flex items-center gap-0.5 shrink-0">
              <li>
                <Link href="/#hero" className={`relative px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${pathname === '/' ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <EditableBlock settingKey="nav_link_1" defaultText="Home" />
                  {pathname === '/' && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />}
                </Link>
              </li>
              <li>
                <Link href="/products" className={`relative px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${pathname.startsWith('/products') ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <EditableBlock settingKey="nav_link_2" defaultText="Products" />
                  {pathname.startsWith('/products') && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />}
                </Link>
              </li>
              <li>
                <Link href="/about" className={`relative px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${pathname.startsWith('/about') ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <EditableBlock settingKey="nav_link_3" defaultText="About Me" />
                  {pathname.startsWith('/about') && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />}
                </Link>
              </li>
            </ul>
          </div>

          {/* ------------------- Right: CTA Buttons + Hamburger ------------------- */}
          <div className="flex items-center justify-end shrink-0 gap-2">
            <Link
              href="/login"
              id="navbar-login-btn"
              className="hidden lg:inline-flex btn-ghost text-sm px-4 py-2"
            >
              <EditableBlock settingKey="nav_login_label" defaultText={settings.nav_login_label || "Admin"} />
            </Link>
            <a
              href="#contact"
              id="navbar-contact-btn"
              className="hidden lg:inline-flex btn-gradient text-sm px-4 py-2"
            >
              <EditableBlock settingKey="nav_contact_label" defaultText={settings.nav_contact_label || "Contact Me"} />
            </a>

            {/* Mobile Hamburger */}
            <button
              id="navbar-mobile-menu-btn"
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`block h-0.5 bg-current rounded transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2.5' : ''}`} />
                <span className={`block h-0.5 bg-current rounded transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 bg-current rounded transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* ------------------- Mobile Menu ------------------- */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out ${
            isMobileMenuOpen ? 'max-h-screen opacity-100 py-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-surface-900/98 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 mt-2 space-y-1 shadow-2xl">
            
            {/* Note: Mobile search is now in the main header, but we can keep a larger one here if needed, or remove it. I'll remove it to avoid duplicate states or keep it simple. */}
            <Link
              href="/#hero"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                pathname === '/' 
                  ? 'text-white bg-brand-500/20 border border-brand-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <EditableBlock settingKey="nav_link_1" defaultText="Home" />
            </Link>
            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                pathname.startsWith('/products') 
                  ? 'text-white bg-brand-500/20 border border-brand-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <EditableBlock settingKey="nav_link_2" defaultText="Products" />
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                pathname.startsWith('/about') 
                  ? 'text-white bg-brand-500/20 border border-brand-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <EditableBlock settingKey="nav_link_3" defaultText="About Me" />
            </Link>
            
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-xl border border-brand-500/40 text-brand-400 font-medium hover:bg-brand-500/10 transition-colors"
              >
                <EditableBlock settingKey="nav_login_label" defaultText="Admin" />
              </Link>
              <a
                href="#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-gradient text-center py-2.5"
              >
                <EditableBlock settingKey="nav_contact_label" defaultText="Contact Me" />
              </a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

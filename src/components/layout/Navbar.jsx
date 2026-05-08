// =============================================================================
// src/components/layout/Navbar.js — Main Navigation Bar
// Responsive navbar พร้อม mobile menu, smooth scroll links
// ใช้งานร่วมกับ: src/app/layout.js, src/app/globals.css
// =============================================================================

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import BrandLogo from './BrandLogo'
import EditableBlock from '../admin/EditableBlock'

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
        <div className="flex items-center justify-between h-20">

          {/* ------------------- Logo ------------------- */}
          <BrandLogo
            logoUrl={logoUrl}
            siteName={siteName}
            className="flex items-center gap-3"
            iconClassName="shadow-glow group-hover:scale-110 transition-transform duration-300"
          />

          {/* ------------------- Desktop Nav Links ------------------- */}
          <ul className="hidden md:flex items-center gap-1">
            <li>
              <a href="#hero" className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeSection === 'hero' ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <EditableBlock settingKey="nav_link_1" defaultText="Home" />
                {activeSection === 'hero' && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />}
              </a>
            </li>
            <li>
              <a href="#products" className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeSection === 'products' ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <EditableBlock settingKey="nav_link_2" defaultText="Products" />
                {activeSection === 'products' && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />}
              </a>
            </li>
            <li>
              <a href="#contact" className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeSection === 'contact' ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <EditableBlock settingKey="nav_link_3" defaultText="About Me" />
                {activeSection === 'contact' && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />}
              </a>
            </li>
          </ul>

          {/* ------------------- CTA Buttons ------------------- */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              id="navbar-login-btn"
              className="btn-ghost text-sm px-4 py-2"
            >
              <EditableBlock settingKey="nav_login_label" defaultText={settings.nav_login_label || "Admin"} />
            </Link>
            <a
              href="#contact"
              id="navbar-contact-btn"
              className="btn-gradient text-sm px-4 py-2"
            >
              <EditableBlock settingKey="nav_contact_label" defaultText={settings.nav_contact_label || "Contact Me"} />
            </a>
          </div>

          {/* ------------------- Mobile Hamburger ------------------- */}
          <button
            id="navbar-mobile-menu-btn"
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
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

        {/* ------------------- Mobile Menu ------------------- */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
            isMobileMenuOpen ? 'max-h-screen opacity-100 py-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-surface-900/98 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 mt-2 space-y-1 shadow-2xl">
            <a
              href="#hero"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                activeSection === 'hero' 
                  ? 'text-white bg-brand-500/20 border border-brand-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <EditableBlock settingKey="nav_link_1" defaultText="Home" />
            </a>
            <a
              href="#products"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                activeSection === 'products' 
                  ? 'text-white bg-brand-500/20 border border-brand-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <EditableBlock settingKey="nav_link_2" defaultText="Products" />
            </a>
            <a
              href="#contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                activeSection === 'contact' 
                  ? 'text-white bg-brand-500/20 border border-brand-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <EditableBlock settingKey="nav_link_3" defaultText="About Me" />
            </a>
            
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

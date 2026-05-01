// =============================================================================
// src/components/layout/Navbar.js — Main Navigation Bar
// Responsive navbar พร้อม mobile menu, smooth scroll links
// ใช้งานร่วมกับ: src/app/layout.js, src/app/globals.css
// =============================================================================

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Navigation links สำหรับ smooth scroll ไปแต่ละ section
const NAV_LINKS = [
  { label: 'Main', href: '#hero' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact Me', href: '#contact' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false) 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')

  // ------------------- Scroll Detection -------------------
  // เปลี่ยน navbar style เมื่อ scroll ลงมา (glassmorphism effect)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-surface-900/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <nav className="section-container">
        <div className="flex items-center justify-between h-20">

          {/* ------------------- Logo ------------------- */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>P</span>
            </div>
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Port<span className="gradient-text">Me</span>
            </span>
          </Link>

          {/* ------------------- Desktop Nav Links ------------------- */}
          <ul className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => {
              const sectionId = href.replace('#', '')
              const isActive = activeSection === sectionId

              return (
                <li key={href}>
                  <a
                    href={href}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {label}
                    {/* Active indicator dot */}
                    {isActive && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />
                    )}
                  </a>
                </li>
              )
            })}
          </ul>

          {/* ------------------- CTA Buttons ------------------- */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              id="navbar-login-btn"
              className="btn-ghost text-sm px-4 py-2"
            >
              Login
            </Link>
            <a
              href="#contact"
              id="navbar-contact-btn"
              className="btn-gradient text-sm px-4 py-2"
            >
              Contact Me
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
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'max-h-80 pb-4' : 'max-h-0'
          }`}
        >
          <div className="glass-card p-4 mt-2 space-y-1">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
              >
                {label}
              </a>
            ))}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-xl border border-brand-500/40 text-brand-400 font-medium hover:bg-brand-500/10 transition-colors"
              >
                Login
              </Link>
              <a
                href="#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-gradient text-center py-2.5"
              >
                Contact Me
              </a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

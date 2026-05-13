// =============================================================================
// src/app/layout.js — Root Layout
// Layout หลักของทั้งเว็บไซต์ รวม Navbar, Footer, Google Analytics, Fonts
// ใช้งานร่วมกับ: src/components/layout/Navbar.js, Footer.js
//               src/components/analytics/GoogleAnalytics.js
//               src/app/globals.css, tailwind.config.js
// =============================================================================

import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics'

// ------------------- SEO Metadata (Default) -------------------
// แต่ละ page สามารถ override ด้วย generateMetadata()
export const metadata = {
  title: {
    default: 'PortMe — แพลตฟอร์มจัดการโปรดักซ์ยุคใหม่',
    template: '%s | PortMe', // format: "ชื่อหน้า | PortMe"
  },
  description:
    'Admin Dashboard ' +
    'และระบบจัดการรูปภาพบน Cloudflare R2 อัตโนมัติ',
  keywords: ['PortMe', 'admin dashboard', 'product management', 'e-commerce', 'Thailand'],
  authors: [{ name: 'PortMe Team' }],
  creator: 'PortMe',
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'PortMe',
    title: 'PortMe — แพลตฟอร์มจัดการโปรดักซ์ยุคใหม่',
    description: 'แพลตฟอร์มจัดการโปรดักซ์สำหรับธุรกิจยุคใหม่',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PortMe',
    description: 'แพลตฟอร์มจัดการโปรดักซ์สำหรับธุรกิจยุคใหม่',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

/**
 * RootLayout — Layout หลักทั้งโปรเจค
 * ทุก page จะ render ภายใน layout นี้
 */
export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        {/* Preconnect สำหรับ Google Fonts เพื่อ performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-surface-900">
        {/* Google Analytics 4 */}
        <GoogleAnalytics />

        {/* ------------------- Main Content ------------------- */}
        {/* Render children (ซึ่งจะรวม Layout ของแต่ละกลุ่มด้วย) */}
        {children}
      </body>
    </html>
  )
}

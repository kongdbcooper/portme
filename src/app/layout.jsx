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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://portme-psi.vercel.app'),
  title: {
    default: 'Monkey — Portfolio & Product Showcase',
    template: '%s | Monkey',
  },
  description:
    'แพลตฟอร์ม Portfolio สำหรับโชว์ผลงาน พร้อมระบบจัดการสินค้า คลังสินค้า Real-time และ Admin Dashboard ครบวงจร',
  keywords: ['portfolio', 'showcase', 'ผลงาน', 'สินค้า', 'admin dashboard', 'product management', 'e-commerce', 'Thailand', 'Monkey'],
  authors: [{ name: 'Monkey' }],
  creator: 'Monkey',
  publisher: 'Monkey',
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: '/',
    siteName: 'Monkey',
    title: 'Monkey — Portfolio & Product Showcase',
    description: 'แพลตฟอร์ม Portfolio สำหรับโชว์ผลงาน พร้อมระบบจัดการสินค้า คลังสินค้า Real-time และ Admin Dashboard ครบวงจร',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Monkey — Portfolio & Product Showcase',
    description: 'แพลตฟอร์ม Portfolio สำหรับโชว์ผลงาน พร้อมระบบจัดการสินค้า คลังสินค้า Real-time และ Admin Dashboard ครบวงจร',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: '/',
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
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Monkey',
              url: process.env.NEXT_PUBLIC_APP_URL || 'https://portme-psi.vercel.app',
              description: 'แพลตฟอร์ม Portfolio สำหรับโชว์ผลงาน พร้อมระบบจัดการสินค้าครบวงจร',
              inLanguage: 'th-TH',
            }),
          }}
        />
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

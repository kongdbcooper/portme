// =============================================================================
// src/components/analytics/GoogleAnalytics.js — Google Analytics 4
// โหลด GA4 script ผ่าน next/script strategy="afterInteractive"
// ใช้งานร่วมกับ: src/app/layout.js
// ต้องตั้งค่า NEXT_PUBLIC_GA_ID ใน .env.local
// =============================================================================

'use client'

import Script from 'next/script'

/**
 * GoogleAnalytics Component
 * โหลด Google Analytics 4 tracking script
 * strategy="afterInteractive" = โหลดหลัง page hydration (ไม่กระทบ performance)
 */
export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  // ไม่โหลดถ้าไม่มี GA ID (development without config)
  if (!gaId) return null

  return (
    <>
      {/* Google Tag Manager Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />

      {/* GA4 Configuration */}
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
            // ตั้งค่า privacy-friendly
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure',
          });
        `}
      </Script>
    </>
  )
}

// ------------------- Track Custom Events -------------------
// ใช้ track event ต่าง ๆ เช่น product click, form submit
export function trackEvent(eventName, parameters = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters)
  }
}

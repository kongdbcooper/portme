// =============================================================================
// src/app/robots.js — Robots.txt Generation
// ควบคุมการเข้าถึงของ Search Engine Crawler
// =============================================================================

export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portme.co'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/login',
        '/signup',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

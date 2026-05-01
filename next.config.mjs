// =============================================================================
// next.config.mjs — Next.js Configuration
// ใช้งานร่วมกับ: ทั้งโปรเจค
// =============================================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Compiler (Next.js 16 feature)
  reactCompiler: true,
  serverExternalPackages: ['@prisma/client'],
  

  // ------------------- Images -------------------
  // อนุญาตให้โหลดรูปจาก Cloudflare R2 และ external sources
  images: {
    remotePatterns: [
      {
        // Cloudflare R2 public bucket URL
        protocol: 'https',
        hostname: '*.r2.dev',
        pathname: '/**',
      },
      {
        // Custom domain สำหรับ R2 (ถ้ามี)
        protocol: 'https',
        hostname: process.env.R2_PUBLIC_HOSTNAME || 'placeholder.com',
        pathname: '/**',
      },
    ],
  },

  // ------------------- Security Headers -------------------
  // เพิ่ม HTTP security headers สำหรับ HTTPS และ CSP
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // ป้องกัน clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // ป้องกัน MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Content Security Policy (CSP)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.r2.dev https://www.google-analytics.com",
              "connect-src 'self' https://www.google-analytics.com https://analytics.google.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig

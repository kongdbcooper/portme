// =============================================================================
// next.config.mjs — Next.js Configuration
// ใช้งานร่วมกับ: ทั้งโปรเจค
// =============================================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Compiler (Next.js 16 feature)
  
  reactCompiler: true,
  serverExternalPackages: ['@prisma/client', 'pg'],
  

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
          // Prevent browser and CDN caching for dynamic content
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
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
          // Content Security Policy (CSP) - Strong security posture
          // Removed 'unsafe-inline' and 'unsafe-eval' to prevent XSS injection attacks
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // เพิ่ม 'unsafe-inline' เพื่อให้สคริปต์ในหน้า index รันได้
              // เพิ่ม 'unsafe-eval' หาก Library บางตัว (เช่นที่ใช้ใน Next 16) จำเป็นต้องใช้
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.gstatic.com",
              
              // เพิ่ม 'unsafe-inline' เพื่อให้ CSS จาก Tailwind หรือ Library อื่นๆ ที่แทรกใน Tag style ทำงานได้
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.r2.dev https://*.r2.cloudflarestorage.com https://www.google-analytics.com https://images.unsplash.com",
              "media-src 'self' blob: https://*.r2.dev https://*.r2.cloudflarestorage.com",
              "connect-src 'self' https://*.r2.dev https://*.r2.cloudflarestorage.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig

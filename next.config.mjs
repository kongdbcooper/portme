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
          // Content Security Policy (CSP) - Strong security posture
          // Removed 'unsafe-inline' and 'unsafe-eval' to prevent XSS injection attacks
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // script-src: No inline scripts allowed (use bundled/external)
              // Google Analytics and Tag Manager need special treatment (they use inline scripts)
              // Alternative: use Google Analytics Script Tag Manager or load via <script> tags only
              "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://www.gstatic.com",
              // style-src: Use external stylesheets only (Tailwind CSS is bundled)
              "style-src 'self' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.r2.dev https://*.r2.cloudflarestorage.com https://www.google-analytics.com",
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

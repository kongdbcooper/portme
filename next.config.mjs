// =============================================================================
// next.config.mjs — Next.js Configuration
// ใช้งานร่วมกับ: ทั้งโปรเจค
// =============================================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['@prisma/client', 'pg'],

  // ------------------- Images -------------------
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: process.env.R2_PUBLIC_HOSTNAME || 'placeholder.com',
        pathname: '/**',
      },
    ],
  },

  // ------------------- Security Headers -------------------
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },

          // ✅ CSP FIXED CLEAN VERSION
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",

              // scripts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.gstatic.com https://challenges.cloudflare.com",

              // styles
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

              // fonts
              "font-src 'self' data: https://fonts.gstatic.com",

              // images
              "img-src 'self' data: blob: https://*.r2.dev https://*.r2.cloudflarestorage.com https://www.google-analytics.com https://images.unsplash.com",

              // media
              "media-src 'self' blob: https://*.r2.dev https://*.r2.cloudflarestorage.com",

              // API / fetch
              "connect-src 'self' https://*.r2.dev https://*.r2.cloudflarestorage.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://challenges.cloudflare.com",

              // iframe (Turnstile)
              "frame-src https://challenges.cloudflare.com",

              // security
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
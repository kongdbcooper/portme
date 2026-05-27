// =============================================================================
// src/app/sitemap.js — Sitemap Generation
// ช่วยให้ Google ค้นหาหน้าต่างๆ ในเว็บไซต์ได้ง่ายขึ้น
// =============================================================================

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portme-psi.vercel.app'

  // 1. Static routes
  const routes = [
    '',
    '/about',
    '/search',
    '/login',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))

  // 2. Dynamic product routes (ถ้ามีหน้ารายละเอียดแยก)
  // ในโปรเจคนี้ สมมติว่ามีหน้า /products/[id]
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, updatedAt: true },
  })

  const productRoutes = products.map((product) => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...routes, ...productRoutes]
}

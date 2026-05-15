import { prisma } from './prisma'

// ------------------- Get Fresh Products (No Cache) -------------------
export async function getFreshProducts() {
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { order: 'asc' } } },
    })
  } catch (error) {
    console.error('[Data] Failed to fetch products:', error)
    return []
  }
}

// ------------------- Get Fresh Videos (No Cache) -------------------
export async function getFreshVideos() {
  try {
    return await prisma.video.findMany({
      where: { isActive: true },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    })
  } catch (error) {
    console.error('[Data] Failed to fetch videos:', error)
    return []
  }
}

// ------------------- Get Banners (No Cache) -------------------
export async function getBanners() {
  try {
    return await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
  } catch (error) {
    console.error('[Data] Failed to fetch banners:', error)
    return []
  }
}

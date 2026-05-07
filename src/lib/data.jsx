import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'

// ------------------- Get Cached Products -------------------
export const getCachedProducts = unstable_cache(
  async () => {
    try {
      return await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      console.error('[Data] Failed to fetch products:', error)
      return []
    }
  },
  ['products-cache'],
  {
    revalidate: 300, // 5 minutes
    tags: ['products'],
  }
)

// ------------------- Get Cached Videos -------------------
export const getCachedVideos = unstable_cache(
  async () => {
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
  },
  ['videos-cache'],
  {
    revalidate: 300, // 5 minutes
    tags: ['videos'],
  }
)

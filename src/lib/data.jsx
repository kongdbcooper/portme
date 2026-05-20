import { prisma } from './prisma'

// ------------------- Cache Variables -------------------
const CACHE_DURATION = 60000; // 60 วินาที

let productsCache = null;
let productsLastFetch = 0;
let productsPromise = null;

let videosCache = null;
let videosLastFetch = 0;
let videosPromise = null;

let bannersCache = null;
let bannersLastFetch = 0;
let bannersPromise = null;

// ------------------- Cache Invalidation -------------------
export function clearAllCache() {
  productsCache = null;
  productsLastFetch = 0;
  videosCache = null;
  videosLastFetch = 0;
  bannersCache = null;
  bannersLastFetch = 0;
}

// ------------------- Get Fresh Products -------------------
export async function getFreshProducts() {
  const now = Date.now();
  if (productsCache && (now - productsLastFetch < CACHE_DURATION)) {
    return productsCache;
  }
  if (productsPromise) {
    return productsPromise;
  }

  productsPromise = (async () => {
    try {
      const data = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: { images: { orderBy: { order: 'asc' } } },
      });
      
      if (!data) throw new Error("Database returned empty payload for products");

      productsCache = data;
      productsLastFetch = Date.now();
      return productsCache;
    } catch (error) {
      console.error('[Data] Failed to fetch products:', error);
      if (productsCache) return productsCache; // Fallback to old cache
      throw error; // Throw to trigger Next.js error boundary instead of returning empty []
    } finally {
      productsPromise = null;
    }
  })();

  return productsPromise;
}

// ------------------- Get Fresh Videos -------------------
export async function getFreshVideos() {
  const now = Date.now();
  if (videosCache && (now - videosLastFetch < CACHE_DURATION)) {
    return videosCache;
  }
  if (videosPromise) {
    return videosPromise;
  }

  videosPromise = (async () => {
    try {
      const data = await prisma.video.findMany({
        where: { isActive: true },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' },
        ],
      });
      
      if (!data) throw new Error("Database returned empty payload for videos");

      videosCache = data;
      videosLastFetch = Date.now();
      return videosCache;
    } catch (error) {
      console.error('[Data] Failed to fetch videos:', error);
      if (videosCache) return videosCache;
      throw error;
    } finally {
      videosPromise = null;
    }
  })();

  return videosPromise;
}

// ------------------- Get Banners -------------------
export async function getBanners() {
  const now = Date.now();
  if (bannersCache && (now - bannersLastFetch < CACHE_DURATION)) {
    return bannersCache;
  }
  if (bannersPromise) {
    return bannersPromise;
  }

  bannersPromise = (async () => {
    try {
      const data = await prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });
      
      if (!data) throw new Error("Database returned empty payload for banners");

      bannersCache = data;
      bannersLastFetch = Date.now();
      return bannersCache;
    } catch (error) {
      console.error('[Data] Failed to fetch banners:', error);
      if (bannersCache) return bannersCache;
      throw error;
    } finally {
      bannersPromise = null;
    }
  })();

  return bannersPromise;
}

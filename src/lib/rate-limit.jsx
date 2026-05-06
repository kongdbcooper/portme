// src/lib/rate-limit.js — Simple In-Memory Rate Limiter
// Note: This is for single-node instances. For multi-node, use Redis.

import { LRUCache } from 'lru-cache'

const options = {
  max: 500, // Max users to track
  ttl: 60000, // 1 minute window
}

const tokenCache = new LRUCache(options)

export async function rateLimit(request, limit = 10) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
  const currentCount = tokenCache.get(ip) || 0
  
  if (currentCount >= limit) {
    return { success: false, remaining: 0 }
  }
  
  const nextCount = currentCount + 1
  tokenCache.set(ip, nextCount)
  
  return { success: true, remaining: limit - nextCount }
}

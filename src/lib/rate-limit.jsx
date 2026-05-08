// =============================================================================
// src/lib/rate-limit.js — Progressive Rate Limiter with Lockout
// ป้องกัน brute-force login: ยิ่งล้มเหลวมาก ยิ่งถูก block นาน
// Note: This is for single-node instances. For multi-node, use Redis.
// =============================================================================

import { LRUCache } from 'lru-cache'

// Track attempt counts per IP (1 minute window)
const attemptCache = new LRUCache({
  max: 500,
  ttl: 60_000, // 1 minute
})

// Track lockouts per IP (longer TTL)
const lockoutCache = new LRUCache({
  max: 500,
  ttl: 15 * 60_000, // 15 minutes max lockout
})

/**
 * Rate limit with progressive lockout
 * @param {Request} request
 * @param {number} limit - Max attempts per minute
 * @returns {{ success: boolean, remaining: number, retryAfterMs?: number }}
 */
export async function rateLimit(request, limit = 10) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'

  // Check if IP is currently locked out
  const lockout = lockoutCache.get(ip)
  if (lockout) {
    const now = Date.now()
    if (now < lockout.until) {
      const retryAfterMs = lockout.until - now
      return { success: false, remaining: 0, retryAfterMs }
    }
    // Lockout expired, remove it
    lockoutCache.delete(ip)
  }

  const currentCount = attemptCache.get(ip) || 0

  if (currentCount >= limit) {
    // Progressive lockout: duration increases with consecutive lockouts
    const lockoutRecord = lockoutCache.get(ip)
    const consecutiveLockouts = lockoutRecord?.consecutiveLockouts || 0
    
    // Lockout durations: 30s → 60s → 2min → 5min → 10min → 15min
    const lockoutDurations = [30_000, 60_000, 120_000, 300_000, 600_000, 900_000]
    const lockoutDuration = lockoutDurations[Math.min(consecutiveLockouts, lockoutDurations.length - 1)]

    lockoutCache.set(ip, {
      until: Date.now() + lockoutDuration,
      consecutiveLockouts: consecutiveLockouts + 1,
    })

    return { success: false, remaining: 0, retryAfterMs: lockoutDuration }
  }

  const nextCount = currentCount + 1
  attemptCache.set(ip, nextCount)

  return { success: true, remaining: limit - nextCount }
}

/**
 * Reset rate limit for an IP after successful login
 * Prevents carrying over lockout state after a valid login
 */
export function resetRateLimit(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
  attemptCache.delete(ip)
  lockoutCache.delete(ip)
}

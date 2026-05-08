// src/lib/security.js — Security Utilities

/**
 * Validate that the request is coming from our own origin.
 * Helps prevent CSRF attacks.
 */
export function validateOrigin(request) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  
  if (!origin) return true // Some requests might not have origin (e.g. server-to-server)
  
  // Create a URL from origin to compare with host
  try {
    const originUrl = new URL(origin)
    // In production, you'd check against your actual domain
    // For local dev, we check if it matches the host
    return originUrl.host === host
  } catch {
    return false
  }
}

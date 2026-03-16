/**
 * @fileoverview WA Rate Limiter
 * @description Rate limiting implementation compliant with WA Policy V2.3 Section 4.3
 * @module lib/wa-rate-limiter
 */

/**
 * Rate limit configuration options
 */
export interface WaRateLimitOptions {
  /** Maximum requests allowed in the window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
}

/**
 * Rate limit check result
 */
export interface WaRateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean
  /** Remaining requests in current window */
  remaining: number
  /** Timestamp when the window resets */
  resetTime: number
  /** Headers to include in response */
  headers: Record<string, string>
}

/**
 * In-memory rate limit store
 * @description Redis-ready interface for future scaling
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Default rate limit configurations by endpoint type
 */
export const WA_RATE_LIMITS = {
  /** General API endpoints: 100 requests per minute */
  api: { maxRequests: 100, windowMs: 60000 },
  /** Authentication endpoints: 5 requests per minute */
  auth: { maxRequests: 5, windowMs: 60000 },
  /** File upload endpoints: 10 requests per minute */
  upload: { maxRequests: 10, windowMs: 60000 },
  /** Search endpoints: 30 requests per minute */
  search: { maxRequests: 30, windowMs: 60000 },
  /** Export/PDF endpoints: 5 requests per minute */
  export: { maxRequests: 5, windowMs: 60000 },
} as const

/**
 * Generate a rate limit key from request identifiers
 * @param ip - Client IP address
 * @param path - Request path
 * @param userId - Optional user ID (takes precedence over IP)
 * @returns Rate limit key string
 */
export function waGetRateLimitKey(ip: string, path: string, userId?: string): string {
  const identifier = userId || ip
  return `rate:${identifier}:${path}`
}

/**
 * Check if a request is allowed under rate limiting
 * @param key - Rate limit key
 * @param options - Rate limit configuration
 * @returns Rate limit check result
 */
export async function waCheckRateLimit(
  key: string,
  options: WaRateLimitOptions
): Promise<WaRateLimitResult> {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Check if window has expired
  if (!entry || now >= entry.resetTime) {
    const resetTime = now + options.windowMs
    rateLimitStore.set(key, { count: 1, resetTime })

    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime,
      headers: {
        'X-RateLimit-Limit': String(options.maxRequests),
        'X-RateLimit-Remaining': String(options.maxRequests - 1),
        'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
      },
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)

  const remaining = Math.max(0, options.maxRequests - entry.count)
  const allowed = entry.count <= options.maxRequests

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
    headers: {
      'X-RateLimit-Limit': String(options.maxRequests),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000)),
      ...(allowed ? {} : { 'Retry-After': String(Math.ceil((entry.resetTime - now) / 1000)) }),
    },
  }
}

/**
 * Reset rate limit for a specific key
 * @param key - Rate limit key to reset
 */
export function waResetRateLimit(key: string): void {
  rateLimitStore.delete(key)
}

/**
 * Clear all rate limits (for testing)
 */
export function waClearAllRateLimits(): void {
  rateLimitStore.clear()
}

/**
 * Get client IP from request headers
 * @param headers - Request headers
 * @returns Client IP address
 */
export function waGetClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

/**
 * @fileoverview API Handler with Rate Limiting Tests
 * @description Tests for rate-limited API handler wrapper utilities
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'

describe('waApiHandler utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  describe('Rate Limit Integration', () => {
    it('should exhaust rate limit after max requests', async () => {
      const { waCheckRateLimit, waClearAllRateLimits, waGetRateLimitKey, WA_RATE_LIMITS } = await import('@/lib/wa-rate-limiter')

      waClearAllRateLimits()

      const key = waGetRateLimitKey('192.168.1.100', '/api/test')
      const authLimit = WA_RATE_LIMITS.auth // 5 requests per minute

      // Make 5 allowed requests
      for (let i = 0; i < 5; i++) {
        const result = await waCheckRateLimit(key, authLimit)
        expect(result.allowed).toBe(true)
      }

      // 6th request should be blocked
      const result = await waCheckRateLimit(key, authLimit)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should return correct headers in rate limit result', async () => {
      const { waCheckRateLimit, waClearAllRateLimits, waGetRateLimitKey, WA_RATE_LIMITS } = await import('@/lib/wa-rate-limiter')

      waClearAllRateLimits()

      const key = waGetRateLimitKey('192.168.1.101', '/api/test')
      const apiLimit = WA_RATE_LIMITS.api // 100 requests per minute

      const result = await waCheckRateLimit(key, apiLimit)

      expect(result.headers['X-RateLimit-Limit']).toBe('100')
      expect(result.headers['X-RateLimit-Remaining']).toBe('99')
      expect(result.headers['X-RateLimit-Reset']).toBeTruthy()
    })

    it('should include Retry-After header when blocked', async () => {
      const { waCheckRateLimit, waClearAllRateLimits, waGetRateLimitKey, WA_RATE_LIMITS } = await import('@/lib/wa-rate-limiter')

      waClearAllRateLimits()

      const key = waGetRateLimitKey('192.168.1.102', '/api/blocked')
      const authLimit = WA_RATE_LIMITS.auth

      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await waCheckRateLimit(key, authLimit)
      }

      // Should include Retry-After
      const result = await waCheckRateLimit(key, authLimit)
      expect(result.allowed).toBe(false)
      expect(result.headers['Retry-After']).toBeTruthy()
    })
  })

  describe('Rate Limit Types', () => {
    it('should have different limits for different endpoint types', async () => {
      const { WA_RATE_LIMITS } = await import('@/lib/wa-rate-limiter')

      // API: 100 requests per minute
      expect(WA_RATE_LIMITS.api.maxRequests).toBe(100)
      expect(WA_RATE_LIMITS.api.windowMs).toBe(60000)

      // Auth: 5 requests per minute (more restrictive)
      expect(WA_RATE_LIMITS.auth.maxRequests).toBe(5)
      expect(WA_RATE_LIMITS.auth.windowMs).toBe(60000)

      // Upload: 10 requests per minute
      expect(WA_RATE_LIMITS.upload.maxRequests).toBe(10)

      // Search: 30 requests per minute
      expect(WA_RATE_LIMITS.search.maxRequests).toBe(30)

      // Export: 5 requests per minute
      expect(WA_RATE_LIMITS.export.maxRequests).toBe(5)
    })
  })

  describe('Client IP Extraction', () => {
    it('should extract IP from x-forwarded-for header', async () => {
      const { waGetClientIp } = await import('@/lib/wa-rate-limiter')

      const headers = new Headers({ 'x-forwarded-for': '192.168.1.1, 10.0.0.1' })
      const ip = waGetClientIp(headers)

      expect(ip).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header', async () => {
      const { waGetClientIp } = await import('@/lib/wa-rate-limiter')

      const headers = new Headers({ 'x-real-ip': '10.0.0.1' })
      const ip = waGetClientIp(headers)

      expect(ip).toBe('10.0.0.1')
    })

    it('should default to 127.0.0.1 if no IP header', async () => {
      const { waGetClientIp } = await import('@/lib/wa-rate-limiter')

      const headers = new Headers()
      const ip = waGetClientIp(headers)

      expect(ip).toBe('127.0.0.1')
    })
  })
})

/**
 * @fileoverview WA API Handler with Rate Limiting
 * @description Wrapper for API routes with built-in rate limiting
 * @module lib/wa-api-handler
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  waCheckRateLimit,
  waGetRateLimitKey,
  waGetClientIp,
  WA_RATE_LIMITS,
  waClearAllRateLimits,
} from './wa-rate-limiter'

/**
 * API handler options
 */
export interface WaApiHandlerOptions {
  /** Type of rate limit to apply */
  rateLimitType?: keyof typeof WA_RATE_LIMITS
  /** Skip rate limiting (use sparingly) */
  skipRateLimit?: boolean
}

/**
 * API handler function type
 */
export type WaApiHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<Response>

/**
 * Create a rate-limited API handler
 * @param handler - The API handler function
 * @param options - Handler options
 * @returns Wrapped handler with rate limiting
 */
export function waCreateApiHandler(
  handler: WaApiHandler,
  options: WaApiHandlerOptions = {}
): WaApiHandler {
  const { rateLimitType = 'api', skipRateLimit = false } = options

  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    // Skip rate limiting if configured
    if (skipRateLimit) {
      return handler(request, context)
    }

    // Get rate limit config
    const rateLimitConfig = WA_RATE_LIMITS[rateLimitType]

    // Generate rate limit key
    const ip = waGetClientIp(request.headers)
    const path = new URL(request.url).pathname
    const key = waGetRateLimitKey(ip, path)

    // Check rate limit
    const rateLimitResult = await waCheckRateLimit(key, rateLimitConfig)

    // If rate limited, return 429
    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...rateLimitResult.headers,
          },
        }
      )
    }

    // Execute handler and add rate limit headers to response
    const response = await handler(request, context)

    // Clone response to add headers
    const newHeaders = new Headers(response.headers)
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      newHeaders.set(key, value)
    })

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  }
}

/**
 * Reset all handler rate limits (for testing)
 */
export function waResetAllHandlerLimits(): void {
  waClearAllRateLimits()
}

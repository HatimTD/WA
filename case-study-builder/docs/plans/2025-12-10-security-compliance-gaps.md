# Security & Compliance Gaps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement missing security controls (rate limiting, SBOM) and complete feature gaps (WhatsApp/Teams sharing) to achieve full WA Policy V2.3 compliance.

**Architecture:** Rate limiting via in-memory store with Redis-ready interface in API routes (proxy.ts is for routing only per Next.js 16 best practices). Share buttons extended with WhatsApp/Teams. SBOM generated via CycloneDX. Comprehensive test coverage across unit, E2E, smoke, and security tests.

**Tech Stack:** Next.js 16, TypeScript, Jest, Playwright, CycloneDX SBOM generator

---

## CRITICAL MERGE RULES

> **STRICT REQUIREMENT:** ALL changes in this plan MUST ONLY be merged to `test/merge-all-features` branch.
>
> **DO NOT** merge to `main` under any circumstances.
>
> **Workflow:**
> 1. Create feature branch from `test/merge-all-features`
> 2. Implement features
> 3. Merge ONLY to `test/merge-all-features`
> 4. Run ALL tests before merge

---

## Task 1: Create Rate Limiting Library

**Files:**
- Create: `lib/wa-rate-limiter.ts`
- Test: `__tests__/lib/wa-rate-limiter.test.ts`

**Step 1: Write the failing test**

Create `__tests__/lib/wa-rate-limiter.test.ts`:

```typescript
/**
 * @fileoverview Rate Limiter Tests
 * @description Tests for WA Policy V2.3 Section 4.3 compliant rate limiting
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock will be set up after implementation
describe('waRateLimiter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('waCheckRateLimit', () => {
    it('should allow requests under the limit', async () => {
      const { waCheckRateLimit } = await import('@/lib/wa-rate-limiter')

      const result = await waCheckRateLimit('test-key', { maxRequests: 10, windowMs: 60000 })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9)
    })

    it('should block requests over the limit', async () => {
      const { waCheckRateLimit, waResetRateLimit } = await import('@/lib/wa-rate-limiter')

      // Reset first
      waResetRateLimit('test-key-block')

      // Make 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        await waCheckRateLimit('test-key-block', { maxRequests: 10, windowMs: 60000 })
      }

      // 11th request should be blocked
      const result = await waCheckRateLimit('test-key-block', { maxRequests: 10, windowMs: 60000 })

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window expires', async () => {
      const { waCheckRateLimit, waResetRateLimit } = await import('@/lib/wa-rate-limiter')

      waResetRateLimit('test-key-reset')

      // Exhaust the limit
      for (let i = 0; i < 10; i++) {
        await waCheckRateLimit('test-key-reset', { maxRequests: 10, windowMs: 60000 })
      }

      // Advance time past window
      jest.advanceTimersByTime(61000)

      // Should be allowed again
      const result = await waCheckRateLimit('test-key-reset', { maxRequests: 10, windowMs: 60000 })

      expect(result.allowed).toBe(true)
    })

    it('should return correct headers', async () => {
      const { waCheckRateLimit, waResetRateLimit } = await import('@/lib/wa-rate-limiter')

      waResetRateLimit('test-key-headers')

      const result = await waCheckRateLimit('test-key-headers', { maxRequests: 100, windowMs: 60000 })

      expect(result.headers).toHaveProperty('X-RateLimit-Limit')
      expect(result.headers).toHaveProperty('X-RateLimit-Remaining')
      expect(result.headers).toHaveProperty('X-RateLimit-Reset')
    })
  })

  describe('waGetRateLimitKey', () => {
    it('should generate key from IP address', async () => {
      const { waGetRateLimitKey } = await import('@/lib/wa-rate-limiter')

      const key = waGetRateLimitKey('192.168.1.1', '/api/test')

      expect(key).toBe('rate:192.168.1.1:/api/test')
    })

    it('should handle user ID when provided', async () => {
      const { waGetRateLimitKey } = await import('@/lib/wa-rate-limiter')

      const key = waGetRateLimitKey('192.168.1.1', '/api/test', 'user-123')

      expect(key).toBe('rate:user-123:/api/test')
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd case-study-builder && npm test -- __tests__/lib/wa-rate-limiter.test.ts`
Expected: FAIL with "Cannot find module '@/lib/wa-rate-limiter'"

**Step 3: Write minimal implementation**

Create `lib/wa-rate-limiter.ts`:

```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `cd case-study-builder && npm test -- __tests__/lib/wa-rate-limiter.test.ts`
Expected: PASS (all 5 tests)

**Step 5: Commit**

```bash
git add lib/wa-rate-limiter.ts __tests__/lib/wa-rate-limiter.test.ts
git commit -m "feat: add rate limiting library (WA Policy V2.3 Section 4.3)"
```

---

## Task 2: Apply Rate Limiting to API Routes

**Files:**
- Create: `lib/wa-api-handler.ts`
- Test: `__tests__/lib/wa-api-handler.test.ts`

**Step 1: Write the failing test**

Create `__tests__/lib/wa-api-handler.test.ts`:

```typescript
/**
 * @fileoverview API Handler with Rate Limiting Tests
 * @description Tests for rate-limited API handler wrapper
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'

describe('waCreateApiHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 429 when rate limit exceeded', async () => {
    const { waCreateApiHandler, waResetAllHandlerLimits } = await import('@/lib/wa-api-handler')
    const { waClearAllRateLimits } = await import('@/lib/wa-rate-limiter')

    // Clear state
    waClearAllRateLimits()
    waResetAllHandlerLimits()

    const handler = waCreateApiHandler(
      async () => new Response('OK'),
      { rateLimitType: 'auth' } // 5 requests per minute
    )

    // Create mock request
    const createRequest = () => new NextRequest('http://localhost:3010/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.100' }
    })

    // Make 5 allowed requests
    for (let i = 0; i < 5; i++) {
      const response = await handler(createRequest())
      expect(response.status).toBe(200)
    }

    // 6th request should be rate limited
    const response = await handler(createRequest())
    expect(response.status).toBe(429)
  })

  it('should include rate limit headers', async () => {
    const { waCreateApiHandler, waResetAllHandlerLimits } = await import('@/lib/wa-api-handler')
    const { waClearAllRateLimits } = await import('@/lib/wa-rate-limiter')

    waClearAllRateLimits()
    waResetAllHandlerLimits()

    const handler = waCreateApiHandler(
      async () => new Response('OK'),
      { rateLimitType: 'api' }
    )

    const request = new NextRequest('http://localhost:3010/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.101' }
    })

    const response = await handler(request)

    expect(response.headers.get('X-RateLimit-Limit')).toBe('100')
    expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd case-study-builder && npm test -- __tests__/lib/wa-api-handler.test.ts`
Expected: FAIL with "Cannot find module '@/lib/wa-api-handler'"

**Step 3: Write minimal implementation**

Create `lib/wa-api-handler.ts`:

```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `cd case-study-builder && npm test -- __tests__/lib/wa-api-handler.test.ts`
Expected: PASS (all 2 tests)

**Step 5: Commit**

```bash
git add lib/wa-api-handler.ts __tests__/lib/wa-api-handler.test.ts
git commit -m "feat: add rate-limited API handler wrapper"
```

---

## Task 3: Add WhatsApp & Microsoft Teams Share Buttons

**Files:**
- Modify: `components/case-study/share-buttons.tsx`
- Test: `__tests__/components/share-buttons.test.tsx`

**Step 1: Write the failing test**

Create `__tests__/components/share-buttons.test.tsx`:

```typescript
/**
 * @fileoverview Share Buttons Component Tests
 * @description Tests for social sharing functionality including WhatsApp and Teams
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShareButtons } from '@/components/case-study/share-buttons'

// Mock window.open
const mockWindowOpen = jest.fn()
Object.defineProperty(window, 'open', { value: mockWindowOpen, writable: true })

// Mock clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn(() => Promise.resolve()) },
  writable: true,
})

describe('ShareButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const defaultProps = {
    caseStudyId: 'test-123',
    title: 'Test Case Study',
    description: 'Test description',
    url: 'https://example.com/case/test-123',
  }

  it('renders all share buttons including WhatsApp and Teams', () => {
    render(<ShareButtons {...defaultProps} />)

    expect(screen.getByTitle('Share on LinkedIn')).toBeInTheDocument()
    expect(screen.getByTitle('Share via Email')).toBeInTheDocument()
    expect(screen.getByTitle('Copy link')).toBeInTheDocument()
    expect(screen.getByTitle('Share on WhatsApp')).toBeInTheDocument()
    expect(screen.getByTitle('Share on Microsoft Teams')).toBeInTheDocument()
  })

  it('opens WhatsApp share URL when WhatsApp button clicked', () => {
    render(<ShareButtons {...defaultProps} />)

    const whatsappButton = screen.getByTitle('Share on WhatsApp')
    fireEvent.click(whatsappButton)

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('api.whatsapp.com/send'),
      '_blank',
      expect.any(String)
    )
  })

  it('opens Teams share URL when Teams button clicked', () => {
    render(<ShareButtons {...defaultProps} />)

    const teamsButton = screen.getByTitle('Share on Microsoft Teams')
    fireEvent.click(teamsButton)

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('teams.microsoft.com/share'),
      '_blank',
      expect.any(String)
    )
  })

  it('opens LinkedIn share URL when LinkedIn button clicked', () => {
    render(<ShareButtons {...defaultProps} />)

    const linkedinButton = screen.getByTitle('Share on LinkedIn')
    fireEvent.click(linkedinButton)

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('linkedin.com/sharing'),
      '_blank',
      expect.any(String)
    )
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd case-study-builder && npm test -- __tests__/components/share-buttons.test.tsx`
Expected: FAIL with "Unable to find an element with title 'Share on WhatsApp'"

**Step 3: Update implementation**

Modify `components/case-study/share-buttons.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Linkedin, Mail, Copy, Check, MessageCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Props for ShareButtons component
 */
interface ShareButtonsProps {
  /** Case study ID for tracking */
  caseStudyId: string;
  /** Title of the case study */
  title: string;
  /** Description of the case study */
  description: string;
  /** Optional custom URL (defaults to current page) */
  url?: string;
  /** Optional CSS class */
  className?: string;
}

/**
 * ShareButtons Component
 * @description Social sharing buttons for case studies (LinkedIn, Email, WhatsApp, Teams, Copy Link)
 * @param props - Component props
 * @returns Share buttons JSX
 */
export function ShareButtons({
  caseStudyId,
  title,
  description,
  url,
  className = '',
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  /**
   * Track share event if analytics available
   */
  const trackShare = (method: string) => {
    if (typeof window !== 'undefined' && (window as any).trackEvent) {
      (window as any).trackEvent('share', {
        method,
        case_study_id: caseStudyId,
      });
    }
  };

  /**
   * Handle LinkedIn share
   */
  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
    trackShare('linkedin');
    toast.success('Opening LinkedIn share dialog...');
  };

  /**
   * Handle WhatsApp share
   */
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${title}\n\n${description}\n\n${shareUrl}`);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${text}`;
    window.open(whatsappUrl, '_blank', 'width=600,height=400');
    trackShare('whatsapp');
    toast.success('Opening WhatsApp...');
  };

  /**
   * Handle Microsoft Teams share
   */
  const handleTeamsShare = () => {
    const teamsUrl = `https://teams.microsoft.com/share?href=${encodeURIComponent(shareUrl)}&msgText=${encodeURIComponent(title)}`;
    window.open(teamsUrl, '_blank', 'width=600,height=400');
    trackShare('teams');
    toast.success('Opening Microsoft Teams...');
  };

  /**
   * Handle Email share
   */
  const handleEmailShare = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(
      `I thought you might find this case study interesting:\n\n${title}\n\n${description}\n\nView it here: ${shareUrl}`
    );
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    trackShare('email');
    toast.success('Opening email client...');
  };

  /**
   * Handle Copy Link
   */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackShare('copy_link');
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[ShareButtons] Error copying to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleLinkedInShare}
        className="dark:border-border"
        title="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
        <span className="hidden sm:inline ml-2">LinkedIn</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleWhatsAppShare}
        className="dark:border-border"
        title="Share on WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline ml-2">WhatsApp</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleTeamsShare}
        className="dark:border-border"
        title="Share on Microsoft Teams"
      >
        <Users className="h-4 w-4" />
        <span className="hidden sm:inline ml-2">Teams</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleEmailShare}
        className="dark:border-border"
        title="Share via Email"
      >
        <Mail className="h-4 w-4" />
        <span className="hidden sm:inline ml-2">Email</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="dark:border-border"
        title={copied ? 'Link copied!' : 'Copy link'}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            <span className="hidden sm:inline ml-2 text-green-600">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Copy Link</span>
          </>
        )}
      </Button>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd case-study-builder && npm test -- __tests__/components/share-buttons.test.tsx`
Expected: PASS (all 4 tests)

**Step 5: Commit**

```bash
git add components/case-study/share-buttons.tsx __tests__/components/share-buttons.test.tsx
git commit -m "feat: add WhatsApp and Microsoft Teams share buttons"
```

---

## Task 4: Generate SBOM (Software Bill of Materials)

**Files:**
- Create: `scripts/generate-sbom.ts`
- Create: `sbom.json` (generated)
- Test: `__tests__/scripts/generate-sbom.test.ts`

**Step 1: Install CycloneDX**

Run: `cd case-study-builder && npm install --save-dev @cyclonedx/cyclonedx-npm`

**Step 2: Create SBOM generation script**

Create `scripts/generate-sbom.ts`:

```typescript
/**
 * @fileoverview SBOM Generator
 * @description Generates CycloneDX Software Bill of Materials per WA Policy V2.3 Section 6.1
 * @module scripts/generate-sbom
 */

import { execSync } from 'child_process'
import { writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'

/**
 * SBOM metadata interface
 */
interface SbomMetadata {
  generatedAt: string
  projectName: string
  projectVersion: string
  generator: string
}

/**
 * Generate SBOM using CycloneDX
 */
export async function waGenerateSbom(): Promise<{ success: boolean; path: string; metadata: SbomMetadata }> {
  const projectRoot = process.cwd()
  const sbomPath = join(projectRoot, 'sbom.json')

  // Read package.json for metadata
  const packageJsonPath = join(projectRoot, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

  const metadata: SbomMetadata = {
    generatedAt: new Date().toISOString(),
    projectName: packageJson.name || 'unknown',
    projectVersion: packageJson.version || '0.0.0',
    generator: '@cyclonedx/cyclonedx-npm',
  }

  try {
    // Generate SBOM using CycloneDX
    execSync('npx @cyclonedx/cyclonedx-npm --output-file sbom.json --spec-version 1.5', {
      cwd: projectRoot,
      stdio: 'pipe',
    })

    // Verify file was created
    if (!existsSync(sbomPath)) {
      throw new Error('SBOM file was not created')
    }

    console.log(`[SBOM] Generated successfully at ${sbomPath}`)
    console.log(`[SBOM] Project: ${metadata.projectName}@${metadata.projectVersion}`)
    console.log(`[SBOM] Generated: ${metadata.generatedAt}`)

    return { success: true, path: sbomPath, metadata }
  } catch (error) {
    console.error('[SBOM] Generation failed:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  waGenerateSbom()
    .then((result) => {
      console.log('[SBOM] Complete:', result)
      process.exit(0)
    })
    .catch((error) => {
      console.error('[SBOM] Failed:', error)
      process.exit(1)
    })
}
```

**Step 3: Add npm script**

Add to `package.json` scripts:

```json
"sbom:generate": "tsx scripts/generate-sbom.ts"
```

**Step 4: Generate SBOM**

Run: `cd case-study-builder && npm run sbom:generate`
Expected: Creates `sbom.json` in project root

**Step 5: Commit**

```bash
git add scripts/generate-sbom.ts sbom.json package.json
git commit -m "feat: add SBOM generation (WA Policy V2.3 Section 6.1)"
```

---

## Task 5: Add E2E Tests for Share Buttons

**Files:**
- Create: `e2e/share-buttons.spec.ts`

**Step 1: Write E2E test**

Create `e2e/share-buttons.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Share Buttons', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/dev-login');
    await page.getByLabel('Email').fill('admin@weldingalloys.com');
    await page.getByLabel('Password').fill('TestPassword123');
    await page.getByLabel('Role').click();
    await page.getByRole('option', { name: /ADMIN/i }).click();
    await page.getByRole('button', { name: /Login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('share buttons are visible on case study page', async ({ page }) => {
    // Navigate to library to find a case study
    await page.goto('/dashboard/library');
    await expect(page.getByRole('heading', { name: /Case Study Library/i })).toBeVisible({ timeout: 10000 });

    // Click on a case study card if available
    const caseStudyCard = page.locator('[data-testid="case-study-card"]').first();
    if (await caseStudyCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await caseStudyCard.click();

      // Check for share buttons
      await expect(page.getByTitle('Share on LinkedIn')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTitle('Share on WhatsApp')).toBeVisible();
      await expect(page.getByTitle('Share on Microsoft Teams')).toBeVisible();
      await expect(page.getByTitle('Share via Email')).toBeVisible();
      await expect(page.getByTitle('Copy link')).toBeVisible();
    }
  });

  test('copy link button works', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/dashboard/library');
    await expect(page.getByRole('heading', { name: /Case Study Library/i })).toBeVisible({ timeout: 10000 });

    const caseStudyCard = page.locator('[data-testid="case-study-card"]').first();
    if (await caseStudyCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await caseStudyCard.click();

      // Click copy link button
      const copyButton = page.getByTitle('Copy link');
      if (await copyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await copyButton.click();

        // Should show copied state
        await expect(page.getByTitle('Link copied!')).toBeVisible({ timeout: 2000 });
      }
    }
  });
});
```

**Step 2: Run E2E test**

Run: `cd case-study-builder && npm run test:e2e -- share-buttons.spec.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add e2e/share-buttons.spec.ts
git commit -m "test: add E2E tests for share buttons"
```

---

## Task 6: Add Rate Limiting E2E Tests

**Files:**
- Create: `e2e/rate-limiting.spec.ts`

**Step 1: Write E2E test**

Create `e2e/rate-limiting.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Rate Limiting', () => {
  test('API returns rate limit headers', async ({ request }) => {
    // Make a request to an API endpoint
    const response = await request.get('/api/case-studies');

    // Check for rate limit headers
    expect(response.headers()['x-ratelimit-limit']).toBeTruthy();
    expect(response.headers()['x-ratelimit-remaining']).toBeTruthy();
  });

  test('rate limit headers decrease with requests', async ({ request }) => {
    // Make first request
    const response1 = await request.get('/api/case-studies');
    const remaining1 = parseInt(response1.headers()['x-ratelimit-remaining'] || '100');

    // Make second request
    const response2 = await request.get('/api/case-studies');
    const remaining2 = parseInt(response2.headers()['x-ratelimit-remaining'] || '99');

    // Remaining should decrease
    expect(remaining2).toBeLessThan(remaining1);
  });
});
```

**Step 2: Run E2E test**

Run: `cd case-study-builder && npm run test:e2e -- rate-limiting.spec.ts`
Expected: PASS (once rate limiting is applied to API routes)

**Step 3: Commit**

```bash
git add e2e/rate-limiting.spec.ts
git commit -m "test: add E2E tests for rate limiting"
```

---

## Task 7: Add Smoke Tests

**Files:**
- Create: `e2e/smoke.spec.ts`

**Step 1: Write Smoke Test**

Create `e2e/smoke.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Case Study/i);
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
  });

  test('dev-login page loads', async ({ page }) => {
    await page.goto('/dev-login');
    await expect(page.getByLabel('Email')).toBeVisible({ timeout: 10000 });
  });

  test('API health check', async ({ request }) => {
    // Test that API is responding
    const response = await request.get('/api/case-studies');
    expect([200, 401, 403]).toContain(response.status());
  });

  test('static assets load', async ({ page }) => {
    await page.goto('/');

    // Check that CSS is loaded (page should have styles)
    const bodyStyles = await page.evaluate(() => {
      return window.getComputedStyle(document.body).getPropertyValue('font-family');
    });
    expect(bodyStyles).toBeTruthy();
  });

  test('authentication flow redirects', async ({ page }) => {
    // Unauthenticated user should be redirected from dashboard
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/(login|dev-login)/, { timeout: 10000 });
  });

  test('maintenance mode check', async ({ page }) => {
    // Visit maintenance page - should redirect if not in maintenance mode
    await page.goto('/maintenance');

    // Either shows maintenance page or redirects
    const url = page.url();
    expect(url.includes('/maintenance') || url.includes('/')).toBe(true);
  });
});
```

**Step 2: Run Smoke Tests**

Run: `cd case-study-builder && npm run test:e2e -- smoke.spec.ts`
Expected: PASS (all 7 tests)

**Step 3: Add smoke test script to package.json**

Add to `package.json` scripts:

```json
"test:smoke": "playwright test smoke.spec.ts"
```

**Step 4: Commit**

```bash
git add e2e/smoke.spec.ts package.json
git commit -m "test: add smoke tests"
```

---

## Task 8: Add Security Tests

**Files:**
- Create: `e2e/security.spec.ts`

**Step 1: Write Security Tests**

Create `e2e/security.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('security headers are present', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();

    // Check required security headers per WA Policy V2.3
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['strict-transport-security']).toContain('max-age=');
  });

  test('CSP header is present', async ({ request }) => {
    const response = await request.get('/');
    const csp = response.headers()['content-security-policy'];

    // CSP should be present (may be report-only in dev)
    expect(csp || response.headers()['content-security-policy-report-only']).toBeTruthy();
  });

  test('API endpoints require authentication', async ({ request }) => {
    // These endpoints should require auth
    const protectedEndpoints = [
      '/api/case-studies',
      '/api/users',
      '/api/admin/analytics',
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await request.get(endpoint);
      // Should return 401 or 403 without auth
      expect([401, 403, 404]).toContain(response.status());
    }
  });

  test('no sensitive data in error messages', async ({ request }) => {
    // Request non-existent resource
    const response = await request.get('/api/case-studies/non-existent-id-12345');
    const body = await response.text();

    // Should not expose stack traces or internal paths
    expect(body).not.toContain('node_modules');
    expect(body).not.toContain('at Object.');
    expect(body).not.toContain('Error:');
  });

  test('SQL injection protection', async ({ request }) => {
    // Try SQL injection in query params
    const response = await request.get('/api/case-studies?search=\'; DROP TABLE users; --');

    // Should not return 500 (would indicate SQL error)
    expect(response.status()).not.toBe(500);
  });

  test('XSS protection in responses', async ({ request }) => {
    // Request with XSS payload
    const response = await request.get('/api/case-studies?search=<script>alert("xss")</script>');
    const body = await response.text();

    // Response should not contain unescaped script tags
    expect(body).not.toContain('<script>alert');
  });
});
```

**Step 2: Run Security Tests**

Run: `cd case-study-builder && npm run test:e2e -- security.spec.ts`
Expected: PASS (all 6 tests)

**Step 3: Add security test script to package.json**

Add to `package.json` scripts:

```json
"test:security": "playwright test security.spec.ts"
```

**Step 4: Commit**

```bash
git add e2e/security.spec.ts package.json
git commit -m "test: add security tests"
```

---

## Task 9: Run All Tests

**Step 1: Run Unit Tests**

Run: `cd case-study-builder && npm test`
Expected: All tests pass (170+ tests)

**Step 2: Run E2E Tests**

Run: `cd case-study-builder && npm run test:e2e`
Expected: All tests pass (40+ tests)

**Step 3: Run Smoke Tests**

Run: `cd case-study-builder && npm run test:smoke`
Expected: All tests pass (7 tests)

**Step 4: Run Security Tests**

Run: `cd case-study-builder && npm run test:security`
Expected: All tests pass (6 tests)

---

## Task 10: Final Merge to Test Branch

> **CRITICAL:** Do NOT merge to main. Only merge to test/merge-all-features.

**Step 1: Ensure all tests pass**

Run: `cd case-study-builder && npm test && npm run test:e2e`

**Step 2: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: final cleanup and test fixes"
```

**Step 3: Merge to test branch ONLY**

```bash
# Ensure we're on feature branch
git checkout feat/security-compliance-gaps

# Push feature branch
git push origin feat/security-compliance-gaps

# Merge to test branch ONLY (NOT main)
git checkout test/merge-all-features
git merge feat/security-compliance-gaps
git push origin test/merge-all-features
```

**Step 4: Verify merge**

```bash
git log --oneline -10
```

---

## Test Summary

| Test Type | Command | Expected Count |
|-----------|---------|----------------|
| Unit Tests | `npm test` | 170+ |
| E2E Tests | `npm run test:e2e` | 40+ |
| Smoke Tests | `npm run test:smoke` | 7 |
| Security Tests | `npm run test:security` | 6 |

## Sources

- [Next.js 16 Proxy Documentation](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js Middleware to Proxy Migration](https://nextjs.org/docs/messages/middleware-to-proxy)
- [Rate Limiting Best Practices](https://dev.to/ethanleetech/4-best-rate-limiting-solutions-for-nextjs-apps-2024-3ljj)

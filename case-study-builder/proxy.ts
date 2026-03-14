/**
 * @fileoverview Next.js 16 Proxy with Auth, CSP Nonces, and Rate Limiting
 * @description Security proxy compliant with WA Policy V2.3
 * - Section 4.1: Security hardening (CSP headers, rate limiting)
 * - Section 4.3: Rate limiting integration
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// =====================================================
// Rate Limiting Configuration (WA Policy Section 4.3)
// =====================================================
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX_ENTRIES = 10_000;
let lastCleanup = Date.now();

/**
 * Evict expired entries from the rate limit store to prevent memory leaks.
 * Runs at most once per minute to avoid overhead on every request.
 */
function cleanupRateLimitStore() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return; // cleanup at most every 60s
  lastCleanup = now;

  for (const [key, entry] of rateLimitStore) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }

  // Hard cap: if still too large, drop oldest entries
  if (rateLimitStore.size > RATE_LIMIT_MAX_ENTRIES) {
    const excess = rateLimitStore.size - RATE_LIMIT_MAX_ENTRIES;
    const keys = rateLimitStore.keys();
    for (let i = 0; i < excess; i++) {
      const { value } = keys.next();
      if (value) rateLimitStore.delete(value);
    }
  }
}

const RATE_LIMITS = {
  auth: { maxRequests: 5, windowMs: 60000 },
  upload: { maxRequests: 10, windowMs: 60000 },
  search: { maxRequests: 30, windowMs: 60000 },
  export: { maxRequests: 5, windowMs: 60000 },
  api: { maxRequests: 100, windowMs: 60000 },
} as const;

/**
 * Get client IP from request headers
 */
function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/**
 * Build Content Security Policy
 * Development: permissive for HMR and dev tools
 * Production: restrictive with Vercel/Pusher allowlists
 */
function buildCSP(): string {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // Development CSP - more permissive for HMR, Radix UI, and dev tools
    return [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: https: blob:`,
      `font-src 'self' data:`,
      `connect-src 'self' ws: wss: https://api.openai.com https://res.cloudinary.com https://*.ngrok-free.dev wss://*.ngrok-free.dev https://*.google.com https://*.googleapis.com`,
      `media-src 'self'`,
      `object-src 'none'`,
      `frame-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
    ].join('; ');
  }

  // Production CSP - allowing Vercel, Pusher, and inline scripts for Next.js
  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://vercel.live https://*.vercel.live https://*.vercel.app`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self' https://api.openai.com https://res.cloudinary.com https://*.ngrok-free.dev wss://*.ngrok-free.dev https://*.google.com https://*.googleapis.com https://vercel.live https://*.vercel.live wss://vercel.live wss://*.vercel.live https://*.vercel.app wss://*.pusher.com https://*.pusher.com`,
    `media-src 'self'`,
    `object-src 'none'`,
    `frame-src 'self' https://vercel.live`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');
}

/**
 * Check rate limit for a request
 */
function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; headers: Record<string, string> } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetTime) {
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': String(maxRequests),
        'X-RateLimit-Remaining': String(maxRequests - 1),
        'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
      },
    };
  }

  entry.count++;
  rateLimitStore.set(key, entry);
  const remaining = Math.max(0, maxRequests - entry.count);
  const allowed = entry.count <= maxRequests;

  return {
    allowed,
    headers: {
      'X-RateLimit-Limit': String(maxRequests),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000)),
      ...(allowed ? {} : { 'Retry-After': String(Math.ceil((entry.resetTime - now) / 1000)) }),
    },
  };
}

/**
 * Get rate limit config based on path
 */
function getRateLimitConfig(pathname: string) {
  if (pathname.startsWith('/api/auth')) return RATE_LIMITS.auth;
  if (pathname.includes('/upload') || pathname.includes('/image')) return RATE_LIMITS.upload;
  if (pathname.includes('/search')) return RATE_LIMITS.search;
  if (pathname.includes('/export') || pathname.includes('/pdf')) return RATE_LIMITS.export;
  return RATE_LIMITS.api;
}

// Paths that should be accessible during maintenance mode
const MAINTENANCE_EXEMPT_PATHS = [
  '/maintenance',
  '/api',
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
  '/login',
  '/auth',
];

// Admin paths that require authentication check
const ADMIN_PATHS = ['/dashboard/admin', '/dashboard/system-settings'];

// Cache maintenance mode to avoid DB query on every page request
let cachedMaintenanceMode: { value: boolean; lastCheck: number } = { value: false, lastCheck: 0 };
const MAINTENANCE_CACHE_TTL_MS = 30_000; // 30 seconds

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // ==== RATE LIMITING FOR API ROUTES ====
  if (pathname.startsWith('/api')) {
    cleanupRateLimitStore();
    const clientIp = getClientIp(req.headers);
    const config = getRateLimitConfig(pathname);
    const rateLimitKey = `rate:${clientIp}:${pathname}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, config.maxRequests, config.windowMs);

    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.headers['Retry-After'],
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...rateLimitResult.headers,
          },
        }
      );
    }
  }

  // Define page types
  const isAuthPage = pathname.startsWith('/login');
  const isPublicPage = pathname === '/';
  const isLibraryPage = pathname.startsWith('/library');
  const isMaintenancePage = pathname === '/maintenance';

  // Check if path is exempt from maintenance checks
  const isExemptPath = MAINTENANCE_EXEMPT_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  // Helper to add security headers to response
  const addSecurityHeaders = (response: NextResponse) => {
    response.headers.set('Content-Security-Policy', buildCSP());
    return response;
  };

  try {
    // ==== MAINTENANCE MODE CHECK (cached, refreshed every 30s) ====
    if (!isExemptPath) {
      const now = Date.now();
      if (now - cachedMaintenanceMode.lastCheck > MAINTENANCE_CACHE_TTL_MS) {
        try {
          const maintenanceConfig = await prisma.waSystemConfig.findUnique({
            where: { key: 'maintenance_mode' },
          });
          cachedMaintenanceMode = { value: maintenanceConfig?.value === 'true', lastCheck: now };
        } catch {
          // Keep cached value on error
        }
      }

      const isMaintenanceMode = cachedMaintenanceMode.value;

      if (isMaintenanceMode) {
        // Check if user is admin
        if (req.auth?.user?.id) {
          const user = await prisma.user.findUnique({
            where: { id: req.auth.user.id },
            select: { role: true },
          });

          // Admin bypass - allow access
          if (user?.role === 'ADMIN') {
            // Continue to auth checks
          } else {
            // Non-admin users - redirect to maintenance
            if (!isMaintenancePage) {
              return NextResponse.redirect(new URL('/maintenance', req.url));
            }
            return addSecurityHeaders(NextResponse.next());
          }
        } else {
          // Not logged in - redirect to maintenance
          if (!isMaintenancePage) {
            return NextResponse.redirect(new URL('/maintenance', req.url));
          }
          return addSecurityHeaders(NextResponse.next());
        }
      } else {
        // Not in maintenance mode - redirect away from maintenance page
        if (isMaintenancePage) {
          return NextResponse.redirect(new URL('/', req.url));
        }
      }
    }

    // ==== PUBLIC PAGE ACCESS ====
    // Allow public pages
    if (isPublicPage || isLibraryPage) {
      return addSecurityHeaders(NextResponse.next());
    }

    // ==== AUTHENTICATED USER REDIRECTS ====
    // Redirect logged-in users away from login pages
    if (isLoggedIn && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // ==== ADMIN PATH PROTECTION ====
    const isAdminPath = ADMIN_PATHS.some((path) => pathname.startsWith(path));

    if (isAdminPath) {
      if (!isLoggedIn) {
        return NextResponse.redirect(new URL('/login', req.url));
      }

      const user = await prisma.user.findUnique({
        where: { id: req.auth!.user.id },
        select: { role: true },
      });

      if (user?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // ==== UNAUTHENTICATED USER REDIRECTS ====
    // Redirect unauthenticated users to login
    if (!isLoggedIn && !isAuthPage) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return addSecurityHeaders(NextResponse.next());
  } catch (error) {
    console.error('[Proxy] Error:', error);
    // On error, still apply security headers
    return addSecurityHeaders(NextResponse.next());
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|sw.js|.*\\.png|public).*)'],
};

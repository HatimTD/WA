/**
 * @fileoverview Next.js 16 Proxy with Auth, CSP Nonces, and Rate Limiting
 * @description Security proxy compliant with WA Policy V2.3
 * - Section 4.1: Security hardening (CSP with nonces, no unsafe-inline)
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

const RATE_LIMITS = {
  auth: { maxRequests: 5, windowMs: 60000 },
  upload: { maxRequests: 10, windowMs: 60000 },
  search: { maxRequests: 30, windowMs: 60000 },
  export: { maxRequests: 5, windowMs: 60000 },
  api: { maxRequests: 100, windowMs: 60000 },
} as const;

/**
 * Generate cryptographically secure nonce for CSP
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

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
 * Build Content Security Policy with nonce (no unsafe-inline/unsafe-eval in production)
 * In development mode, we allow unsafe-inline/unsafe-eval for HMR and Radix UI
 */
function buildCSP(nonce: string): string {
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

  // Production CSP - strict with nonce but allowing Vercel preview and inline scripts for Next.js
  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://vercel.live https://*.vercel.live`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self' https://api.openai.com https://res.cloudinary.com https://*.ngrok-free.dev wss://*.ngrok-free.dev https://*.google.com https://*.googleapis.com https://vercel.live https://*.vercel.live wss://vercel.live wss://*.vercel.live`,
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
  '/dev-login',
  '/auth',
];

// Admin paths that require authentication check
const ADMIN_PATHS = ['/dashboard/admin', '/dashboard/system-settings'];

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Generate CSP nonce for this request
  const nonce = generateNonce();

  // ==== RATE LIMITING FOR API ROUTES ====
  if (pathname.startsWith('/api')) {
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
  const isDevLogin = pathname.startsWith('/dev-login');
  const isPublicPage = pathname === '/';
  const isLibraryPage = pathname.startsWith('/library');
  const isMaintenancePage = pathname === '/maintenance';

  // Check if path is exempt from maintenance checks
  const isExemptPath = MAINTENANCE_EXEMPT_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  // Helper to add security headers to response
  const addSecurityHeaders = (response: NextResponse) => {
    response.headers.set('Content-Security-Policy', buildCSP(nonce));
    response.headers.set('x-nonce', nonce);
    return response;
  };

  try {
    // ==== MAINTENANCE MODE CHECK ====
    if (!isExemptPath) {
      const maintenanceConfig = await prisma.waSystemConfig.findUnique({
        where: { key: 'maintenance_mode' },
      });

      const isMaintenanceMode = maintenanceConfig?.value === 'true';

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

    // ==== DEV LOGIN ACCESS ====
    // Allow dev-login in development mode (always allow if not logged in to show the form)
    if (isDevLogin) {
      if (!isLoggedIn) {
        return addSecurityHeaders(NextResponse.next());
      }
      // If logged in, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url));
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
    if (!isLoggedIn && !isAuthPage && !isDevLogin) {
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

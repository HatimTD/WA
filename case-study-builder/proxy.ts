import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

  try {
    // ==== MAINTENANCE MODE CHECK ====
    if (!isExemptPath) {
      const maintenanceConfig = await prisma.systemConfig.findUnique({
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
            return NextResponse.next();
          }
        } else {
          // Not logged in - redirect to maintenance
          if (!isMaintenancePage) {
            return NextResponse.redirect(new URL('/maintenance', req.url));
          }
          return NextResponse.next();
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
      return NextResponse.next();
    }

    // ==== DEV LOGIN ACCESS ====
    // Allow dev-login in development mode (always allow if not logged in to show the form)
    if (isDevLogin) {
      if (!isLoggedIn) {
        return NextResponse.next();
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

    return NextResponse.next();
  } catch (error) {
    console.error('[Proxy] Error:', error);
    // On error, allow the request to continue to avoid breaking the app
    return NextResponse.next();
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|sw.js|.*\\.png|public).*)'],
};

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login');
  const isDevLogin = req.nextUrl.pathname.startsWith('/dev-login');
  const isPublicPage = req.nextUrl.pathname === '/';
  const isLibraryPage = req.nextUrl.pathname.startsWith('/library');

  // Allow public pages
  if (isPublicPage || isLibraryPage) {
    return NextResponse.next();
  }

  // Allow dev-login in development mode
  if (isDevLogin && process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Redirect logged-in users away from login pages
  if (isLoggedIn && (isAuthPage || isDevLogin)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isAuthPage && !isDevLogin) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};

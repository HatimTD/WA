import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isOnDevLogin = nextUrl.pathname.startsWith('/dev-login');
      const isOnBreakGlass = nextUrl.pathname.startsWith('/break-glass');

      // Allow dev-login, dev-register, and break-glass pages (WA Policy Section 3.1)
      if (isOnDevLogin || nextUrl.pathname.startsWith('/dev-register') || isOnBreakGlass) {
        return true;
      }

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn && isOnLogin) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;

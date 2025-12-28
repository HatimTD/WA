import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  // Disable in development, enable in production
  disable: process.env.NODE_ENV !== 'production',
  reloadOnOnline: true,
  cacheOnNavigation: true,
  additionalPrecacheEntries: ['/dev-login'],
});

const nextConfig: NextConfig = {
  // Use webpack for builds to support Serwist (Turbopack for dev only)
  // turbopack: {}, // Disabled - Serwist requires webpack for SW generation
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Security headers for production
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=()',
          },
          // CSP is now handled by proxy.ts with dynamic nonces (WA Policy 4.1 compliant)
          // This removes the need for unsafe-inline/unsafe-eval
        ],
      },
    ];
  },
};

// Apply Serwist wrapper (handles service worker generation)
// Note: Sentry is disabled to avoid build complexity - enable if needed
export default withSerwist(nextConfig);

import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';
import { withSentryConfig } from '@sentry/nextjs';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  // Disable in development, enable in production
  disable: process.env.NODE_ENV !== 'production',
  reloadOnOnline: true,
  cacheOnNavigation: true,
  additionalPrecacheEntries: ['/login'],
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
      // Application ceiling for uploads (PDF/image/video) is 1 GB, enforced in
      // lib/file-validation.ts. NOTE: on Vercel the serverless platform caps the
      // request body well below this (~4.5 MB), so genuinely large files/videos
      // must be uploaded directly to Cloudinary (signed upload) - tracked as a
      // separate follow-up. This limit governs dev/self-hosted.
      bodySizeLimit: '1024mb',
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

// Sentry webpack plugin options — source maps upload only runs when
// SENTRY_AUTH_TOKEN is set during build. The runtime init is in
// sentry.{client,server,edge}.config.ts and instrumentation.ts.
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
};

// Apply Serwist wrapper first (service worker), then Sentry wrapper
export default withSentryConfig(withSerwist(nextConfig), sentryWebpackPluginOptions);

import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

// Only import Sentry when configured to avoid rollup dependency issues
const isSentryConfigured = !!(process.env.SENTRY_ORG && process.env.SENTRY_PROJECT);

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
  // Enable Turbopack (Next.js 16 default)
  turbopack: {},
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
            value: 'camera=(self), microphone=(self), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https: blob:;
              font-src 'self' data:;
              connect-src 'self' https://api.openai.com https://res.cloudinary.com https://*.ngrok-free.dev wss://*.ngrok-free.dev https://*.google.com https://*.googleapis.com;
              media-src 'self';
              object-src 'none';
              frame-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
              upgrade-insecure-requests;
            `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

// Conditionally wrap with Sentry only when configured (avoids rollup dependency issues)
// Then wrap with Serwist
async function getConfig() {
  let config = nextConfig;

  if (isSentryConfigured) {
    const { withSentryConfig } = await import('@sentry/nextjs');
    config = withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      tunnelRoute: "/monitoring",
      sourcemaps: { disable: true },
      disableLogger: true,
      automaticVercelMonitors: true,
    });
  }

  return withSerwist(config);
}

export default getConfig();

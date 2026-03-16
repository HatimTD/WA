import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Industrial Challenges App | Welding Alloys',
    short_name: 'ICA',
    description: 'Capture, manage, and share industrial welding challenges and solutions',
    start_url: '/?source=pwa',
    display: 'standalone',
    display_override: ['standalone', 'fullscreen'],
    background_color: '#111827', // Dark background for seamless dark mode
    theme_color: '#006838', // Welding Alloys green
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['productivity', 'business', 'utilities'],
    lang: 'en',
    dir: 'ltr',
    prefer_related_applications: false,
    shortcuts: [
      {
        name: 'New Challenge',
        short_name: 'New',
        description: 'Create a new industrial challenge',
        url: '/dashboard/new',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Library',
        short_name: 'Library',
        description: 'Browse challenges library',
        url: '/dashboard/library',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Search',
        short_name: 'Search',
        description: 'Search challenges',
        url: '/dashboard/search',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
    // Screenshots for app stores and install prompts
    // TODO: Create and add actual screenshot images to /public folder
    // Recommended: Capture screenshots of key features (Dashboard, New Case, Library, Analytics)
    screenshots: [
      {
        src: '/screenshots/mobile-dashboard.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Dashboard - Track your case studies and progress',
      },
      {
        src: '/screenshots/mobile-new-case.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Create New Case Study - Step-by-step guided process',
      },
      {
        src: '/screenshots/mobile-library.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Case Study Library - Browse and search all cases',
      },
      {
        src: '/screenshots/mobile-analytics.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Analytics - Visualize performance and trends',
      },
      {
        src: '/screenshots/desktop-dashboard.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Desktop Dashboard - Full-featured workspace',
      },
      {
        src: '/screenshots/desktop-library.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Desktop Library - Advanced search and filtering',
      },
    ],
  };
}

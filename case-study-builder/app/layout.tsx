import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import { OfflineIndicator } from '@/components/offline-indicator';
import { ServiceWorkerRegister } from '@/components/service-worker-register';
import { ThemeProvider } from '@/components/theme-provider';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { IOSPWAPrompt } from '@/components/ios-pwa-prompt';
import { StandaloneModeKeeper } from '@/components/standalone-mode-keeper';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  // Removed preload to avoid preload warnings
  // Next.js automatically handles font loading optimization
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#006838' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'Case Study Builder | Welding Alloys',
    template: '%s | Case Study Builder'
  },
  description: 'Capture, manage, and share industrial welding case studies and solutions. Track maintenance costs, productivity improvements, and collaborate with your team.',
  applicationName: 'Case Study Builder',
  authors: [{ name: 'Welding Alloys' }],
  keywords: ['case studies', 'welding', 'industrial', 'solutions', 'productivity', 'maintenance', 'cost tracking', 'collaboration', 'welding alloys', 'industrial maintenance'],
  creator: 'Welding Alloys',
  publisher: 'Welding Alloys',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://casestudy.weldingalloys.com'),
  openGraph: {
    title: 'Case Study Builder | Welding Alloys',
    description: 'Capture, manage, and share industrial welding case studies and solutions',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://casestudy.weldingalloys.com',
    siteName: 'Case Study Builder',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Case Study Builder | Welding Alloys',
    description: 'Capture, manage, and share industrial welding case studies and solutions',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CS Builder',
    startupImage: [
      {
        url: '/apple-touch-icon.png',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CS Builder" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <OfflineIndicator />
          <ServiceWorkerRegister />
          <StandaloneModeKeeper />
          <PWAInstallPrompt />
          <IOSPWAPrompt />
          {children}
          <Toaster richColors position="top-right" />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false, // Disable - we handle navigation ourselves
});

// Manually add install and activate listeners (NOT fetch - we handle that ourselves)
self.addEventListener('install', (event) => {
  event.waitUntil(serwist.handleInstall(event));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(serwist.handleActivate(event));
});

// Single fetch handler with proper API exclusion
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // CRITICAL: Never intercept API routes - especially OAuth callbacks
  // The OAuth callback returns 302 redirects that SW can't handle properly
  if (url.pathname.startsWith('/api/')) {
    return; // Let the browser handle it directly
  }

  // Only handle same-origin navigation requests
  if (request.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const networkResponse = await fetch(request);
          return networkResponse;
        } catch {
          // Network failed - try cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Return offline page
          const offlinePage = await caches.match('/offline');
          return offlinePage || new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      })()
    );
    return;
  }

  // For non-navigation requests (CSS, JS, images), delegate to Serwist
  // Note: handleFetch calls event.respondWith() internally
  // API routes already returned above so they never reach here
  serwist.handleFetch(event);
});

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'SYNC_NOW':
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'SYNC_TRIGGERED' });
          });
        });
        break;
    }
  }
});

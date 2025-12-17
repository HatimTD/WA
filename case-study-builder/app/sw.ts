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
  navigationPreload: true,
});

// Handle navigation requests properly to avoid preload warnings
serwist.addEventListeners();

// Add fetch event listener to properly handle navigation preload
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try to use the preload response if available
          const preloadResponse = event.preloadResponse;
          if (preloadResponse) {
            const response = await preloadResponse;
            if (response && response.ok) {
              return response;
            }
          }

          // Otherwise, try the network
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            return networkResponse;
          }

          // If network fails, try cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Return offline page if available
          return caches.match('/offline') || new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        } catch (error) {
          // Return cached response or offline page on error
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          return caches.match('/offline') || new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        }
      })()
    );
  }
});

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'SYNC_NOW':
        // Trigger sync when online - notify all clients
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'SYNC_TRIGGERED' });
          });
        });
        break;
    }
  }
});

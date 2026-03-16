'use client';

import { useEffect, useState } from 'react';

export function ServiceWorkerRegister() {
  const [swStatus, setSwStatus] = useState<'idle' | 'registering' | 'registered' | 'error'>('idle');

  useEffect(() => {
    // Only run in browser and in production
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Skip in development
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    const registerServiceWorker = async () => {
      setSwStatus('registering');

      try {
        // Check if sw.js exists before registering
        const swResponse = await fetch('/sw.js', { method: 'HEAD' });
        if (!swResponse.ok) {
          console.warn('[SW] Service Worker file not found, skipping registration');
          setSwStatus('error');
          return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        setSwStatus('registered');

        // Check for updates periodically (every 60 seconds)
        const updateInterval = setInterval(() => {
          registration.update().catch((err) => {
            console.warn('[SW] Update check failed:', err);
          });
        }, 60000);

        // Force immediate update on first load
        registration.update().catch(() => {});

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });

        // Cleanup on unmount
        return () => {
          clearInterval(updateInterval);
        };
      } catch (error) {
        console.error('[SW] Service Worker registration failed:', error);
        setSwStatus('error');
        // Don't throw - gracefully degrade without SW
      }
    };

    let cleanupSW: (() => void) | undefined;
    registerServiceWorker().then((cleanup) => {
      cleanupSW = cleanup;
    });

    // Listen for controller change (service worker update)
    const handleControllerChange = () => {
      // New version active after update
    };

    // Send sync message to service worker when online
    const handleOnline = () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_NOW',
        });
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    window.addEventListener('online', handleOnline);

    return () => {
      cleanupSW?.();
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null; // This component doesn't render anything
}

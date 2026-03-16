'use client';

import { useState, useEffect, useCallback } from 'react';

export interface OnlineStatusResult {
  isOnline: boolean;
  wasOffline: boolean; // True if user was offline and just came back online
}

/**
 * Hook to track online/offline status
 * Returns current status and whether the user just came back online
 */
export function useOnlineStatus(): OnlineStatusResult {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Initialize with actual status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      const previouslyOffline = !navigator.onLine || !isOnline;
      setIsOnline(true);
      if (previouslyOffline) {
        setWasOffline(true);
        // Reset wasOffline after a short delay
        setTimeout(() => setWasOffline(false), 5000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  return { isOnline, wasOffline };
}

/**
 * Callback-based hook for responding to connectivity changes
 */
export function useOnlineCallback(
  onOnline?: () => void,
  onOffline?: () => void
): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      onOnline?.();
    };

    const handleOffline = () => {
      setIsOnline(false);
      onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnline, onOffline]);

  return isOnline;
}

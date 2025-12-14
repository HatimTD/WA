'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isOnline) {
      // Show "back online" message temporarily
      setShowOnlineMessage(true);
      const timer = setTimeout(() => {
        setShowOnlineMessage(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, mounted]);

  // Don't render during SSR
  if (!mounted) return null;

  // Don't show anything if online and not showing the temporary message
  if (isOnline && !showOnlineMessage) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isOnline
          ? 'bg-green-700' /* Darkened for WCAG AA contrast ratio with white text */
          : 'bg-orange-600' /* Darkened for WCAG AA contrast ratio */
      }`}
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-white text-sm font-medium">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4" />
              <span>You are back online! Syncing changes...</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span>You are offline. Changes will be saved locally and synced when you reconnect.</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

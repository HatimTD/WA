'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the app is running in standalone/PWA mode
 * Returns true when installed as PWA on iOS or Android
 */
export function useIsStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (PWA installed)
    const checkStandalone = () => {
      // Check for iOS standalone mode
      const isIOSStandalone = (navigator as any).standalone === true;

      // Check for display-mode: standalone (Chrome, Android, etc.)
      const mediaQuery = window.matchMedia('(display-mode: standalone)');
      const isMediaStandalone = mediaQuery.matches;

      // Check for display-mode: fullscreen (some PWAs)
      const fullscreenQuery = window.matchMedia('(display-mode: fullscreen)');
      const isFullscreen = fullscreenQuery.matches;

      // Check for minimal-ui mode
      const minimalQuery = window.matchMedia('(display-mode: minimal-ui)');
      const isMinimal = minimalQuery.matches;

      return isIOSStandalone || isMediaStandalone || isFullscreen || isMinimal;
    };

    setIsStandalone(checkStandalone());

    // Listen for changes in display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches || (navigator as any).standalone === true);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isStandalone;
}

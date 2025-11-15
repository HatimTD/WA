'use client';

import { useEffect } from 'react';

/**
 * Component to prevent iOS PWA from breaking out of standalone mode
 * Uses window.location.replace() which works better on iOS than router.push()
 */
export function StandaloneModeKeeper() {
  useEffect(() => {
    // Check if we're in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (!isStandalone) return;

    console.log('[StandaloneModeKeeper] Active in standalone mode');

    // Handle all clicks and touches
    const handleNavigation = (e: Event) => {
      const target = e.target as HTMLElement;

      // Check for anchor tags or their children
      const anchor = target.closest('a');

      if (anchor && anchor.href) {
        try {
          const url = new URL(anchor.href);
          const currentUrl = new URL(window.location.href);

          // Only intercept same-origin links
          if (url.origin === currentUrl.origin) {
            // Check if the anchor has an onclick handler or is part of a JavaScript app
            // If it does, let the JavaScript handle it
            const hasJSHandler = anchor.onclick ||
              anchor.hasAttribute('onclick') ||
              anchor.getAttribute('href')?.startsWith('#');

            if (hasJSHandler) {
              console.log('[StandaloneModeKeeper] Link has JS handler, not intercepting');
              return;
            }

            // Prevent default immediately
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const fullPath = url.pathname + url.search + url.hash;
            console.log('[StandaloneModeKeeper] Intercepting navigation to:', fullPath);

            // Use window.location.replace() for iOS compatibility
            // This method has been reported to work better for keeping standalone mode
            window.location.replace(fullPath);

            return false;
          }
        } catch (err) {
          console.error('[StandaloneModeKeeper] Error processing link:', err);
        }
      }
    };

    // Intercept at the earliest possible stage
    // Using capture:true and multiple event types
    const eventOptions = { capture: true, passive: false };

    // Listen for all possible navigation triggers
    document.addEventListener('click', handleNavigation, eventOptions);
    document.addEventListener('touchstart', handleNavigation, eventOptions);
    document.addEventListener('touchend', handleNavigation, eventOptions);

    // Note: We've removed form submission interception entirely
    // Forms with JavaScript handlers (like the login form) should work normally
    // This allows React/Next.js forms to handle their own submissions

    return () => {
      document.removeEventListener('click', handleNavigation, eventOptions);
      document.removeEventListener('touchstart', handleNavigation, eventOptions);
      document.removeEventListener('touchend', handleNavigation, eventOptions);
    };
  }, []);

  return null;
}

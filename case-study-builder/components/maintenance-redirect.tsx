'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const MAINTENANCE_CHECK_INTERVAL = 10000; // Check every 10 seconds

export default function MaintenanceRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const isCheckingRef = useRef(false);
  const lastMaintenanceStateRef = useRef<boolean | null>(null);

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      // Don't check if already checking
      if (isCheckingRef.current) return;

      try {
        isCheckingRef.current = true;
        const response = await fetch('/api/maintenance-status', {
          cache: 'no-store',
        });

        if (!response.ok) {
          console.error('Failed to check maintenance status');
          return;
        }

        const data = await response.json();
        const { maintenanceMode, isAdmin } = data;

        // Only redirect if maintenance status has changed
        if (lastMaintenanceStateRef.current !== maintenanceMode) {
          lastMaintenanceStateRef.current = maintenanceMode;

          // If maintenance mode is ON and user is NOT admin
          if (maintenanceMode && !isAdmin) {
            // Redirect to maintenance page if not already there
            if (pathname !== '/maintenance') {
              console.log('[Maintenance Redirect] Redirecting to maintenance page');
              router.push('/maintenance');
            }
          }
          // If maintenance mode is OFF and user is on maintenance page
          else if (!maintenanceMode && pathname === '/maintenance') {
            console.log('[Maintenance Redirect] Redirecting away from maintenance page');
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error('[Maintenance Redirect] Error:', error);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Initial check
    checkMaintenanceStatus();

    // Set up interval for periodic checks
    const intervalId = setInterval(checkMaintenanceStatus, MAINTENANCE_CHECK_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [pathname, router]);

  return null; // This component doesn't render anything
}

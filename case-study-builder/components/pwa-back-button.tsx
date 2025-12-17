'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsStandalone } from '@/hooks/useIsStandalone';

/**
 * PWA Back Button Component
 * Only shows when running in standalone/PWA mode
 * Hidden on dashboard root page
 */
export function PWABackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const isStandalone = useIsStandalone();

  // Pages where back button should be hidden
  const hideOnPaths = [
    '/dashboard',
    '/login',
    '/dev-login',
    '/',
  ];

  // Check if we should show the back button
  const shouldShow = isStandalone && !hideOnPaths.includes(pathname);

  if (!shouldShow) {
    return null;
  }

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to dashboard if no history
      router.push('/dashboard');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleBack}
      className="h-11 w-11 hover:bg-wa-green-50 dark:hover:bg-background touch-manipulation"
      aria-label="Go back"
    >
      <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-foreground" />
    </Button>
  );
}

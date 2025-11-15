'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Share, X, Plus, Square } from 'lucide-react';

export function IOSPWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iOS);

    // Check if app is already installed (running in standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if user previously dismissed the prompt
    const dismissed = localStorage.getItem('ios-pwa-prompt-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;

    // Only show if: iOS device, not installed, not recently dismissed
    if (iOS && !standalone && (!dismissedTime || Date.now() - dismissedTime > threeDaysInMs)) {
      // Show prompt after 3 seconds
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-pwa-prompt-dismissed', Date.now().toString());
  };

  // Don't render if not iOS, already installed, or shouldn't show
  if (!isIOS || isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto animate-in slide-in-from-bottom-5">
      <Card className="border-wa-green-500 dark:border-primary shadow-lg dark:bg-card dark:border-border">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-wa-green-100 dark:bg-accent rounded-lg">
                <Plus className="h-5 w-5 text-wa-green-600 dark:text-primary" />
              </div>
              <div>
                <CardTitle className="text-base dark:text-foreground">Install App</CardTitle>
                <CardDescription className="text-sm dark:text-muted-foreground">
                  Add to your home screen
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-muted"
            >
              <X className="h-4 w-4 dark:text-muted-foreground" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <p className="text-sm text-gray-600 dark:text-muted-foreground">
            Install this app on your iPhone for quick access and offline use:
          </p>

          <ol className="text-sm text-gray-700 dark:text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[20px]">1.</span>
              <span className="flex items-center gap-1">
                Tap the Share button
                <Share className="h-4 w-4 inline text-blue-500" />
                at the bottom of Safari
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[20px]">2.</span>
              <span className="flex items-center gap-1">
                Scroll down and tap
                <Plus className="h-4 w-4 inline" />
                <strong>Add to Home Screen</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold min-w-[20px]">3.</span>
              <span>Tap <strong>Add</strong> in the top-right corner</span>
            </li>
          </ol>

          <Button
            variant="outline"
            onClick={handleDismiss}
            className="w-full dark:border-border dark:text-foreground dark:hover:bg-muted"
          >
            Got it
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

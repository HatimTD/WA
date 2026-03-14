'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const dismissCount = parseInt(localStorage.getItem('pwa-install-dismiss-count') || '0');
      // Exponential backoff: 1st dismiss = 7 days, 2nd = 30 days, 3rd+ = never show again
      const waitMs = dismissCount >= 3
        ? Infinity
        : dismissCount >= 2
        ? 30 * 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000;

      if (Date.now() - dismissedTime < waitMs) {
        return;
      }
    }

    // Only show once per session (don't re-show on every navigation)
    const shownThisSession = sessionStorage.getItem('pwa-install-shown');
    if (shownThisSession) {
      return;
    }

    let showTimeout: ReturnType<typeof setTimeout>;
    let autoDismissTimeout: ReturnType<typeof setTimeout>;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Show after 5 seconds on the page
      showTimeout = setTimeout(() => {
        setShowPrompt(true);
        sessionStorage.setItem('pwa-install-shown', 'true');

        // Auto-dismiss after 10 seconds if user doesn't interact
        autoDismissTimeout = setTimeout(() => {
          setShowPrompt(false);
        }, 10000);
      }, 5000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(showTimeout);
      clearTimeout(autoDismissTimeout);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
      }

      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    const count = parseInt(localStorage.getItem('pwa-install-dismiss-count') || '0');
    localStorage.setItem('pwa-install-dismiss-count', String(count + 1));
  };

  // Don't render anything if already installed or prompt shouldn't be shown
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="border-wa-green-500 dark:border-primary shadow-lg dark:bg-card dark:border-border">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-wa-green-100 dark:bg-accent rounded-lg">
                <Download className="h-5 w-5 text-wa-green-600 dark:text-primary" />
              </div>
              <div>
                <CardTitle className="text-base dark:text-foreground">Install Case Study Builder</CardTitle>
                <CardDescription className="text-sm dark:text-muted-foreground">
                  Get quick access and work offline
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
        <CardContent className="pt-0">
          <div className="space-y-2">
            <ul className="text-sm text-gray-600 dark:text-muted-foreground space-y-1">
              <li>• Access from your home screen</li>
              <li>• Work offline with sync</li>
              <li>• Native app experience</li>
            </ul>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="flex-1"
              >
                {isInstalling ? 'Installing...' : 'Install Now'}
              </Button>
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="dark:border-border dark:text-foreground dark:hover:bg-muted"
              >
                Not Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

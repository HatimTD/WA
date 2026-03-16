'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Loader2, AlertCircle, Check } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/waUtils';
import { toast } from 'sonner';

export function OfflineIndicator() {
  const {
    isOnline,
    isSyncing,
    hasPending,
    pendingCount,
    syncProgress,
    lastSyncResult,
    triggerSync,
  } = useOfflineSync();

  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show success indicator briefly after sync completes
  useEffect(() => {
    if (lastSyncResult?.success && (lastSyncResult.syncedCases > 0 || lastSyncResult.syncedImages > 0)) {
      setShowSuccess(true);
      toast.success(
        `Synced ${lastSyncResult.syncedCases} case${lastSyncResult.syncedCases === 1 ? '' : 's'}, ${lastSyncResult.syncedImages} image${lastSyncResult.syncedImages === 1 ? '' : 's'}`
      );
      const timeout = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timeout);
    } else if (lastSyncResult && !lastSyncResult.success && lastSyncResult.errors.length > 0) {
      toast.error('Sync failed: ' + lastSyncResult.errors[0]);
    }
  }, [lastSyncResult]);

  // Toast when going offline
  useEffect(() => {
    if (mounted && !isOnline) {
      toast.warning('You are offline. Changes will be saved locally.');
    }
  }, [isOnline, mounted]);

  // Don't render during SSR
  if (!mounted) return null;

  // Don't show if online and nothing pending
  if (isOnline && !hasPending && !isSyncing && !showSuccess) {
    return null;
  }

  const getIcon = () => {
    if (showSuccess) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    if (isSyncing) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (!isOnline) {
      return <WifiOff className="h-4 w-4 text-amber-500" />;
    }
    if (hasPending) {
      return <CloudOff className="h-4 w-4 text-amber-500" />;
    }
    return <Cloud className="h-4 w-4 text-green-500" />;
  };

  const getLabel = () => {
    if (showSuccess) {
      return 'Synced';
    }
    if (isSyncing) {
      return 'Syncing...';
    }
    if (!isOnline) {
      return 'Offline';
    }
    if (hasPending) {
      return `${pendingCount.total} pending`;
    }
    return 'Online';
  };

  const getProgressPercentage = () => {
    if (!syncProgress || syncProgress.totalItems === 0) return 0;
    return (syncProgress.currentItem / syncProgress.totalItems) * 100;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 px-2 gap-1.5 text-xs font-medium',
            !isOnline && 'bg-amber-50 dark:bg-amber-950',
            hasPending && isOnline && 'bg-blue-50 dark:bg-blue-950',
            showSuccess && 'bg-green-50 dark:bg-green-950'
          )}
        >
          {getIcon()}
          <span className="hidden sm:inline">{getLabel()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          {/* Status Header */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-amber-500" />
            )}
            <div>
              <p className="font-medium text-sm">
                {isOnline ? 'Connected' : 'Offline Mode'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isOnline
                  ? 'Your data will sync automatically'
                  : 'Changes will sync when online'}
              </p>
            </div>
          </div>

          {/* Pending Items */}
          {hasPending && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <p className="text-sm font-medium">Pending Sync</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                {pendingCount.caseStudies > 0 && (
                  <p>{pendingCount.caseStudies} case stud{pendingCount.caseStudies === 1 ? 'y' : 'ies'}</p>
                )}
                {pendingCount.images > 0 && (
                  <p>{pendingCount.images} image{pendingCount.images === 1 ? '' : 's'}</p>
                )}
              </div>
            </div>
          )}

          {/* Sync Progress */}
          {isSyncing && syncProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {syncProgress.stage === 'images' && 'Uploading images...'}
                  {syncProgress.stage === 'cases' && 'Syncing case studies...'}
                  {syncProgress.stage === 'complete' && 'Complete!'}
                </span>
                <span className="font-medium">
                  {syncProgress.currentItem}/{syncProgress.totalItems}
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="h-1.5" />
              {syncProgress.currentItemName && (
                <p className="text-xs text-muted-foreground truncate">
                  {syncProgress.currentItemName}
                </p>
              )}
            </div>
          )}

          {/* Last Sync Result */}
          {lastSyncResult && !isSyncing && (
            <div
              className={cn(
                'rounded-lg p-3 text-xs',
                lastSyncResult.success
                  ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
              )}
            >
              {lastSyncResult.success ? (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>
                    Synced {lastSyncResult.syncedCases} case{lastSyncResult.syncedCases === 1 ? '' : 's'},{' '}
                    {lastSyncResult.syncedImages} image{lastSyncResult.syncedImages === 1 ? '' : 's'}
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Sync failed</p>
                    {lastSyncResult.errors.length > 0 && (
                      <p className="mt-1 truncate">{lastSyncResult.errors[0]}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Sync Button */}
          {isOnline && hasPending && !isSyncing && (
            <Button
              size="sm"
              className="w-full"
              onClick={triggerSync}
            >
              <Cloud className="h-4 w-4 mr-2" />
              Sync Now
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

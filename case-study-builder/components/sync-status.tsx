'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, Cloud } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getPendingChanges } from '@/lib/db/utils';
import { Button } from '@/components/ui/button';

interface SyncStatusProps {
  onSyncNow?: () => void;
}

export function SyncStatus({ onSyncNow }: SyncStatusProps) {
  const { isOnline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadPendingCount();

    // Poll for pending changes every 10 seconds
    const interval = setInterval(loadPendingCount, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadPendingCount() {
    try {
      const pending = await getPendingChanges();
      setPendingCount(pending.length);
    } catch (error) {
      console.error('[SyncStatus] Error loading pending count:', error);
    }
  }

  async function handleSyncNow() {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      if (onSyncNow) {
        await onSyncNow();
      }
      setLastSyncedAt(new Date());
      await loadPendingCount();
    } catch (error) {
      console.error('[SyncStatus] Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }

  // Don't render during SSR
  if (!mounted) return null;

  // Don't show if online and nothing pending
  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      {isSyncing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin text-wa-green-500" />
          <span className="text-muted-foreground">Syncing...</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <Cloud className="h-4 w-4 text-orange-500" />
          <span className="text-muted-foreground">
            {pendingCount} change{pendingCount !== 1 ? 's' : ''} pending
          </span>
          {isOnline && onSyncNow && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSyncNow}
              className="h-auto py-1 px-2"
            >
              Sync Now
            </Button>
          )}
        </>
      ) : lastSyncedAt ? (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-muted-foreground">
            Synced {lastSyncedAt.toLocaleTimeString()}
          </span>
        </>
      ) : null}

      {!isOnline && pendingCount > 0 && (
        <span className="text-xs text-orange-600">
          (Will sync when online)
        </span>
      )}
    </div>
  );
}

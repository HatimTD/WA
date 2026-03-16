'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import {
  syncOfflineData,
  hasPendingSync,
  getSyncStatus,
  SyncProgress,
} from '@/lib/db/sync-service';
import { getPendingCount } from '@/lib/db/offline-case-study';

export interface UseOfflineSyncResult {
  isOnline: boolean;
  isSyncing: boolean;
  hasPending: boolean;
  pendingCount: {
    caseStudies: number;
    images: number;
    total: number;
  };
  syncProgress: SyncProgress | null;
  lastSyncResult: {
    success: boolean;
    syncedCases: number;
    syncedImages: number;
    errors: string[];
  } | null;
  triggerSync: () => Promise<void>;
}

/**
 * Hook for managing offline sync
 * Automatically syncs when coming back online
 */
export function useOfflineSync(): UseOfflineSyncResult {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [pendingCount, setPendingCount] = useState({
    caseStudies: 0,
    images: 0,
    total: 0,
  });
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<{
    success: boolean;
    syncedCases: number;
    syncedImages: number;
    errors: string[];
  } | null>(null);

  const syncInProgress = useRef(false);

  // Check for pending items on mount and periodically
  const checkPending = useCallback(async () => {
    try {
      const pending = await hasPendingSync();
      setHasPending(pending);

      const count = await getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('[useOfflineSync] Error checking pending:', error);
    }
  }, []);

  // Sync function
  const triggerSync = useCallback(async () => {
    if (syncInProgress.current || !isOnline) {
      return;
    }

    syncInProgress.current = true;
    setIsSyncing(true);
    setSyncProgress({
      stage: 'idle',
      currentItem: 0,
      totalItems: 0,
    });

    try {
      const result = await syncOfflineData((progress) => {
        setSyncProgress(progress);
      });

      setLastSyncResult(result);

      // Refresh pending count
      await checkPending();
    } catch (error) {
      console.error('[useOfflineSync] Sync error:', error);
      setLastSyncResult({
        success: false,
        syncedCases: 0,
        syncedImages: 0,
        errors: [error instanceof Error ? error.message : 'Sync failed'],
      });
    } finally {
      setIsSyncing(false);
      syncInProgress.current = false;
      setSyncProgress(null);
    }
  }, [isOnline, checkPending]);

  // Check pending on mount
  useEffect(() => {
    checkPending();
  }, [checkPending]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (wasOffline && isOnline && hasPending) {
      // Small delay to ensure network is stable
      const timeout = setTimeout(() => {
        triggerSync();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [wasOffline, isOnline, hasPending, triggerSync]);

  // Listen for service worker sync trigger
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_TRIGGERED') {
        triggerSync();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [triggerSync]);

  return {
    isOnline,
    isSyncing,
    hasPending,
    pendingCount,
    syncProgress,
    lastSyncResult,
    triggerSync,
  };
}

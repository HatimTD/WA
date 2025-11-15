import {
  getPendingChanges,
  removePendingChange,
  updatePendingChangeRetry,
  updateSyncMetadata,
} from '../db/utils';

const MAX_RETRIES = 3;

/**
 * Background sync service for syncing offline changes to server
 */
export class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Start automatic sync (runs every 30 seconds when online)
   */
  startAutoSync() {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncAll();
      }
    }, 30000); // 30 seconds

    console.log('[SyncService] Auto-sync started');
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[SyncService] Auto-sync stopped');
    }
  }

  /**
   * Manually trigger sync
   */
  async syncAll(): Promise<{ success: boolean; synced: number; errors: number }> {
    if (this.isSyncing) {
      console.log('[SyncService] Sync already in progress');
      return { success: false, synced: 0, errors: 0 };
    }

    if (!navigator.onLine) {
      console.log('[SyncService] Cannot sync - offline');
      return { success: false, synced: 0, errors: 0 };
    }

    this.isSyncing = true;
    let syncedCount = 0;
    let errorCount = 0;

    try {
      await updateSyncMetadata('global', 'syncing');

      const pendingChanges = await getPendingChanges();
      console.log(`[SyncService] Syncing ${pendingChanges.length} changes`);

      for (const change of pendingChanges) {
        try {
          // Skip if max retries exceeded
          if (change.retryCount >= MAX_RETRIES) {
            console.error(
              `[SyncService] Max retries exceeded for change ${change.id}`
            );
            errorCount++;
            continue;
          }

          // Sync based on entity type
          const success = await this.syncChange(change);

          if (success) {
            await removePendingChange(change.id);
            syncedCount++;
            console.log(`[SyncService] Synced change ${change.id}`);
          } else {
            throw new Error('Sync failed');
          }
        } catch (error: any) {
          console.error(`[SyncService] Error syncing change ${change.id}:`, error);
          await updatePendingChangeRetry(
            change.id,
            error.message || 'Unknown error'
          );
          errorCount++;
        }
      }

      await updateSyncMetadata(
        'global',
        errorCount > 0 ? 'error' : 'idle',
        errorCount > 0 ? `${errorCount} errors occurred` : undefined
      );

      console.log(
        `[SyncService] Sync complete: ${syncedCount} synced, ${errorCount} errors`
      );

      return { success: errorCount === 0, synced: syncedCount, errors: errorCount };
    } catch (error) {
      console.error('[SyncService] Sync failed:', error);
      await updateSyncMetadata('global', 'error', 'Sync failed');
      return { success: false, synced: syncedCount, errors: errorCount };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single change based on entity type and operation
   */
  private async syncChange(change: any): Promise<boolean> {
    const { entity, operation, data } = change;

    try {
      switch (entity) {
        case 'saved_case':
          return await this.syncSavedCase(operation, data);

        case 'comment':
          return await this.syncComment(operation, data);

        case 'case':
          return await this.syncCase(operation, data);

        default:
          console.warn(`[SyncService] Unknown entity type: ${entity}`);
          return false;
      }
    } catch (error) {
      console.error(`[SyncService] Error syncing ${entity}:`, error);
      return false;
    }
  }

  /**
   * Sync saved case changes
   */
  private async syncSavedCase(operation: string, data: any): Promise<boolean> {
    if (operation === 'create') {
      const response = await fetch('/api/saved-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseStudyId: data.caseStudyId,
        }),
      });

      return response.ok;
    } else if (operation === 'delete') {
      const response = await fetch(`/api/saved-cases/${data.id}`, {
        method: 'DELETE',
      });

      return response.ok;
    }

    return false;
  }

  /**
   * Sync comment changes
   */
  private async syncComment(operation: string, data: any): Promise<boolean> {
    if (operation === 'create') {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseStudyId: data.caseStudyId,
          content: data.content,
        }),
      });

      return response.ok;
    } else if (operation === 'update') {
      const response = await fetch(`/api/comments/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: data.content,
        }),
      });

      return response.ok;
    } else if (operation === 'delete') {
      const response = await fetch(`/api/comments/${data.id}`, {
        method: 'DELETE',
      });

      return response.ok;
    }

    return false;
  }

  /**
   * Sync case study changes
   */
  private async syncCase(operation: string, data: any): Promise<boolean> {
    if (operation === 'create' || operation === 'update') {
      const method = operation === 'create' ? 'POST' : 'PATCH';
      const url =
        operation === 'create' ? '/api/cases' : `/api/cases/${data.id}`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      return response.ok;
    } else if (operation === 'delete') {
      const response = await fetch(`/api/cases/${data.id}`, {
        method: 'DELETE',
      });

      return response.ok;
    }

    return false;
  }

  /**
   * Get sync status
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

// Export singleton instance
export const syncService = new SyncService();

// Start auto-sync when service is loaded (if in browser)
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SyncService] Online - starting auto-sync');
    syncService.startAutoSync();
    syncService.syncAll();
  });

  window.addEventListener('offline', () => {
    console.log('[SyncService] Offline - stopping auto-sync');
    syncService.stopAutoSync();
  });

  // Start if already online
  if (navigator.onLine) {
    syncService.startAutoSync();
  }
}

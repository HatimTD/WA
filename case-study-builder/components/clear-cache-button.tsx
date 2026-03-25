'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ClearCacheButton() {
  const [isClearing, setIsClearing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const response = await fetch('/api/admin/netsuite/clear-cache', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        toast.success('All NetSuite caches cleared (customers, employees, subsidiaries)');
      } else {
        toast.error(result.error || 'Failed to clear cache');
      }
    } catch (error) {
      toast.error('Failed to clear cache');
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearAndResync = async () => {
    setIsSyncing(true);
    try {
      // Step 1: Clear cache
      const clearRes = await fetch('/api/admin/netsuite/clear-cache', { method: 'POST' });
      const clearResult = await clearRes.json();
      if (!clearResult.success) {
        toast.error(clearResult.error || 'Failed to clear cache');
        return;
      }
      toast.success('Cache cleared, starting fresh sync...');

      // Step 2: Trigger sync (fetches fresh from NetSuite since cache is empty)
      const syncRes = await fetch('/api/cron/netsuite-sync');
      const syncResult = await syncRes.json();
      if (syncResult.success) {
        const sub = syncResult.subsidiaries;
        const emp = syncResult.employees;
        toast.success(
          `Sync complete: ${sub?.totalSubsidiaries || 0} subsidiaries, ${emp?.totalEmployees || 0} employees`
        );
      } else {
        toast.error(syncResult.error || 'Sync failed');
      }
    } catch (error) {
      toast.error('Failed to sync');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="gap-2 dark:border-border dark:text-foreground dark:hover:bg-background"
        onClick={handleClearCache}
        disabled={isClearing}
      >
        {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        {isClearing ? 'Clearing...' : 'Clear Redis Cache'}
      </Button>
      <Button
        variant="outline"
        className="gap-2 dark:border-border dark:text-foreground dark:hover:bg-background"
        onClick={handleClearAndResync}
        disabled={isSyncing}
      >
        {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {isSyncing ? 'Syncing...' : 'Resync NetSuite'}
      </Button>
    </div>
  );
}

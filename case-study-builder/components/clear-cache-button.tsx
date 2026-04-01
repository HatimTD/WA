'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, RefreshCw, Languages } from 'lucide-react';
import { toast } from 'sonner';

export default function ClearCacheButton() {
  const [isClearing, setIsClearing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFixingTranslations, setIsFixingTranslations] = useState(false);

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
      // Admin-authenticated endpoint: clears cache + syncs fresh from NetSuite
      const response = await fetch('/api/admin/netsuite/resync', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        const sub = result.subsidiaries;
        const emp = result.employees;
        toast.success(
          `Resync complete: ${sub?.totalSubsidiaries || 0} subsidiaries (${sub?.newSubsidiaries || 0} new), ${emp?.totalEmployees || 0} employees`
        );
      } else {
        toast.error(result.error || 'Resync failed');
      }
    } catch (error) {
      toast.error('Failed to resync');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFixTranslations = async () => {
    setIsFixingTranslations(true);
    try {
      const response = await fetch('/api/admin/fix-translations', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        toast.success(
          `Fixed ${result.fixed} language detections, cleared ${result.cleared} corrupted translations (${result.alreadyCorrect} already correct)`
        );
      } else {
        toast.error(result.error || 'Failed to fix translations');
      }
    } catch (error) {
      toast.error('Failed to fix translations');
    } finally {
      setIsFixingTranslations(false);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
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
      <Button
        variant="outline"
        className="gap-2 dark:border-border dark:text-foreground dark:hover:bg-background"
        onClick={handleFixTranslations}
        disabled={isFixingTranslations}
      >
        {isFixingTranslations ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
        {isFixingTranslations ? 'Fixing...' : 'Fix All Translations'}
      </Button>
    </div>
  );
}

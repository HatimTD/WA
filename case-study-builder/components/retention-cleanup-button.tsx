'use client';

/**
 * Retention Cleanup Button Component
 *
 * Client component for running data retention cleanup with proper UI feedback.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { waRunRetentionCleanup, waInitializeRetentionPolicies } from '@/lib/actions/waRetentionActions';
import { toast } from 'sonner';

type CleanupResult = {
  totalDeleted: number;
  totalArchived: number;
  notifications: { deleted: number };
  sessions: { deleted: number };
  comments: { deleted: number };
  caseStudies: { archived: number };
};

export default function RetentionCleanupButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);

  const waHandleCleanup = async () => {
    setIsLoading(true);
    setShowConfirm(false);

    try {
      const response = await waRunRetentionCleanup();

      if (response.success && response.result) {
        setResult(response.result);
        toast.success('Cleanup completed successfully');
      } else {
        toast.error('Cleanup failed', { description: response.error });
      }
    } catch {
      toast.error('An error occurred during cleanup');
    } finally {
      setIsLoading(false);
    }
  };

  const waHandleInitialize = async () => {
    setIsLoading(true);

    try {
      const response = await waInitializeRetentionPolicies();

      if (response.success) {
        toast.success(`Initialized ${response.count} retention policies`);
      } else {
        toast.error('Initialization failed', { description: response.error });
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Run Cleanup
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Retention Cleanup</DialogTitle>
            <DialogDescription>
              This will remove expired data according to the configured retention policies.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>The following data will be cleaned up:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Read notifications older than retention period</li>
              <li>Expired user sessions</li>
              <li>Old comments on inactive case studies</li>
              <li>Case studies marked for archival</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={waHandleCleanup} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Run Cleanup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={!!result} onOpenChange={() => setResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Cleanup Completed
            </DialogTitle>
            <DialogDescription>
              The retention cleanup has been executed successfully.
            </DialogDescription>
          </DialogHeader>
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-2xl font-bold">{result.notifications?.deleted || 0}</p>
                  <p className="text-sm text-muted-foreground">Notifications deleted</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-2xl font-bold">{result.sessions?.deleted || 0}</p>
                  <p className="text-sm text-muted-foreground">Sessions deleted</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-2xl font-bold">{result.comments?.deleted || 0}</p>
                  <p className="text-sm text-muted-foreground">Comments deleted</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-2xl font-bold">{result.caseStudies?.archived || 0}</p>
                  <p className="text-sm text-muted-foreground">Case studies archived</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This action has been logged in the audit trail.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setResult(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

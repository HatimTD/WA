'use client';

/**
 * GDPR Request Actions Component
 *
 * Client component for handling GDPR admin actions with proper UI feedback.
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
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Mail, XCircle, Ban, Loader2, CheckCircle, Copy } from 'lucide-react';
import {
  waProcessGdprRequest,
  waRejectGdprRequest,
  waCancelGdprRequest,
  waResendVerification,
} from '@/lib/actions/waGdprAdminActions';
import { toast } from 'sonner';

type Props = {
  requestId: string;
  status: string;
  userEmail: string;
};

export default function GdprRequestActions({ requestId, status, userEmail }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<'process' | 'reject' | 'cancel' | null>(null);
  const [reason, setReason] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const waHandleProcess = async () => {
    setIsLoading(true);
    try {
      const result = await waProcessGdprRequest(requestId);
      if (result.success) {
        toast.success('Request processed successfully', {
          description: `Deleted: ${JSON.stringify(result.deletedData)}`,
        });
      } else {
        toast.error('Failed to process request', { description: result.error });
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  const waHandleReject = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setIsLoading(true);
    try {
      const result = await waRejectGdprRequest(requestId, reason);
      if (result.success) {
        toast.success('Request rejected');
      } else {
        toast.error('Failed to reject request', { description: result.error });
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
      setAction(null);
      setReason('');
    }
  };

  const waHandleCancel = async () => {
    setIsLoading(true);
    try {
      const result = await waCancelGdprRequest(requestId, reason || undefined);
      if (result.success) {
        toast.success('Request cancelled');
      } else {
        toast.error('Failed to cancel request', { description: result.error });
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
      setAction(null);
      setReason('');
    }
  };

  const waHandleResendVerification = async () => {
    setIsLoading(true);
    try {
      const result = await waResendVerification(requestId);
      if (result.success) {
        if (result.verificationToken) {
          setVerificationToken(result.verificationToken);
          toast.success('Verification resent', {
            description: 'Token shown for dev testing',
          });
        } else {
          toast.success('Verification email sent to ' + userEmail);
        }
      } else {
        toast.error('Failed to resend verification', { description: result.error });
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const waCopyToken = () => {
    if (verificationToken) {
      navigator.clipboard.writeText(verificationToken);
      toast.success('Token copied to clipboard');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Status-specific actions */}
      {status === 'PENDING' && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={waHandleResendVerification}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Mail className="h-3 w-3" />
            )}
            Send Verification
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-orange-600 hover:text-orange-700"
            onClick={() => setAction('cancel')}
            disabled={isLoading}
          >
            <Ban className="h-3 w-3" />
            Cancel
          </Button>
        </>
      )}

      {status === 'VERIFIED' && (
        <>
          <Button
            size="sm"
            variant="destructive"
            className="gap-1"
            onClick={() => setAction('process')}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            Process Deletion
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-red-600 hover:text-red-700"
            onClick={() => setAction('reject')}
            disabled={isLoading}
          >
            <XCircle className="h-3 w-3" />
            Reject
          </Button>
        </>
      )}

      {status === 'IN_PROGRESS' && (
        <span className="text-sm text-orange-600 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing...
        </span>
      )}

      {status === 'COMPLETED' && (
        <span className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="h-4 w-4" />
          Completed
        </span>
      )}

      {/* Token display for dev testing */}
      {verificationToken && (
        <Dialog open={!!verificationToken} onOpenChange={() => setVerificationToken(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verification Token (Dev Only)</DialogTitle>
              <DialogDescription>
                This token is shown for testing purposes only. In production, it would be sent via email.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg font-mono text-sm break-all">
              {verificationToken}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={waCopyToken} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy Token
              </Button>
              <Button onClick={() => setVerificationToken(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation dialogs */}
      <Dialog open={action === 'process'} onOpenChange={() => setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirm Data Deletion</DialogTitle>
            <DialogDescription>
              This will permanently delete the user&apos;s personal data and anonymize their account.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p><strong>User:</strong> {userEmail}</p>
            <p><strong>Request ID:</strong> {requestId.slice(0, 12)}...</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={waHandleProcess} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={action === 'reject'} onOpenChange={() => setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject GDPR Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this deletion request. This will be recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (required)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={waHandleReject} disabled={isLoading || !reason.trim()}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={action === 'cancel'} onOpenChange={() => setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel GDPR Request</DialogTitle>
            <DialogDescription>
              Cancel this pending deletion request. The user can submit a new request if needed.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for cancellation (optional)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={isLoading}>
              Back
            </Button>
            <Button variant="destructive" onClick={waHandleCancel} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Cancel Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

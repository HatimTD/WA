'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { waApproveCaseStudy, waRejectCaseStudy } from '@/lib/actions/waApprovalActions';
import { toast } from 'sonner';

type Props = {
  caseStudyId: string;
};

export default function ApprovalActions({ caseStudyId }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const result = await waApproveCaseStudy(caseStudyId);

      if (result.success) {
        toast.success('Case study approved successfully!');
        setShowApproveDialog(false);

        // Show badge notification if contributor earned badges
        if (result.badgeAwarded && result.badgeMessage) {
          setTimeout(() => {
            toast.success(result.badgeMessage, {
              duration: 5000,
              icon: '🏆',
            });
          }, 500);
        }

        router.push('/dashboard/approvals');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to approve case study');
      }
    } catch (error) {
      toast.error('An error occurred while approving');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await waRejectCaseStudy(caseStudyId, rejectionReason);

      if (result.success) {
        toast.success('Case study rejected');
        setShowRejectDialog(false);
        router.push('/dashboard/approvals');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to reject case study');
      }
    } catch (error) {
      toast.error('An error occurred while rejecting');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="destructive"
          onClick={() => setShowRejectDialog(true)}
          disabled={isSubmitting}
          className="flex-1"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Reject
        </Button>
        <Button
          onClick={() => setShowApproveDialog(true)}
          disabled={isSubmitting}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Approve
        </Button>
      </div>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-center text-xl">Approve Case Study</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to approve this case study? It will be published to the library and visible to all users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Approving...' : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog with Reason */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-center text-xl">Reject Case Study</DialogTitle>
            <DialogDescription className="text-center">
              Please provide feedback for the contributor explaining why this case study is being rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejectionReason" className="dark:text-foreground">
                Rejection Reason <span className="text-red-500 dark:text-red-400">*</span>
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain what needs to be improved or corrected..."
                className="mt-2 dark:bg-input dark:border-border dark:text-foreground"
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-2">
                This feedback will be sent to the contributor to help them improve their submission.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !rejectionReason.trim()}
              className="w-full sm:w-auto"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

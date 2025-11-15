'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle } from 'lucide-react';
import { approveCaseStudy, rejectCaseStudy } from '@/lib/actions/approval-actions';
import { toast } from 'sonner';

type Props = {
  caseStudyId: string;
};

export default function ApprovalActions({ caseStudyId }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this case study?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await approveCaseStudy(caseStudyId);

      if (result.success) {
        toast.success('Case study approved successfully!');

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

    if (!confirm('Are you sure you want to reject this case study?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await rejectCaseStudy(caseStudyId, rejectionReason);

      if (result.success) {
        toast.success('Case study rejected');
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

  if (showRejectForm) {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="rejectionReason" className="dark:text-foreground">
            Rejection Reason <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <Textarea
            id="rejectionReason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why this case study is being rejected..."
            className="mt-2 dark:bg-input dark:border-border dark:text-foreground"
            rows={4}
          />
          <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
            The contributor will see this feedback
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowRejectForm(false);
              setRejectionReason('');
            }}
            disabled={isSubmitting}
            className="dark:border-border dark:text-foreground dark:hover:bg-accent"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isSubmitting || !rejectionReason.trim()}
          >
            <XCircle className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <Button
        variant="destructive"
        onClick={() => setShowRejectForm(true)}
        disabled={isSubmitting}
        className="flex-1"
      >
        <XCircle className="h-4 w-4 mr-2" />
        Reject
      </Button>
      <Button
        onClick={handleApprove}
        disabled={isSubmitting}
        className="flex-1 bg-green-600 hover:bg-green-700"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        {isSubmitting ? 'Approving...' : 'Approve'}
      </Button>
    </div>
  );
}

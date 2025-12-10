'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { emailCaseStudyPDF } from '@/lib/actions/email-pdf-actions';

interface EmailPDFDialogProps {
  caseStudyId: string;
  caseStudyTitle: string;
  className?: string;
}

export function EmailPDFDialog({
  caseStudyId,
  caseStudyTitle,
  className = '',
}: EmailPDFDialogProps) {
  const [open, setOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSend = async () => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    startTransition(async () => {
      const result = await emailCaseStudyPDF({
        caseId: caseStudyId,
        recipientEmail,
        message: message || undefined,
      });

      if (result.success) {
        toast.success(`PDF sent to ${recipientEmail}!`);
        setOpen(false);
        // Reset form
        setRecipientEmail('');
        setMessage('');
      } else {
        toast.error(result.error || 'Failed to send email');
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isPending) {
      setOpen(newOpen);
      // Reset form when closing
      if (!newOpen) {
        setRecipientEmail('');
        setMessage('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={`dark:border-border ${className}`}>
          <Mail className="h-4 w-4 mr-2" />
          Email PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] dark:bg-card dark:border-border">
        <DialogHeader>
          <DialogTitle className="dark:text-foreground">Email Case Study as PDF</DialogTitle>
          <DialogDescription className="dark:text-muted-foreground">
            Send this case study as a PDF attachment to a colleague or client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Case Study Title (read-only) */}
          <div className="space-y-2">
            <Label className="dark:text-foreground">Case Study</Label>
            <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-md border dark:border-border">
              {caseStudyTitle}
            </div>
          </div>

          {/* Recipient Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="dark:text-foreground">
              Recipient Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="dark:bg-gray-900 dark:border-border dark:text-foreground"
              disabled={isPending}
              required
            />
          </div>

          {/* Optional Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="dark:text-foreground">
              Personal Message (Optional)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to include in the email..."
              className="dark:bg-gray-900 dark:border-border dark:text-foreground resize-none"
              rows={4}
              disabled={isPending}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The PDF will be automatically attached to the email.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
            className="dark:border-border"
          >
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isPending || !recipientEmail}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

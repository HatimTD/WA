'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { waEmailCaseStudyPDF } from '@/lib/actions/waEmailPdfActions';

interface EmailPDFButtonProps {
  caseStudyId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function EmailPDFButton({
  caseStudyId,
  variant = 'outline',
  size = 'default',
  className = '',
}: EmailPDFButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    try {
      const result = await waEmailCaseStudyPDF({
        caseId: caseStudyId,
        recipientEmail,
        message: message || undefined,
      });

      if (result.success) {
        toast.success(`Case study PDF sent to ${recipientEmail}!`);
        setIsOpen(false);
        setRecipientEmail('');
        setMessage('');
      } else {
        toast.error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('[EmailPDFButton] Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setRecipientEmail('');
    setMessage('');
  };

  if (!isOpen) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsOpen(true)}
      >
        <Mail className="h-4 w-4 mr-2" />
        Email PDF
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-card rounded-lg shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">
            Email Case Study PDF
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isSending}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Recipient Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              disabled={isSending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to include in the email..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t dark:border-border">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSend}
            disabled={isSending || !recipientEmail}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          The case study will be sent as a professionally formatted PDF attachment.
        </p>
      </div>
    </div>
  );
}

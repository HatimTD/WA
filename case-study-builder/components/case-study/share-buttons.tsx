'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Linkedin, Mail, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonsProps {
  caseStudyId: string;
  title: string;
  description: string;
  url?: string;
  className?: string;
}

export function ShareButtons({
  caseStudyId,
  title,
  description,
  url,
  className = '',
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // LinkedIn Share
  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');

    // Track share if analytics available
    if (typeof window !== 'undefined' && (window as any).trackEvent) {
      (window as any).trackEvent('share', {
        method: 'linkedin',
        case_study_id: caseStudyId,
      });
    }

    toast.success('Opening LinkedIn share dialog...');
  };

  // Email Share
  const handleEmailShare = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(
      `I thought you might find this case study interesting:\n\n${title}\n\n${description}\n\nView it here: ${shareUrl}`
    );
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;

    // Track share if analytics available
    if (typeof window !== 'undefined' && (window as any).trackEvent) {
      (window as any).trackEvent('share', {
        method: 'email',
        case_study_id: caseStudyId,
      });
    }

    toast.success('Opening email client...');
  };

  // Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);

      // Track share if analytics available
      if (typeof window !== 'undefined' && (window as any).trackEvent) {
        (window as any).trackEvent('share', {
          method: 'copy_link',
          case_study_id: caseStudyId,
        });
      }

      toast.success('Link copied to clipboard!');

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('[ShareButtons] Error copying to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleLinkedInShare}
        className="dark:border-border"
        title="Share on LinkedIn"
      >
        <Linkedin className="h-4 w-4" />
        <span className="hidden sm:inline ml-2">LinkedIn</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleEmailShare}
        className="dark:border-border"
        title="Share via Email"
      >
        <Mail className="h-4 w-4" />
        <span className="hidden sm:inline ml-2">Email</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="dark:border-border"
        title={copied ? 'Link copied!' : 'Copy link'}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            <span className="hidden sm:inline ml-2 text-green-600">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Copy Link</span>
          </>
        )}
      </Button>
    </div>
  );
}

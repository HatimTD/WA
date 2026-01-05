'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Linkedin, Mail, Copy, Check, MessageCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Props for ShareButtons component
 */
interface ShareButtonsProps {
  /** Case study ID for tracking */
  caseStudyId: string;
  /** Title of the case study */
  title: string;
  /** Description of the case study */
  description: string;
  /** Optional custom URL (defaults to current page) */
  url?: string;
  /** Optional CSS class */
  className?: string;
}

/**
 * ShareButtons Component
 * @description Social sharing buttons for case studies (LinkedIn, WhatsApp, Teams, Email, Copy Link)
 * @param props - Component props
 * @returns Share buttons JSX
 */
export function ShareButtons({
  caseStudyId,
  title,
  description,
  url,
  className = '',
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  /**
   * Track share event if analytics available
   */
  const trackShare = (method: string) => {
    if (typeof window !== 'undefined' && (window as any).trackEvent) {
      (window as any).trackEvent('share', {
        method,
        case_study_id: caseStudyId,
      });
    }
  };

  /**
   * Handle LinkedIn share
   */
  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
    trackShare('linkedin');
    toast.success('Opening LinkedIn share dialog...');
  };

  /**
   * Handle WhatsApp share
   */
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${title}\n\n${description}\n\n${shareUrl}`);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${text}`;
    window.open(whatsappUrl, '_blank', 'width=600,height=400');
    trackShare('whatsapp');
    toast.success('Opening WhatsApp...');
  };

  /**
   * Handle Microsoft Teams share
   */
  const handleTeamsShare = () => {
    const teamsUrl = `https://teams.microsoft.com/share?href=${encodeURIComponent(shareUrl)}&msgText=${encodeURIComponent(title)}`;
    window.open(teamsUrl, '_blank', 'width=600,height=400');
    trackShare('teams');
    toast.success('Opening Microsoft Teams...');
  };

  /**
   * Handle Email share
   */
  const handleEmailShare = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(
      `I thought you might find this case study interesting:\n\n${title}\n\n${description}\n\nView it here: ${shareUrl}`
    );
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    trackShare('email');
    toast.success('Opening email client...');
  };

  /**
   * Handle Copy Link
   */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      trackShare('copy_link');
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[ShareButtons] Error copying to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
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
        onClick={handleWhatsAppShare}
        className="dark:border-border"
        title="Share on WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline ml-2">WhatsApp</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleTeamsShare}
        className="dark:border-border"
        title="Share on Microsoft Teams"
      >
        <Users className="h-4 w-4" />
        <span className="hidden sm:inline ml-2">Teams</span>
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

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ShareButton({
  title,
  text,
  url,
  variant = 'outline',
  size = 'default',
  className = '',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Check if Web Share API is available
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const handleShare = async () => {
    setIsSharing(true);

    const shareData = {
      title,
      text: text || title,
      url: url || window.location.href,
    };

    try {
      if (canShare) {
        // Use Web Share API
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } else {
        // Fallback to copy to clipboard
        const textToCopy = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        await navigator.clipboard.writeText(textToCopy);

        setCopied(true);
        toast.success('Link copied to clipboard!');

        // Reset copied state after 2 seconds
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch (error) {
      // User cancelled the share or there was an error
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('[ShareButton] Error sharing:', error);
        toast.error('Failed to share');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      disabled={isSharing}
      className={className}
    >
      {copied ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        canShare ? (
          <Share2 className="h-4 w-4 mr-2" />
        ) : (
          <Copy className="h-4 w-4 mr-2" />
        )
      )}
      {size !== 'icon' && (
        <span>
          {copied ? 'Copied!' : isSharing ? 'Sharing...' : canShare ? 'Share' : 'Copy Link'}
        </span>
      )}
    </Button>
  );
}

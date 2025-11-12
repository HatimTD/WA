'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SaveButtonProps {
  caseStudyId: string;
  initialSaved?: boolean;
  variant?: 'icon' | 'text' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function SaveButton({
  caseStudyId,
  initialSaved = false,
  variant = 'outline',
  size = 'default',
  className = '',
}: SaveButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleSave = async () => {
    if (!session?.user) {
      toast.error('Please sign in to save cases');
      router.push('/login');
      return;
    }

    setIsLoading(true);

    try {
      if (isSaved) {
        // Unsave
        const response = await fetch(`/api/saved-cases?caseStudyId=${caseStudyId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsSaved(false);
          toast.success('Removed from saved cases');
        } else {
          const data = await response.json();
          toast.error(data.error || 'Failed to unsave');
        }
      } else {
        // Save
        const response = await fetch('/api/saved-cases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ caseStudyId }),
        });

        if (response.ok) {
          setIsSaved(true);
          toast.success('Saved to your collection');
        } else {
          const data = await response.json();
          toast.error(data.error || 'Failed to save');
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleSave}
        disabled={isLoading}
        className={className}
        title={isSaved ? 'Remove from saved' : 'Save for later'}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSaved ? (
          <BookmarkCheck className="h-4 w-4 text-blue-600" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
      </Button>
    );
  }

  if (variant === 'text') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={handleToggleSave}
        disabled={isLoading}
        className={`gap-2 ${className}`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSaved ? (
          <>
            <BookmarkCheck className="h-4 w-4 text-blue-600" />
            <span>Saved</span>
          </>
        ) : (
          <>
            <Bookmark className="h-4 w-4" />
            <span>Save</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleToggleSave}
      disabled={isLoading}
      className={`gap-2 ${isSaved ? 'border-blue-200 bg-blue-50' : ''} ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSaved ? (
        <>
          <BookmarkCheck className="h-4 w-4 text-blue-600" />
          <span className="text-blue-700">Saved</span>
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4" />
          <span>Save</span>
        </>
      )}
    </Button>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Languages } from 'lucide-react';
import { toast } from 'sonner';

export default function FixTranslationsButton() {
  const [isFixing, setIsFixing] = useState(false);

  const handleFixTranslations = async () => {
    setIsFixing(true);
    try {
      const response = await fetch('/api/admin/fix-translations', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        toast.success(
          `Fixed ${result.fixed} language detections, cleared ${result.cleared} corrupted translations (${result.alreadyCorrect} already correct)`
        );
      } else {
        toast.error(result.error || 'Failed to fix translations');
      }
    } catch (error) {
      toast.error('Failed to fix translations');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="gap-2 dark:border-border dark:text-foreground dark:hover:bg-background"
      onClick={handleFixTranslations}
      disabled={isFixing}
    >
      {isFixing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
      {isFixing ? 'Fixing...' : 'Fix All Translations'}
    </Button>
  );
}

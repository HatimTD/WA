'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { waAcceptTerms } from '@/lib/actions/waUserActions';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

export default function ConfidentialityAgreementDialog() {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      const result = await waAcceptTerms();
      if (result.success) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to accept terms:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-wa-green-600" />
            <DialogTitle className="text-xl">Internal and controlled customer use</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            This platform contains confidential information belonging to Welding Alloys. It is provided for internal sales use and may be shared with customers only where needed to support the sale of Welding Alloys products and applications. You must not share, distribute, copy or reproduce any content outside Welding Alloys for any other purpose and you must not share it with competitors. Any customer sharing must be limited to the relevant people involved in the buying decision and treated as confidential.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-3 py-4 border-t border-b dark:border-border">
          <Checkbox
            id="agree-terms"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
          />
          <Label htmlFor="agree-terms" className="text-sm font-medium cursor-pointer leading-relaxed">
            I agree to the permitted use and confidentiality terms above.
          </Label>
        </div>
        <DialogFooter>
          <Button
            onClick={handleContinue}
            disabled={!agreed || isSubmitting}
            className="w-full bg-wa-green-600 hover:bg-wa-green-700"
          >
            {isSubmitting ? 'Processing...' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

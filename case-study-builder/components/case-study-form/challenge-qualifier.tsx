'use client';

/**
 * Challenge Qualifier Component
 *
 * Implements BRD 3.1 - Challenge Qualifier Logic
 * Determines if a case study counts toward the BHAG 10,000 target.
 *
 * Workflow:
 * 1. User selects customer
 * 2. Q1: "Has customer bought anything in last 3 years?"
 *    - NO → New Industrial Challenge (Target: Counted)
 *    - YES → Q2
 * 3. Q2: "Has customer bought THIS specific product before?"
 *    - NO → Cross-Sell Challenge (Target: Counted)
 *    - YES → Maintenance Update (Target: NOT Counted)
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle, Target, TrendingUp, Wrench, Sparkles } from 'lucide-react';
import Celebration from '@/components/ui/celebration';

export type QualifierResult = {
  qualifierType: 'NEW_CUSTOMER' | 'CROSS_SELL' | 'MAINTENANCE';
  isTarget: boolean;
  message: string;
  description: string;
};

type Props = {
  customerName: string;
  onComplete: (result: QualifierResult) => void;
  onReset?: () => void; // Called when user clicks "Re-evaluate"
  onBack?: () => void;
  // Initial values for restoring saved qualifier state
  initialQualifierType?: 'NEW_CUSTOMER' | 'CROSS_SELL' | 'MAINTENANCE';
  initialIsTarget?: boolean;
};

// Helper to create result object from qualifier type
function waCreateResultFromType(qualifierType: 'NEW_CUSTOMER' | 'CROSS_SELL' | 'MAINTENANCE', isTarget: boolean): QualifierResult {
  switch (qualifierType) {
    case 'NEW_CUSTOMER':
      return {
        qualifierType: 'NEW_CUSTOMER',
        isTarget: true,
        message: 'New Industrial Challenge',
        description: 'This customer has not purchased from Welding Alloys in the last 3 years. This case study will count toward the 10,000 Challenge target!'
      };
    case 'CROSS_SELL':
      return {
        qualifierType: 'CROSS_SELL',
        isTarget: true,
        message: 'Cross-Sell Challenge',
        description: 'This is a new product for an existing customer. This case study will count toward the 10,000 Challenge target!'
      };
    case 'MAINTENANCE':
      return {
        qualifierType: 'MAINTENANCE',
        isTarget: false,
        message: 'Knowledge Base Update',
        description: 'This is a maintenance update for an existing solution. While valuable for our knowledge base, it will not increment the strategic counter.'
      };
  }
}

export default function ChallengeQualifier({
  customerName,
  onComplete,
  onReset,
  onBack,
  initialQualifierType,
  initialIsTarget
}: Props) {
  // Initialize with saved state if available
  const [step, setStep] = useState<1 | 2 | 'complete'>(
    initialQualifierType ? 'complete' : 1
  );
  const [result, setResult] = useState<QualifierResult | null>(
    initialQualifierType ? waCreateResultFromType(initialQualifierType, initialIsTarget ?? false) : null
  );
  const [showCelebration, setShowCelebration] = useState(false);

  // Trigger celebration when a target result is achieved
  useEffect(() => {
    if (step === 'complete' && result?.isTarget) {
      setShowCelebration(true);
      // Reset after animation
      const timer = setTimeout(() => setShowCelebration(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [step, result]);

  const handleQuestion1 = (purchasedInLast3Years: boolean) => {
    if (!purchasedInLast3Years) {
      // New customer - counts toward target
      const res: QualifierResult = {
        qualifierType: 'NEW_CUSTOMER',
        isTarget: true,
        message: 'New Industrial Challenge',
        description: 'This customer has not purchased from Welding Alloys in the last 3 years. This case study will count toward the 10,000 Challenge target!'
      };
      setResult(res);
      setStep('complete');
      onComplete(res);
    } else {
      setStep(2);
    }
  };

  const handleQuestion2 = (boughtThisProductBefore: boolean) => {
    if (!boughtThisProductBefore) {
      // Cross-sell - counts toward target
      const res: QualifierResult = {
        qualifierType: 'CROSS_SELL',
        isTarget: true,
        message: 'Cross-Sell Challenge',
        description: 'This is a new product for an existing customer. This case study will count toward the 10,000 Challenge target!'
      };
      setResult(res);
      setStep('complete');
      onComplete(res);
    } else {
      // Maintenance - does NOT count
      const res: QualifierResult = {
        qualifierType: 'MAINTENANCE',
        isTarget: false,
        message: 'Knowledge Base Update',
        description: 'This is a maintenance update for an existing solution. While valuable for our knowledge base, it will not increment the strategic counter.'
      };
      setResult(res);
      setStep('complete');
      onComplete(res);
    }
  };

  const resetQualifier = () => {
    setStep(1);
    setResult(null);
    // Notify parent that qualifier is being re-evaluated
    if (onReset) {
      onReset();
    }
  };

  // Completed state
  if (step === 'complete' && result) {
    return (
      <>
        {/* Visual celebration for target achievements */}
        <Celebration trigger={showCelebration} type="confetti" duration={3000} />

        <Card className={
          result.isTarget
            ? 'border-green-500 bg-green-50 dark:bg-green-950/20 dark:border-green-700 relative overflow-hidden'
            : 'border-gray-300 bg-gray-50 dark:bg-gray-900/20 dark:border-gray-700'
        }>
          {/* Animated sparkle effect for target achievements */}
          {result.isTarget && (
            <div className="absolute top-2 right-2 animate-pulse">
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </div>
          )}
          <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${
              result.isTarget
                ? 'bg-green-100 dark:bg-green-900/50'
                : 'bg-gray-100 dark:bg-gray-800/50'
            }`}>
              {result.qualifierType === 'NEW_CUSTOMER' && (
                <Target className={`h-8 w-8 ${result.isTarget ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`} />
              )}
              {result.qualifierType === 'CROSS_SELL' && (
                <TrendingUp className={`h-8 w-8 ${result.isTarget ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`} />
              )}
              {result.qualifierType === 'MAINTENANCE' && (
                <Wrench className="h-8 w-8 text-gray-500 dark:text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {result.isTarget ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
                <p className={`font-semibold text-lg ${
                  result.isTarget
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-gray-700 dark:text-gray-200'
                }`}>
                  {result.message}
                </p>
              </div>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                {result.description}
              </p>
              {result.isTarget && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/50 rounded-full">
                  <Target className="h-4 w-4 text-green-700 dark:text-green-300" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Counts toward 10,000 target
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack}>
                Back
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={resetQualifier}>
              Re-evaluate
            </Button>
          </div>
        </CardContent>
      </Card>
      </>
    );
  }

  // Question flow
  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Target className="h-5 w-5" />
          Challenge Qualifier
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          Answer these questions to determine if this case study counts toward the 10,000 Challenge target.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-lg font-medium text-blue-900 dark:text-blue-100">
                Has <strong className="text-blue-600 dark:text-blue-300">{customerName || 'this customer'}</strong> purchased anything from Welding Alloys in the last 3 years?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                variant="outline"
                className="h-20 text-lg flex flex-col gap-1 border-green-300 hover:bg-green-50 hover:border-green-500 dark:border-green-700 dark:hover:bg-green-950/50"
                onClick={() => handleQuestion1(false)}
              >
                <XCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                <span>NO - New Customer</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-20 text-lg flex flex-col gap-1 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                onClick={() => handleQuestion1(true)}
              >
                <CheckCircle2 className="h-6 w-6 text-gray-500" />
                <span>YES - Existing</span>
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-lg font-medium text-blue-900 dark:text-blue-100">
                Has <strong className="text-blue-600 dark:text-blue-300">{customerName || 'this customer'}</strong> purchased <strong className="underline">this specific product or solution</strong> from WA before?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                variant="outline"
                className="h-20 text-lg flex flex-col gap-1 border-green-300 hover:bg-green-50 hover:border-green-500 dark:border-green-700 dark:hover:bg-green-950/50"
                onClick={() => handleQuestion2(false)}
              >
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                <span>NO - Cross-Sell</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-20 text-lg flex flex-col gap-1 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                onClick={() => handleQuestion2(true)}
              >
                <Wrench className="h-6 w-6 text-gray-500" />
                <span>YES - Existing Solution</span>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
              className="text-muted-foreground"
            >
              ← Back to previous question
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getQualityLevel, getQualityColor } from '@/lib/utils/case-quality';
import { CheckCircle2, AlertCircle, XCircle, Info } from 'lucide-react';

interface CompletionIndicatorProps {
  percentage: number;
  variant?: 'compact' | 'full' | 'badge';
  showTooltip?: boolean;
  missingFields?: string[];
  className?: string;
}

/**
 * CompletionIndicator Component
 * Displays the completion percentage of a case study with visual indicators
 */
export function CompletionIndicator({
  percentage,
  variant = 'compact',
  showTooltip = true,
  missingFields = [],
  className,
}: CompletionIndicatorProps) {
  const quality = getQualityLevel(percentage);
  const colors = getQualityColor(percentage);

  // Get icon based on quality level
  const getIcon = () => {
    switch (quality) {
      case 'low':
        return <XCircle className="h-3.5 w-3.5" />;
      case 'medium':
        return <AlertCircle className="h-3.5 w-3.5" />;
      case 'high':
        return <CheckCircle2 className="h-3.5 w-3.5" />;
    }
  };

  // Get progress bar color
  const getProgressColor = () => {
    switch (quality) {
      case 'low':
        return 'bg-red-500 dark:bg-red-600';
      case 'medium':
        return 'bg-yellow-500 dark:bg-yellow-600';
      case 'high':
        return 'bg-green-500 dark:bg-green-600';
    }
  };

  // Get quality label
  const getQualityLabel = () => {
    switch (quality) {
      case 'low':
        return 'Low Quality';
      case 'medium':
        return 'Medium Quality';
      case 'high':
        return 'High Quality';
    }
  };

  // Badge variant
  if (variant === 'badge') {
    const BadgeContent = (
      <Badge
        variant="outline"
        className={cn(
          'flex items-center gap-1.5 font-medium',
          colors.bg,
          colors.text,
          colors.border,
          className
        )}
      >
        {getIcon()}
        <span className="text-xs">{percentage}%</span>
      </Badge>
    );

    if (showTooltip && missingFields.length > 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{BadgeContent}</TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                <p className="font-semibold text-xs">Missing Fields:</p>
                <ul className="text-xs space-y-0.5 list-disc list-inside">
                  {missingFields.slice(0, 5).map((field, idx) => (
                    <li key={idx}>{field}</li>
                  ))}
                  {missingFields.length > 5 && (
                    <li className="text-muted-foreground">
                      +{missingFields.length - 5} more...
                    </li>
                  )}
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return BadgeContent;
  }

  // Compact variant (just progress bar and percentage)
  if (variant === 'compact') {
    const CompactContent = (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex-1 min-w-[60px]">
          <Progress
            value={percentage}
            className={cn('h-2 bg-gray-200 dark:bg-gray-800', `[&>div]:${getProgressColor()}`)}
          />
        </div>
        <span className={cn('text-xs font-medium tabular-nums min-w-[32px]', colors.text)}>
          {percentage}%
        </span>
      </div>
    );

    if (showTooltip && missingFields.length > 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">{CompactContent}</div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                <p className="font-semibold text-xs flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {getQualityLabel()} - Missing Fields:
                </p>
                <ul className="text-xs space-y-0.5 list-disc list-inside">
                  {missingFields.slice(0, 5).map((field, idx) => (
                    <li key={idx}>{field}</li>
                  ))}
                  {missingFields.length > 5 && (
                    <li className="text-muted-foreground">
                      +{missingFields.length - 5} more...
                    </li>
                  )}
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return CompactContent;
  }

  // Full variant (with label, icon, and more details)
  const FullContent = (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('flex items-center gap-1.5', colors.text)}>
            {getIcon()}
            <span className="text-sm font-medium">{getQualityLabel()}</span>
          </div>
        </div>
        <span className={cn('text-sm font-bold tabular-nums', colors.text)}>
          {percentage}%
        </span>
      </div>
      <Progress
        value={percentage}
        className={cn('h-3 bg-gray-200 dark:bg-gray-800', `[&>div]:${getProgressColor()}`)}
      />
      {missingFields.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {missingFields.length} field{missingFields.length !== 1 ? 's' : ''} to improve quality
        </p>
      )}
    </div>
  );

  if (showTooltip && missingFields.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">{FullContent}</div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold text-xs">Missing Fields:</p>
              <ul className="text-xs space-y-0.5 list-disc list-inside">
                {missingFields.slice(0, 8).map((field, idx) => (
                  <li key={idx}>{field}</li>
                ))}
                {missingFields.length > 8 && (
                  <li className="text-muted-foreground">
                    +{missingFields.length - 8} more...
                  </li>
                )}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return FullContent;
}

/**
 * Circular Progress Indicator
 * Alternative circular variant for dashboard cards
 */
export function CircularCompletionIndicator({
  percentage,
  size = 60,
  strokeWidth = 6,
  className,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const quality = getQualityLevel(percentage);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getStrokeColor = () => {
    switch (quality) {
      case 'low':
        return 'stroke-red-500';
      case 'medium':
        return 'stroke-yellow-500';
      case 'high':
        return 'stroke-green-500';
    }
  };

  const colors = getQualityColor(percentage);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(getStrokeColor(), 'transition-all duration-300')}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-sm font-bold tabular-nums', colors.text)}>
          {percentage}%
        </span>
      </div>
    </div>
  );
}

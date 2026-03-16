'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp } from 'lucide-react';

type RegionData = {
  region: string;
  uniqueCount: number;
};

type IndustryData = {
  industry: string;
  uniqueCount: number;
};

type ExpandableRegionSectionProps = {
  data: RegionData[];
  initialCount?: number;
  variant?: 'region' | 'contributorRegion';
};

type ExpandableIndustrySectionProps = {
  data: IndustryData[];
  initialCount?: number;
  totalUnique: number;
};

export function ExpandableRegionSection({
  data,
  initialCount = 8,
  variant = 'region'
}: ExpandableRegionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayData = isExpanded ? data : data.slice(0, initialCount);
  const hasMore = data.length > initialCount;

  const colorClasses = variant === 'contributorRegion'
    ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700 text-purple-700 dark:text-purple-300 text-purple-600 dark:text-purple-400'
    : 'bg-gray-50 border-gray-200 dark:bg-background dark:border-border text-gray-700 dark:text-foreground text-wa-green-600 dark:text-primary';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayData.map((region) => (
          <div
            key={region.region}
            className={`rounded-lg p-4 border ${
              variant === 'contributorRegion'
                ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700'
                : 'bg-gray-50 border-gray-200 dark:bg-background dark:border-border'
            }`}
          >
            <p className={`text-sm font-medium mb-1 ${
              variant === 'contributorRegion'
                ? 'text-purple-700 dark:text-purple-300'
                : 'text-gray-700 dark:text-foreground'
            }`}>
              {region.region}
            </p>
            <p className={`text-2xl font-bold ${
              variant === 'contributorRegion'
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-wa-green-600 dark:text-primary'
            }`}>
              {region.uniqueCount}
            </p>
            <p className="text-xs text-gray-500 dark:text-muted-foreground">unique cases</p>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show {data.length - initialCount} More Regions
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export function ExpandableIndustrySection({
  data,
  initialCount = 10,
  totalUnique
}: ExpandableIndustrySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayData = isExpanded ? data : data.slice(0, initialCount);
  const hasMore = data.length > initialCount;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {displayData.map((industry, index) => (
          <div key={industry.industry} className="flex items-center gap-4">
            <div className="w-8 text-center font-bold text-gray-400 dark:text-muted-foreground">
              #{index + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium dark:text-foreground">{industry.industry}</p>
                <p className="text-sm font-bold text-wa-green-600 dark:text-primary">
                  {industry.uniqueCount}
                </p>
              </div>
              <Progress
                value={(industry.uniqueCount / totalUnique) * 100}
                className="h-2"
              />
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show {data.length - initialCount} More Industries
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Default export for backwards compatibility
export default function BhagExpandableSection() {
  return null;
}

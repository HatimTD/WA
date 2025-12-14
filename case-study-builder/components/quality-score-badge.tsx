'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Star,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import {
  calculateQualityScore,
  getQualityScoreColor,
  getQualityScoreLabel,
  type QualityScoreResult,
  type CaseStudyWithRelations,
} from '@/lib/utils/quality-score';

type Props = {
  caseStudy: CaseStudyWithRelations;
  showDetails?: boolean;
  compact?: boolean;
};

export default function QualityScoreBadge({ caseStudy, showDetails = true, compact = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const score = calculateQualityScore(caseStudy);

  const gradeColors: Record<QualityScoreResult['grade'], string> = {
    'A': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    'B': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    'C': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    'D': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    'F': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  };

  const progressColors: Record<QualityScoreResult['grade'], string> = {
    'A': 'bg-green-500',
    'B': 'bg-blue-500',
    'C': 'bg-yellow-500',
    'D': 'bg-orange-500',
    'F': 'bg-red-500',
  };

  if (compact) {
    return (
      <Badge className={`${gradeColors[score.grade]} font-semibold`}>
        {score.grade} ({score.totalScore}%)
      </Badge>
    );
  }

  const BadgeContent = (
    <Badge
      className={`${gradeColors[score.grade]} font-semibold cursor-pointer hover:opacity-80 transition-opacity`}
    >
      <Star className="w-3 h-3 mr-1" />
      Quality: {score.grade} ({score.totalScore}%)
    </Badge>
  );

  if (!showDetails) {
    return BadgeContent;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {BadgeContent}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-lg flex items-center gap-2">
                Quality Score
                <span className={`text-2xl font-bold ${
                  score.grade === 'A' ? 'text-green-600' :
                  score.grade === 'B' ? 'text-blue-600' :
                  score.grade === 'C' ? 'text-yellow-600' :
                  score.grade === 'D' ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {score.grade}
                </span>
              </h4>
              <p className="text-sm text-muted-foreground">
                {getQualityScoreLabel(score.grade)} - {score.totalScore}/100 points
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Score</span>
              <span className="font-medium">{score.totalScore}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${progressColors[score.grade]} transition-all duration-500`}
                style={{ width: `${score.totalScore}%` }}
              />
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Score Breakdown
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Problem Detail</span>
                <span className="font-medium">{score.breakdown.problemDescription}/20</span>
              </div>
              <div className="flex justify-between">
                <span>Solution Detail</span>
                <span className="font-medium">{score.breakdown.solutionDetail}/20</span>
              </div>
              <div className="flex justify-between">
                <span>Visual Docs</span>
                <span className="font-medium">{score.breakdown.visualDocumentation}/20</span>
              </div>
              <div className="flex justify-between">
                <span>Cost Analysis</span>
                <span className="font-medium">{score.breakdown.costAnalysis}/20</span>
              </div>
              <div className="flex justify-between">
                <span>Searchability</span>
                <span className="font-medium">{score.breakdown.searchability}/10</span>
              </div>
              <div className="flex justify-between">
                <span>Technical Depth</span>
                <span className="font-medium">{score.breakdown.technicalDepth}/10</span>
              </div>
            </div>
          </div>

          {/* Strengths */}
          {score.strengths.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                Strengths
              </h5>
              <ul className="text-xs space-y-1">
                {score.strengths.map((strength, i) => (
                  <li key={i} className="flex items-center gap-1 text-muted-foreground">
                    <ChevronRight className="w-3 h-3 text-green-500" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {score.recommendations.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium flex items-center gap-1 text-orange-600">
                <AlertCircle className="w-4 h-4" />
                Improve Score
              </h5>
              <ul className="text-xs space-y-1">
                {score.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-1 text-muted-foreground">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-orange-500 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

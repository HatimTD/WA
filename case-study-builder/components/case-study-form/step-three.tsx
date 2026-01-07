'use client';

import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CaseStudyFormData } from '@/app/dashboard/new/page';
import dynamic from 'next/dynamic';
import { Mic, Sparkles } from 'lucide-react';

// Dynamic imports for heavy components (saves ~150KB)
const VoiceInput = dynamic(() => import('@/components/voice-input'), {
  loading: () => (
    <button className="p-2 rounded-lg border border-border bg-muted/50 opacity-50 cursor-not-allowed">
      <Mic className="h-4 w-4 text-muted-foreground" />
    </button>
  ),
});

const AITextAssistant = dynamic(() => import('@/components/ai-text-assistant'), {
  loading: () => (
    <button className="p-2 rounded-lg border border-border bg-muted/50 opacity-50 cursor-not-allowed">
      <Sparkles className="h-4 w-4 text-muted-foreground" />
    </button>
  ),
});

type Props = {
  formData: CaseStudyFormData;
  updateFormData: (data: Partial<CaseStudyFormData>) => void;
};

export default function StepThree({ formData, updateFormData }: Props) {
  return (
    <div className="space-y-6">
      {/* Problem Description */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="problemDescription" className="dark:text-foreground">
            Problem Description <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <div className="flex gap-2">
            <VoiceInput
              currentValue={formData.problemDescription}
              onTranscript={(text) => updateFormData({ problemDescription: text })}
            />
            <AITextAssistant
              text={formData.problemDescription}
              onTextChange={(text) => updateFormData({ problemDescription: text })}
              fieldType="problem"
            />
          </div>
        </div>
        <Textarea
          id="problemDescription"
          value={formData.problemDescription}
          onChange={(e) => updateFormData({ problemDescription: e.target.value })}
          placeholder="Describe the challenge the customer was facing..."
          className="min-h-[120px] dark:bg-input dark:border-border dark:text-foreground"
          required
        />
        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
          Describe the wear issue, operational challenges, or failures experienced
        </p>
      </div>

      {/* Previous Solution - BRD 3.3 Required */}
      <div className="space-y-2">
        <Label htmlFor="previousSolution" className="dark:text-foreground">
          Previous Solution <span className="text-red-500 dark:text-red-400">*</span>
        </Label>
        <Input
          id="previousSolution"
          value={formData.previousSolution}
          onChange={(e) => updateFormData({ previousSolution: e.target.value })}
          placeholder="e.g., Competitor product or previous material"
          className="dark:bg-input dark:border-border dark:text-foreground"
          required
        />
        <p className="text-xs text-muted-foreground">
          What was used before the WA solution was implemented
        </p>
      </div>

      {/* Previous Service Life - with scale selector */}
      <div className="space-y-2">
        <Label className="dark:text-foreground">Previous Service Life</Label>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              value={formData.previousServiceLifeHours || ''}
              onChange={(e) => updateFormData({ previousServiceLifeHours: e.target.value })}
              placeholder="0"
              className="w-16 text-center dark:bg-input dark:border-border dark:text-foreground"
            />
            <span className="text-sm text-muted-foreground font-medium">h</span>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              value={formData.previousServiceLifeDays || ''}
              onChange={(e) => updateFormData({ previousServiceLifeDays: e.target.value })}
              placeholder="0"
              className="w-16 text-center dark:bg-input dark:border-border dark:text-foreground"
            />
            <span className="text-sm text-muted-foreground font-medium">d</span>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              value={formData.previousServiceLifeWeeks || ''}
              onChange={(e) => updateFormData({ previousServiceLifeWeeks: e.target.value })}
              placeholder="0"
              className="w-16 text-center dark:bg-input dark:border-border dark:text-foreground"
            />
            <span className="text-sm text-muted-foreground font-medium">w</span>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              value={formData.previousServiceLifeMonths || ''}
              onChange={(e) => updateFormData({ previousServiceLifeMonths: e.target.value })}
              placeholder="0"
              className="w-16 text-center dark:bg-input dark:border-border dark:text-foreground"
            />
            <span className="text-sm text-muted-foreground font-medium">m</span>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              value={formData.previousServiceLifeYears || ''}
              onChange={(e) => updateFormData({ previousServiceLifeYears: e.target.value })}
              placeholder="0"
              className="w-16 text-center dark:bg-input dark:border-border dark:text-foreground"
            />
            <span className="text-sm text-muted-foreground font-medium">y</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          How long did the old solution last before needing replacement
        </p>
      </div>

      {/* Old Solution Job Duration */}
      <div className="space-y-2">
        <Label className="dark:text-foreground">Old Solution Job Duration</Label>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              value={formData.oldJobDurationHours || ''}
              onChange={(e) => updateFormData({ oldJobDurationHours: e.target.value })}
              placeholder="0"
              className="w-16 text-center dark:bg-input dark:border-border dark:text-foreground"
            />
            <span className="text-sm text-muted-foreground font-medium">h</span>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              value={formData.oldJobDurationDays || ''}
              onChange={(e) => updateFormData({ oldJobDurationDays: e.target.value })}
              placeholder="0"
              className="w-16 text-center dark:bg-input dark:border-border dark:text-foreground"
            />
            <span className="text-sm text-muted-foreground font-medium">d</span>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              value={formData.oldJobDurationWeeks || ''}
              onChange={(e) => updateFormData({ oldJobDurationWeeks: e.target.value })}
              placeholder="0"
              className="w-16 text-center dark:bg-input dark:border-border dark:text-foreground"
            />
            <span className="text-sm text-muted-foreground font-medium">w</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          How long did the repair/maintenance work take with the old solution
        </p>
      </div>

      {/* Competitor Name */}
      <div className="space-y-2">
        <Label htmlFor="competitorName" className="dark:text-foreground">Competitor Name (if applicable)</Label>
        <Input
          id="competitorName"
          value={formData.competitorName}
          onChange={(e) => updateFormData({ competitorName: e.target.value })}
          placeholder="e.g., Brand X"
          className="dark:bg-input dark:border-border dark:text-foreground"
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-orange-900/20 dark:border-orange-700">
        <h4 className="font-semibold text-yellow-900 mb-2 dark:text-foreground">Tips for a Good Problem Description</h4>
        <ul className="space-y-1 text-sm text-yellow-800 list-disc list-inside dark:text-muted-foreground">
          <li>Be specific about the wear mechanism (abrasion, impact, etc.)</li>
          <li>Mention the operational environment and conditions</li>
          <li>Include any failure patterns or frequency</li>
          <li>Describe the business impact (downtime, costs, safety)</li>
        </ul>
      </div>
    </div>
  );
}

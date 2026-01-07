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

export default function StepFour({ formData, updateFormData }: Props) {
  return (
    <div className="space-y-6">
      {/* WA Solution */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="waSolution" className="dark:text-foreground">
            WA Solution Description <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <div className="flex gap-2">
            <VoiceInput
              currentValue={formData.waSolution}
              onTranscript={(text) => updateFormData({ waSolution: text })}
            />
            <AITextAssistant
              text={formData.waSolution}
              onTextChange={(text) => updateFormData({ waSolution: text })}
              fieldType="solution"
            />
          </div>
        </div>
        <Textarea
          id="waSolution"
          value={formData.waSolution}
          onChange={(e) => updateFormData({ waSolution: e.target.value })}
          placeholder="Describe the Welding Alloys solution implemented..."
          className="min-h-[120px] dark:bg-input dark:border-border dark:text-foreground"
          required
        />
        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
          Explain what WA recommended and how it was implemented
        </p>
      </div>

      {/* WA Product */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="waProduct" className="dark:text-foreground">
            WA Product Used <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <Input
            id="waProduct"
            value={formData.waProduct}
            onChange={(e) => updateFormData({ waProduct: e.target.value })}
            placeholder="e.g., Maxim 400, ENDURA 380"
            className="dark:bg-input dark:border-border dark:text-foreground"
            required
          />
        </div>

        {/* Wire Diameter */}
        <div className="space-y-2">
          <Label htmlFor="waProductDiameter" className="dark:text-foreground">
            Wire Diameter
          </Label>
          <Input
            id="waProductDiameter"
            value={formData.waProductDiameter}
            onChange={(e) => updateFormData({ waProductDiameter: e.target.value })}
            placeholder={formData.unitSystem === 'IMPERIAL' ? 'e.g., 0.063in' : 'e.g., 1.6mm'}
            className="dark:bg-input dark:border-border dark:text-foreground"
          />
          <p className="text-xs text-muted-foreground">
            {formData.unitSystem === 'IMPERIAL' ? 'Enter in inches (in)' : 'Enter in millimeters (mm)'}
          </p>
        </div>
      </div>

      {/* Technical Advantages - BRD 3.3 Required */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="technicalAdvantages" className="dark:text-foreground">
            Technical Advantages <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <div className="flex gap-2">
            <VoiceInput
              currentValue={formData.technicalAdvantages}
              onTranscript={(text) => updateFormData({ technicalAdvantages: text })}
            />
            <AITextAssistant
              text={formData.technicalAdvantages}
              onTextChange={(text) => updateFormData({ technicalAdvantages: text })}
              fieldType="technical"
            />
          </div>
        </div>
        <Textarea
          id="technicalAdvantages"
          value={formData.technicalAdvantages}
          onChange={(e) => updateFormData({ technicalAdvantages: e.target.value })}
          placeholder="Describe key technical benefits (hardness, toughness, weldability, etc.)"
          className="min-h-[100px] dark:bg-input dark:border-border dark:text-foreground"
          required
        />
        <p className="text-xs text-muted-foreground">
          Why the WA solution is technically superior (e.g., hardness, wear resistance, weldability)
        </p>
      </div>

      {/* Expected/Achieved Service Life - with scale selector */}
      <div className="space-y-2">
        <Label className="dark:text-foreground">Expected/Achieved Service Life</Label>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              value={formData.expectedServiceLifeHours || ''}
              onChange={(e) => updateFormData({ expectedServiceLifeHours: e.target.value })}
              placeholder="0"
              className="w-16 text-center dark:bg-input dark:border-border dark:text-foreground"
            />
            <span className="text-sm text-muted-foreground font-medium">h</span>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              value={formData.expectedServiceLifeDays || ''}
              onChange={(e) => updateFormData({ expectedServiceLifeDays: e.target.value })}
              placeholder="0"
              className="w-16 text-center dark:bg-input dark:border-border dark:text-foreground"
            />
            <span className="text-sm text-muted-foreground font-medium">d</span>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              value={formData.expectedServiceLifeWeeks || ''}
              onChange={(e) => updateFormData({ expectedServiceLifeWeeks: e.target.value })}
              placeholder="0"
              className="w-16 text-center dark:bg-input dark:border-border dark:text-foreground"
            />
            <span className="text-sm text-muted-foreground font-medium">w</span>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              value={formData.expectedServiceLifeMonths || ''}
              onChange={(e) => updateFormData({ expectedServiceLifeMonths: e.target.value })}
              placeholder="0"
              className="w-16 text-center dark:bg-input dark:border-border dark:text-foreground"
            />
            <span className="text-sm text-muted-foreground font-medium">m</span>
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              value={formData.expectedServiceLifeYears || ''}
              onChange={(e) => updateFormData({ expectedServiceLifeYears: e.target.value })}
              placeholder="0"
              className="w-16 text-center dark:bg-input dark:border-border dark:text-foreground"
            />
            <span className="text-sm text-muted-foreground font-medium">y</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Expected or achieved service life with the WA solution
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-accent dark:border-primary">
        <h4 className="font-semibold text-green-900 mb-2 dark:text-foreground">Great Solution Descriptions Include:</h4>
        <ul className="space-y-1 text-sm text-green-800 list-disc list-inside dark:text-muted-foreground">
          <li>Specific WA product and process used</li>
          <li>Technical specifications (hardness, layers, etc.)</li>
          <li>Implementation approach (workshop vs on-site)</li>
          <li>Measurable results and improvements</li>
        </ul>
      </div>
    </div>
  );
}

'use client';

import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CaseStudyFormData } from '@/app/dashboard/new/page';
import dynamic from 'next/dynamic';
import { Mic, Sparkles, Plus, X } from 'lucide-react';
import { useMasterList } from '@/lib/hooks/use-master-list';
import { InteractiveWearTypeBar } from '@/components/wear-type-progress-bar';

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

// Default wear types - actual values come from master data and can include custom types
const FALLBACK_WEAR_TYPES = [
  { id: 'abrasion', value: 'ABRASION', label: 'Abrasion', sortOrder: 0 },
  { id: 'impact', value: 'IMPACT', label: 'Impact', sortOrder: 1 },
  { id: 'corrosion', value: 'CORROSION', label: 'Corrosion', sortOrder: 2 },
  { id: 'temperature', value: 'TEMPERATURE', label: 'Temperature', sortOrder: 3 },
  { id: 'metal_metal', value: 'METAL_METAL', label: 'Metal-Metal', sortOrder: 4 },
];

export default function StepThree({ formData, updateFormData }: Props) {
  // Fetch wear types from master list
  const { items: wearTypes, isLoading: wearTypesLoading } = useMasterList('WearType', FALLBACK_WEAR_TYPES);

  // Filter out Combination from wear types
  const filteredWearTypes = wearTypes.filter(wear => wear.value.toUpperCase() !== 'COMBINATION');

  return (
    <div className="space-y-6">
      {/* Problem description */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="problemDescription" className="dark:text-foreground">
            Problem description <span className="text-red-500 dark:text-red-400">*</span>
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
          placeholder="Describe the problem and previous solution used before WA..."
          className="min-h-[120px] dark:bg-input dark:border-border dark:text-foreground"
          required
        />
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

      {/* Type of Wear - Interactive progress bars (moved to last) */}
      <div className="space-y-2">
        <Label className="dark:text-foreground flex items-center gap-1.5 text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Type of Wear <span className="text-red-500 dark:text-red-400">*</span>
        </Label>

        {wearTypesLoading ? (
          <span className="text-xs text-muted-foreground">Loading...</span>
        ) : (
          <div style={{ display: 'inline-block' }}>
            {filteredWearTypes.map((wear) => {
              // Change High Temperature to Temperature in display
              let displayLabel = (wear as any).label || wear.value;
              if (displayLabel === 'High Temperature') {
                displayLabel = 'Temperature';
              }
              const severity = formData.wearSeverities?.[wear.value.toUpperCase()] || 0;
              const wearKey = wear.value.toUpperCase();

              return (
                <InteractiveWearTypeBar
                  key={wear.id}
                  label={displayLabel}
                  value={severity}
                  maxValue={6}
                  onChange={(newSeverity) => {
                    const newSeverities = { ...formData.wearSeverities };

                    if (newSeverity === 0) {
                      delete newSeverities[wearKey];
                      updateFormData({
                        wearType: (formData.wearType || []).filter(w => w.toUpperCase() !== wearKey),
                        wearSeverities: newSeverities
                      });
                    } else {
                      const currentTypes = formData.wearType || [];
                      const hasType = currentTypes.some(w => w.toUpperCase() === wearKey);
                      updateFormData({
                        wearType: hasType ? currentTypes : [...currentTypes, wearKey],
                        wearSeverities: { ...newSeverities, [wearKey]: newSeverity }
                      });
                    }
                  }}
                />
              );
            })}

            {/* Other wear types - multiple entries with fixed alignment */}
            {(formData.wearTypeOthers || []).map((other, index) => (
              <div
                key={index}
                className="flex items-center gap-1 mb-1 font-sans"
              >
                <input
                  placeholder="Other..."
                  value={other.name}
                  onChange={(e) => {
                    const newOthers = [...(formData.wearTypeOthers || [])];
                    newOthers[index] = { ...newOthers[index], name: e.target.value };
                    updateFormData({ wearTypeOthers: newOthers });
                  }}
                  className="text-xs w-28 h-5 px-1 border border-border rounded flex-shrink-0 bg-input text-foreground"
                />
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6].map((level) => {
                    const isFilled = level <= other.severity;
                    return (
                      <button
                        key={level}
                        type="button"
                        className={`no-min-touch transition-colors ${
                          isFilled
                            ? 'bg-wa-green-600 hover:bg-wa-green-500'
                            : 'bg-gray-300 dark:bg-gray-600 hover:bg-wa-green-200 dark:hover:bg-wa-green-800'
                        }`}
                        onClick={() => {
                          const newOthers = [...(formData.wearTypeOthers || [])];
                          newOthers[index] = {
                            ...newOthers[index],
                            severity: other.severity === level ? 0 : level
                          };
                          updateFormData({ wearTypeOthers: newOthers });
                        }}
                        style={{
                          width: 22,
                          height: 8,
                          minWidth: 22,
                          minHeight: 8,
                          maxWidth: 22,
                          maxHeight: 8,
                          border: 'none',
                          padding: 0,
                          margin: 0,
                          cursor: 'pointer',
                        }}
                        aria-label={`${other.name || 'Other'} severity ${level}`}
                      />
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="no-min-touch ml-1 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const newOthers = (formData.wearTypeOthers || []).filter((_, i) => i !== index);
                    updateFormData({ wearTypeOthers: newOthers });
                  }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  aria-label="Remove other wear type"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add Other button */}
            <button
              type="button"
              onClick={() => {
                const newOthers = [...(formData.wearTypeOthers || []), { name: '', severity: 0 }];
                updateFormData({ wearTypeOthers: newOthers });
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add other</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

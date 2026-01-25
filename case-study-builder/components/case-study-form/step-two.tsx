'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CaseStudyFormData } from '@/app/dashboard/new/page';
import LocationAutocomplete from '@/components/location-autocomplete';
import { Mic, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';

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

export default function StepTwo({ formData, updateFormData }: Props) {
  return (
    <div className="space-y-6">
      {/* Industrial Challenge Title - Full width */}
      <div className="space-y-2">
        <Label htmlFor="title" className="dark:text-foreground">
          Industrial challenge title <span className="text-red-500 dark:text-red-400">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          placeholder="e.g., Crusher Hammer Rebuild - ABC Mining"
          className="dark:bg-input dark:border-border dark:text-foreground"
          required
        />
      </div>

      {/* General Description - with AI and voice features */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="generalDescription" className="dark:text-foreground">
            General description <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <div className="flex gap-2">
            <VoiceInput
              currentValue={formData.generalDescription || ''}
              onTranscript={(text) => updateFormData({ generalDescription: text })}
            />
            <AITextAssistant
              text={formData.generalDescription || ''}
              onTextChange={(text) => updateFormData({ generalDescription: text })}
              fieldType="general"
            />
          </div>
        </div>
        <Textarea
          id="generalDescription"
          value={formData.generalDescription || ''}
          onChange={(e) => updateFormData({ generalDescription: e.target.value })}
          placeholder="Briefly describe the application and context, the equipment, how it is used, what it is used for, the type of wear and abrasive, etc."
          className="min-h-[100px] dark:bg-input dark:border-border dark:text-foreground"
          required
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Location - Google Places Autocomplete */}
        <LocationAutocomplete
          value={formData.location}
          onChange={(value) => updateFormData({ location: value })}
          onPlaceSelect={(place) => {
            updateFormData({
              location: place.city || place.fullAddress,
              country: place.country || formData.country,
            });
          }}
          label="Location (City/Plant)"
          required
          placeholder="Search for a city..."
        />

        {/* Country - Auto-filled from location selection */}
        <div className="space-y-2">
          <Label htmlFor="country" className="dark:text-foreground">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => updateFormData({ country: e.target.value })}
            placeholder="Auto-filled from location or enter manually"
            className="dark:bg-input dark:border-border dark:text-foreground"
          />
        </div>

        {/* Component/Workpiece */}
        <div className="space-y-2">
          <Label htmlFor="componentWorkpiece" className="dark:text-foreground">
            Component/Workpiece <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <Input
            id="componentWorkpiece"
            value={formData.componentWorkpiece}
            onChange={(e) => updateFormData({ componentWorkpiece: e.target.value })}
            placeholder="e.g., Crusher Hammers"
            className="dark:bg-input dark:border-border dark:text-foreground"
            required
          />
        </div>

        {/* Work Type */}
        <div className="space-y-2">
          <Label htmlFor="workType" className="dark:text-foreground">
            Work Type <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <Select value={formData.workType} onValueChange={(value) => updateFormData({ workType: value as any })}>
            <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
              <SelectValue placeholder="Select work type" />
            </SelectTrigger>
            <SelectContent className="dark:bg-popover dark:border-border">
              <SelectItem value="WORKSHOP">Workshop</SelectItem>
              <SelectItem value="ON_SITE">On Site</SelectItem>
              <SelectItem value="BOTH">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Job Type - Preventive, Corrective, etc. */}
        <div className="space-y-2">
          <Label htmlFor="jobType" className="dark:text-foreground">
            Job Type <span className="text-red-500 dark:text-red-400">*</span>
          </Label>
          <Select
            value={formData.jobType}
            onValueChange={(value) => {
              updateFormData({ jobType: value as any });
              if (value !== 'OTHER') {
                updateFormData({ jobTypeOther: '' });
              }
            }}
          >
            <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
              <SelectValue placeholder="Select job type" />
            </SelectTrigger>
            <SelectContent className="dark:bg-popover dark:border-border">
              <SelectItem value="PREVENTIVE">Preventive</SelectItem>
              <SelectItem value="CORRECTIVE">Repair</SelectItem>
              <SelectItem value="IMPROVEMENT">New</SelectItem>
              <SelectItem value="OTHER">Other (specify)</SelectItem>
            </SelectContent>
          </Select>
          {formData.jobType === 'OTHER' && (
            <Input
              placeholder="Enter custom job type..."
              value={formData.jobTypeOther}
              onChange={(e) => updateFormData({ jobTypeOther: e.target.value })}
              className="mt-2 dark:bg-input dark:border-border dark:text-foreground"
              autoFocus
            />
          )}
        </div>

        {/* OEM - Original Equipment Manufacturer (BRD Section 5) */}
        <div className="space-y-2">
          <Label htmlFor="oem" className="dark:text-foreground">OEM (Original Equipment Manufacturer)</Label>
          <Input
            id="oem"
            value={formData.oem}
            onChange={(e) => updateFormData({ oem: e.target.value })}
            placeholder="e.g., Caterpillar, Komatsu, Liebherr"
            className="dark:bg-input dark:border-border dark:text-foreground"
          />
        </div>

      </div>
    </div>
  );
}

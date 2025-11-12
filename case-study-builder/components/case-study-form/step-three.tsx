import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CaseStudyFormData } from '@/app/dashboard/new/page';
import VoiceInput from '@/components/voice-input';
import AITextAssistant from '@/components/ai-text-assistant';

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
          <Label htmlFor="problemDescription">
            Problem Description <span className="text-red-500">*</span>
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
          className="min-h-[120px]"
          required
        />
        <p className="text-xs text-muted-foreground">
          Describe the wear issue, operational challenges, or failures experienced
        </p>
      </div>

      {/* Previous Solution */}
      <div className="space-y-2">
        <Label htmlFor="previousSolution">Previous Solution</Label>
        <Input
          id="previousSolution"
          value={formData.previousSolution}
          onChange={(e) => updateFormData({ previousSolution: e.target.value })}
          placeholder="e.g., Competitor product or previous material"
        />
      </div>

      {/* Previous Service Life */}
      <div className="space-y-2">
        <Label htmlFor="previousServiceLife">Previous Service Life</Label>
        <Input
          id="previousServiceLife"
          value={formData.previousServiceLife}
          onChange={(e) => updateFormData({ previousServiceLife: e.target.value })}
          placeholder="e.g., 500 hours, 3 months"
        />
      </div>

      {/* Competitor Name */}
      <div className="space-y-2">
        <Label htmlFor="competitorName">Competitor Name (if applicable)</Label>
        <Input
          id="competitorName"
          value={formData.competitorName}
          onChange={(e) => updateFormData({ competitorName: e.target.value })}
          placeholder="e.g., Brand X"
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2">Tips for a Good Problem Description</h4>
        <ul className="space-y-1 text-sm text-yellow-800 list-disc list-inside">
          <li>Be specific about the wear mechanism (abrasion, impact, etc.)</li>
          <li>Mention the operational environment and conditions</li>
          <li>Include any failure patterns or frequency</li>
          <li>Describe the business impact (downtime, costs, safety)</li>
        </ul>
      </div>
    </div>
  );
}

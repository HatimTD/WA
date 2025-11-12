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

export default function StepFour({ formData, updateFormData }: Props) {
  return (
    <div className="space-y-6">
      {/* WA Solution */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="waSolution">
            WA Solution Description <span className="text-red-500">*</span>
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
          className="min-h-[120px]"
          required
        />
        <p className="text-xs text-muted-foreground">
          Explain what WA recommended and how it was implemented
        </p>
      </div>

      {/* WA Product */}
      <div className="space-y-2">
        <Label htmlFor="waProduct">
          WA Product Used <span className="text-red-500">*</span>
        </Label>
        <Input
          id="waProduct"
          value={formData.waProduct}
          onChange={(e) => updateFormData({ waProduct: e.target.value })}
          placeholder="e.g., Maxim 400, ENDURA 380"
          required
        />
      </div>

      {/* Technical Advantages */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="technicalAdvantages">Technical Advantages</Label>
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
          className="min-h-[100px]"
        />
      </div>

      {/* Expected Service Life */}
      <div className="space-y-2">
        <Label htmlFor="expectedServiceLife">Expected/Achieved Service Life</Label>
        <Input
          id="expectedServiceLife"
          value={formData.expectedServiceLife}
          onChange={(e) => updateFormData({ expectedServiceLife: e.target.value })}
          placeholder="e.g., 2000 hours, 12 months"
        />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-2">Great Solution Descriptions Include:</h4>
        <ul className="space-y-1 text-sm text-green-800 list-disc list-inside">
          <li>Specific WA product and process used</li>
          <li>Technical specifications (hardness, layers, etc.)</li>
          <li>Implementation approach (workshop vs on-site)</li>
          <li>Measurable results and improvements</li>
        </ul>
      </div>
    </div>
  );
}

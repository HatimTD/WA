import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CaseStudyFormData } from '@/app/dashboard/new/page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Upload, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/image-upload';
import DocumentUpload from '@/components/document-upload';
import CostCalculator from '@/components/cost-calculator';

type Props = {
  formData: CaseStudyFormData;
  updateFormData: (data: Partial<CaseStudyFormData>) => void;
  caseStudyId?: string; // Optional: only provided in edit mode
  existingCostCalc?: {
    materialCostBefore: number;
    materialCostAfter: number;
    laborCostBefore: number;
    laborCostAfter: number;
    downtimeCostBefore: number;
    downtimeCostAfter: number;
    maintenanceFrequencyBefore: number;
    maintenanceFrequencyAfter: number;
  };
};

export default function StepFive({ formData, updateFormData, caseStudyId, existingCostCalc }: Props) {
  return (
    <div className="space-y-6">
      {/* Cost Reduction Calculator - Only for STAR cases in edit mode */}
      {formData.type === 'STAR' && caseStudyId && (
        <CostCalculator
          caseStudyId={caseStudyId}
          existingData={existingCostCalc}
        />
      )}

      {/* Info message for STAR cases in create mode */}
      {formData.type === 'STAR' && !caseStudyId && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Note:</span> The Cost Reduction Calculator will be available after saving this case study. You'll be able to add detailed cost analysis in the edit view.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Media Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Images & Documents
          </CardTitle>
          <CardDescription>
            Upload photos, videos, or supporting documents
            {formData.type === 'STAR' && ' (Required for Star cases)'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Images</Label>
            <ImageUpload
              onImagesChange={(images) => updateFormData({ images })}
              existingImages={formData.images}
              maxImages={5}
            />
          </div>

          <div className="space-y-2">
            <Label>Supporting Documents</Label>
            <DocumentUpload
              onDocumentsChange={(documents) => updateFormData({ supportingDocs: documents })}
              existingDocuments={formData.supportingDocs}
              maxDocuments={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Review Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            Ready to Submit?
          </CardTitle>
          <CardDescription className="text-blue-700">
            Review your case study details before submission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Type:</span> {formData.type}
            </div>
            <div>
              <span className="font-semibold">Customer:</span> {formData.customerName || 'Not provided'}
            </div>
            <div>
              <span className="font-semibold">Component:</span>{' '}
              {formData.componentWorkpiece || 'Not provided'}
            </div>
            <div>
              <span className="font-semibold">WA Product:</span> {formData.waProduct || 'Not provided'}
            </div>
          </div>
          <div className="bg-white rounded p-3 text-sm">
            <span className="font-semibold">Next Steps:</span> Your case study will be sent to an Approver
            for review. You'll be notified once it's approved and published!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

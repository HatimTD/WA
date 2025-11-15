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
        <Card role="article" className="bg-wa-green-50 border-wa-green-200 dark:bg-accent dark:border-primary">
          <CardContent className="pt-6">
            <p className="text-sm text-wa-green-800 dark:text-muted-foreground">
              <span className="font-semibold dark:text-foreground">Note:</span> The Cost Reduction Calculator will be available after saving this case study. You'll be able to add detailed cost analysis in the edit view.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Media Upload */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <Upload className="h-5 w-5 text-wa-green-600" />
            Images & Documents
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Upload photos, videos, or supporting documents
            {formData.type === 'STAR' && ' (Required for Star cases)'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="dark:text-foreground">Images</Label>
            <ImageUpload
              onImagesChange={(images) => updateFormData({ images })}
              existingImages={formData.images}
              maxImages={5}
            />
          </div>

          <div className="space-y-2">
            <Label className="dark:text-foreground">Supporting Documents</Label>
            <DocumentUpload
              onDocumentsChange={(documents) => updateFormData({ supportingDocs: documents })}
              existingDocuments={formData.supportingDocs}
              maxDocuments={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Review Summary */}
      <Card role="article" className="bg-wa-green-50 border-wa-green-200 dark:bg-accent dark:border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <CheckCircle2 className="h-5 w-5 text-wa-green-600" />
            Ready to Submit?
          </CardTitle>
          <CardDescription className="text-wa-green-700 dark:text-muted-foreground">
            Review your case study details before submission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4 text-sm dark:text-muted-foreground">
            <div>
              <span className="font-semibold dark:text-foreground">Type:</span> {formData.type}
            </div>
            <div>
              <span className="font-semibold dark:text-foreground">Customer:</span> {formData.customerName || 'Not provided'}
            </div>
            <div>
              <span className="font-semibold dark:text-foreground">Component:</span>{' '}
              {formData.componentWorkpiece || 'Not provided'}
            </div>
            <div>
              <span className="font-semibold dark:text-foreground">WA Product:</span> {formData.waProduct || 'Not provided'}
            </div>
          </div>
          <div className="bg-white rounded p-3 text-sm dark:bg-background dark:text-muted-foreground">
            <span className="font-semibold dark:text-foreground">Next Steps:</span> Your case study will be sent to an Approver
            for review. You'll be notified once it's approved and published!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

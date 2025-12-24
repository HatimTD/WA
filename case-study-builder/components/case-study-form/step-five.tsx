'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CaseStudyFormData } from '@/app/dashboard/new/page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Upload, CheckCircle2, Sparkles, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ImageUpload from '@/components/image-upload';
import DocumentUpload from '@/components/document-upload';
import CostCalculator from '@/components/cost-calculator';
import { waSuggestTags } from '@/lib/actions/waAiSuggestionsActions';
import { toast } from 'sonner';

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
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const handleGenerateTags = async () => {
    if (!formData.problemDescription || !formData.industry || !formData.componentWorkpiece) {
      toast.error('Please fill in problem description, industry, and component to generate tags');
      return;
    }

    setIsGeneratingTags(true);
    try {
      const result = await waSuggestTags(
        formData.problemDescription,
        formData.industry,
        formData.componentWorkpiece
      );

      if (result.success && result.tags) {
        setSuggestedTags(result.tags);
        toast.success('Tags generated successfully!');
      } else {
        toast.error(result.error || 'Failed to generate tags');
      }
    } catch (error) {
      toast.error('Failed to generate tags');
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      updateFormData({ tags: [...formData.tags, trimmedTag] });
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFormData({
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleAddCustomTag = () => {
    if (newTag.trim()) {
      addTag(newTag);
      setNewTag('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial Information - BRD 3.3 Required */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <DollarSign className="h-5 w-5 text-wa-green-600" />
            Financial Information
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Document the business value and customer savings (all fields required)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="solutionValueRevenue" className="dark:text-foreground">
                Solution Value/Revenue <span className="text-red-500 dark:text-red-400">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="solutionValueRevenue"
                  value={formData.solutionValueRevenue}
                  onChange={(e) => updateFormData({ solutionValueRevenue: e.target.value })}
                  placeholder="e.g., 25000"
                  className="pl-9 dark:bg-input dark:border-border dark:text-foreground"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Value of the WA solution sold
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualPotentialRevenue" className="dark:text-foreground">
                Annual Potential Revenue <span className="text-red-500 dark:text-red-400">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="annualPotentialRevenue"
                  value={formData.annualPotentialRevenue}
                  onChange={(e) => updateFormData({ annualPotentialRevenue: e.target.value })}
                  placeholder="e.g., 100000"
                  className="pl-9 dark:bg-input dark:border-border dark:text-foreground"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Potential annual revenue from customer
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerSavingsAmount" className="dark:text-foreground">
                Customer Savings <span className="text-red-500 dark:text-red-400">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customerSavingsAmount"
                  value={formData.customerSavingsAmount}
                  onChange={(e) => updateFormData({ customerSavingsAmount: e.target.value })}
                  placeholder="e.g., 50000"
                  className="pl-9 dark:bg-input dark:border-border dark:text-foreground"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Estimated customer cost savings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Reduction Calculator - Only for STAR cases in edit mode */}
      {formData.type === 'STAR' && caseStudyId && (
        <CostCalculator
          caseStudyId={caseStudyId}
          existingData={existingCostCalc}
        />
      )}

      {/* AI-Powered Tags */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <Sparkles className="h-5 w-5 text-wa-green-600" />
            Tags & Keywords
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Add tags to improve discoverability. Use AI to generate relevant technical tags.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Suggestions Button */}
          <div>
            <Button
              type="button"
              onClick={handleGenerateTags}
              disabled={isGeneratingTags}
              variant="outline"
              className="w-full sm:w-auto dark:border-border"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGeneratingTags ? 'Generating Tags...' : 'Generate AI Tags'}
            </Button>
          </div>

          {/* Suggested Tags */}
          {suggestedTags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm dark:text-foreground">Suggested Tags (Click to add)</Label>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-wa-green-100 dark:hover:bg-wa-green-900 transition-colors"
                    onClick={() => addTag(tag)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Selected Tags */}
          {formData.tags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm dark:text-foreground">Selected Tags</Label>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="default"
                    className="bg-wa-green-600 hover:bg-wa-green-700 dark:bg-primary dark:hover:bg-primary/80"
                  >
                    {tag}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Manual Tag Input */}
          <div className="space-y-2">
            <Label htmlFor="newTag" className="dark:text-foreground">Add Custom Tag</Label>
            <div className="flex gap-2">
              <Input
                id="newTag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder="e.g., GMAW, hardfacing, wear resistance"
                className="dark:bg-input dark:border-border dark:text-foreground"
              />
              <Button
                type="button"
                onClick={handleAddCustomTag}
                variant="outline"
                className="dark:border-border"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
              Press Enter or click + to add a custom tag
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Media Upload - BRD 3.3 Images Required */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <Upload className="h-5 w-5 text-wa-green-600" />
            Images & Documents
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Upload photos, videos, or supporting documents. At least one image is required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="dark:text-foreground">
              Images <span className="text-red-500 dark:text-red-400">*</span>
              <span className="text-xs text-muted-foreground ml-2">(Minimum 1 required)</span>
            </Label>
            <ImageUpload
              onImagesChange={(images) => updateFormData({ images })}
              existingImages={formData.images}
              maxImages={5}
            />
            {formData.images.length === 0 && (
              <p className="text-xs text-red-500 dark:text-red-400">
                Please upload at least one image before submitting
              </p>
            )}
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

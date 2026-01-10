'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CaseStudyFormData } from '@/app/dashboard/new/page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CheckCircle2, Sparkles, X, Plus, Calculator, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { waSuggestTags } from '@/lib/actions/waAiSuggestionsActions';
import { toast } from 'sonner';

type Props = {
  formData: CaseStudyFormData;
  updateFormData: (data: Partial<CaseStudyFormData>) => void;
};

export default function StepFive({ formData, updateFormData }: Props) {
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Calculate cost calculator summary for STAR cases (same formula as step-cost-calculator)
  const waCalculateCostSummary = () => {
    const cc = formData.costCalculator;
    if (!cc?.costOfPart || !cc?.costOfWaSolution || !cc?.oldSolutionLifetime || !cc?.waSolutionLifetime ||
        !cc?.partsUsedPerYear || !cc?.maintenanceCostPerEvent || !cc?.disassemblyAssemblyCost || !cc?.downtimeCostPerEvent) {
      return null;
    }

    const A = parseFloat(cc.costOfPart) || 0;
    const B = parseFloat(cc.costOfWaSolution) || 0;
    const C = parseFloat(cc.oldSolutionLifetime) || 1;
    const D = parseFloat(cc.waSolutionLifetime) || 1;
    const E = parseFloat(cc.partsUsedPerYear) || 0;
    const F = parseFloat(cc.maintenanceCostPerEvent) || 0;
    const G = parseFloat(cc.disassemblyAssemblyCost) || 0;
    const H = parseFloat(cc.downtimeCostPerEvent) || 0;

    const lifetimeRatio = D / C;
    const waPartsPerYear = E / lifetimeRatio;
    const annualCostOld = (A * E) + (E - 1) * (F + G + H);
    const annualCostWA = (B * waPartsPerYear) + Math.max(0, waPartsPerYear - 1) * (F + G + H);
    const totalAnnualSavings = annualCostOld - annualCostWA;
    const savingsPercentage = annualCostOld > 0 ? (totalAnnualSavings / annualCostOld) * 100 : 0;

    return {
      lifetimeRatio: lifetimeRatio.toFixed(1),
      waPartsPerYear: waPartsPerYear.toFixed(1),
      annualCostOld: annualCostOld.toFixed(2),
      annualCostWA: annualCostWA.toFixed(2),
      totalAnnualSavings: totalAnnualSavings.toFixed(2),
      savingsPercentage: savingsPercentage.toFixed(1),
    };
  };

  const costSummary = formData.type === 'STAR' ? waCalculateCostSummary() : null;

  const handleGenerateTags = async () => {
    // Check which required fields are missing
    const missingFields: string[] = [];
    if (!formData.problemDescription?.trim()) missingFields.push('Problem Description');
    if (!formData.industry?.trim()) missingFields.push('Industry');
    if (!formData.componentWorkpiece?.trim()) missingFields.push('Component/Workpiece');

    if (missingFields.length > 0) {
      toast.error(`Cannot generate tags. Missing: ${missingFields.join(', ')}. Please complete previous steps first.`);
      return;
    }

    setIsGeneratingTags(true);
    try {
      const result = await waSuggestTags(
        formData.problemDescription,
        formData.industry,
        formData.componentWorkpiece
      );

      if (result.success && result.tags && result.tags.length > 0) {
        setSuggestedTags(result.tags);
        toast.success(`Generated ${result.tags.length} tag suggestions!`);
      } else if (result.success && (!result.tags || result.tags.length === 0)) {
        toast.error('No tags could be generated. Try adding more detail to your problem description.');
      } else {
        toast.error(result.error || 'Failed to generate tags. Please try again.');
      }
    } catch (error) {
      console.error('Tag generation error:', error);
      toast.error('Failed to generate tags. Please check your connection and try again.');
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
      {/* Expected or new calculated service life */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <Clock className="h-5 w-5 text-wa-green-600" />
            Expected or new calculated service life
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
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
        </CardContent>
      </Card>

      {/* Revenue Information - BRD 3.3 Required */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <DollarSign className="h-5 w-5 text-wa-green-600" />
            Revenue Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="revenueCurrency" className="dark:text-foreground">
                Currency <span className="text-red-500 dark:text-red-400">*</span>
              </Label>
              <select
                id="revenueCurrency"
                value={formData.revenueCurrency || 'EUR'}
                onChange={(e) => updateFormData({ revenueCurrency: e.target.value as any })}
                className="w-full h-10 px-3 rounded-md border border-border bg-input text-foreground dark:bg-input dark:border-border dark:text-foreground"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="MAD">MAD (د.م.)</option>
                <option value="AUD">AUD ($)</option>
                <option value="CAD">CAD ($)</option>
                <option value="CHF">CHF (Fr)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CNY">CNY (¥)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="solutionValueRevenue" className="dark:text-foreground">
                Solution Value/Revenue <span className="text-red-500 dark:text-red-400">*</span>
              </Label>
              <Input
                id="solutionValueRevenue"
                type="number"
                value={formData.solutionValueRevenue}
                onChange={(e) => updateFormData({ solutionValueRevenue: e.target.value })}
                placeholder="e.g., 25000"
                className="dark:bg-input dark:border-border dark:text-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualPotentialRevenue" className="dark:text-foreground">
                Annual Potential Revenue <span className="text-red-500 dark:text-red-400">*</span>
              </Label>
              <Input
                id="annualPotentialRevenue"
                type="number"
                value={formData.annualPotentialRevenue}
                onChange={(e) => updateFormData({ annualPotentialRevenue: e.target.value })}
                placeholder="e.g., 100000"
                className="dark:bg-input dark:border-border dark:text-foreground"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Calculator Summary - For STAR cases */}
      {formData.type === 'STAR' && costSummary && (
        <Card role="article" className="bg-wa-green-50 border-wa-green-200 dark:bg-accent dark:border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-foreground">
              <Calculator className="h-5 w-5 text-wa-green-600" />
              Cost Calculator Summary
            </CardTitle>
            <CardDescription className="dark:text-muted-foreground">
              Calculated savings from the WA solution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="text-center p-3 bg-white dark:bg-card rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Annual Cost (Old Solution)</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-foreground">
                    ${parseFloat(costSummary.annualCostOld).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Parts/year:</span>
                    <span>{formData.costCalculator?.partsUsedPerYear}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-center p-3 bg-white dark:bg-card rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Annual Cost (WA Solution)</p>
                  <p className="text-2xl font-bold text-wa-green-600 dark:text-primary">
                    ${parseFloat(costSummary.annualCostWA).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Lifetime improvement:</span>
                    <span className="font-semibold text-wa-green-700 dark:text-primary">{costSummary.lifetimeRatio}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parts/year (reduced):</span>
                    <span>{costSummary.waPartsPerYear}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-center p-3 bg-wa-green-100 dark:bg-primary/20 rounded-lg border-2 border-wa-green-300 dark:border-primary">
                  <p className="text-xs text-wa-green-700 dark:text-primary mb-1">Total Annual Savings</p>
                  <p className="text-3xl font-bold text-wa-green-700 dark:text-primary">
                    ${parseFloat(costSummary.totalAnnualSavings).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm font-semibold text-wa-green-600 dark:text-primary/80 mt-1">
                    {costSummary.savingsPercentage}% reduction
                  </p>
                </div>
              </div>
            </div>
            {formData.costCalculator?.extraBenefits && (
              <div className="mt-4 pt-4 border-t border-wa-green-200 dark:border-primary/30">
                <p className="text-sm font-semibold dark:text-foreground mb-1">Extra Benefits:</p>
                <p className="text-sm text-muted-foreground">{formData.costCalculator.extraBenefits}</p>
              </div>
            )}
          </CardContent>
        </Card>
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

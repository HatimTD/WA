'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, DollarSign, Clock, Settings } from 'lucide-react';
import type { CaseStudyFormData } from '@/app/dashboard/new/page';

type Props = {
  formData: CaseStudyFormData;
  updateFormData: (data: Partial<CaseStudyFormData>) => void;
};

export default function StepCostCalculator({ formData, updateFormData }: Props) {
  const waUpdateCostCalculator = (field: string, value: string) => {
    updateFormData({
      costCalculator: {
        ...formData.costCalculator,
        [field]: value,
      },
    });
  };

  // Calculate estimated savings if all fields are filled
  const waCalculateSavings = () => {
    const cc = formData.costCalculator;
    if (!cc?.costOfPart || !cc?.oldSolutionLifetime || !cc?.waSolutionLifetime ||
        !cc?.partsUsedPerYear || !cc?.maintenanceDowntimeCost || !cc?.disassemblyAssemblyCost) {
      return null;
    }

    const costOfPart = parseFloat(cc.costOfPart) || 0;
    const oldLifetime = parseFloat(cc.oldSolutionLifetime) || 1;
    const waLifetime = parseFloat(cc.waSolutionLifetime) || 1;
    const partsPerYear = parseFloat(cc.partsUsedPerYear) || 0;
    const maintenanceCost = parseFloat(cc.maintenanceDowntimeCost) || 0;
    const assemblyCost = parseFloat(cc.disassemblyAssemblyCost) || 0;

    // Calculate lifetime improvement factor
    const lifetimeImprovement = waLifetime / oldLifetime;

    // Calculate annual savings
    const oldPartsNeeded = partsPerYear;
    const newPartsNeeded = partsPerYear / lifetimeImprovement;
    const partsSavings = (oldPartsNeeded - newPartsNeeded) * costOfPart;

    // Calculate maintenance savings (fewer replacements = fewer maintenance events)
    const maintenanceSavings = (oldPartsNeeded - newPartsNeeded) * (maintenanceCost + assemblyCost);

    const totalAnnualSavings = partsSavings + maintenanceSavings;

    return {
      lifetimeImprovement: lifetimeImprovement.toFixed(1),
      partsSavings: partsSavings.toFixed(2),
      maintenanceSavings: maintenanceSavings.toFixed(2),
      totalAnnualSavings: totalAnnualSavings.toFixed(2),
    };
  };

  const savings = waCalculateSavings();

  return (
    <div className="space-y-6">
      <div className="bg-wa-green-50 border border-wa-green-200 rounded-lg p-4 dark:bg-accent dark:border-primary">
        <p className="text-sm text-wa-green-800 dark:text-muted-foreground">
          <span className="font-semibold dark:text-foreground">Star Case Requirement:</span> The Cost Calculator helps demonstrate the financial value of the WA solution. All fields are required.
        </p>
      </div>

      {/* Part Cost */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg dark:text-foreground">
            <DollarSign className="h-5 w-5 text-wa-green-600" />
            Part & Material Costs
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Enter the cost of the part or component being protected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="costOfPart" className="dark:text-foreground">
              Cost of Part <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="costOfPart"
                type="number"
                value={formData.costCalculator?.costOfPart || ''}
                onChange={(e) => waUpdateCostCalculator('costOfPart', e.target.value)}
                placeholder="e.g., 5000"
                className="pl-9 dark:bg-input dark:border-border dark:text-foreground"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The replacement cost of the component (in your local currency)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partsUsedPerYear" className="dark:text-foreground">
              Parts Used Per Year <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <Input
              id="partsUsedPerYear"
              type="number"
              value={formData.costCalculator?.partsUsedPerYear || ''}
              onChange={(e) => waUpdateCostCalculator('partsUsedPerYear', e.target.value)}
              placeholder="e.g., 12"
              className="dark:bg-input dark:border-border dark:text-foreground"
              required
            />
            <p className="text-xs text-muted-foreground">
              Number of parts replaced annually with the old solution
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lifetime Comparison */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg dark:text-foreground">
            <Clock className="h-5 w-5 text-wa-green-600" />
            Lifetime Comparison
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Compare the service life of the old solution vs WA solution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="oldSolutionLifetime" className="dark:text-foreground">
                Old Solution Lifetime (hours/months) <span className="text-red-500 dark:text-red-400">*</span>
              </Label>
              <Input
                id="oldSolutionLifetime"
                type="number"
                value={formData.costCalculator?.oldSolutionLifetime || ''}
                onChange={(e) => waUpdateCostCalculator('oldSolutionLifetime', e.target.value)}
                placeholder="e.g., 500"
                className="dark:bg-input dark:border-border dark:text-foreground"
                required
              />
              <p className="text-xs text-muted-foreground">
                Service life before WA solution
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="waSolutionLifetime" className="dark:text-foreground">
                WA Solution Lifetime (hours/months) <span className="text-red-500 dark:text-red-400">*</span>
              </Label>
              <Input
                id="waSolutionLifetime"
                type="number"
                value={formData.costCalculator?.waSolutionLifetime || ''}
                onChange={(e) => waUpdateCostCalculator('waSolutionLifetime', e.target.value)}
                placeholder="e.g., 2000"
                className="dark:bg-input dark:border-border dark:text-foreground"
                required
              />
              <p className="text-xs text-muted-foreground">
                Expected/achieved service life with WA solution
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance & Downtime Costs */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg dark:text-foreground">
            <Settings className="h-5 w-5 text-wa-green-600" />
            Maintenance & Downtime Costs
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Enter costs associated with replacements and downtime
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maintenanceDowntimeCost" className="dark:text-foreground">
              Maintenance/Downtime Cost per Event <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="maintenanceDowntimeCost"
                type="number"
                value={formData.costCalculator?.maintenanceDowntimeCost || ''}
                onChange={(e) => waUpdateCostCalculator('maintenanceDowntimeCost', e.target.value)}
                placeholder="e.g., 2000"
                className="pl-9 dark:bg-input dark:border-border dark:text-foreground"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Cost of downtime and lost production per replacement event
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="disassemblyAssemblyCost" className="dark:text-foreground">
              Disassembly/Assembly Cost per Event <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="disassemblyAssemblyCost"
                type="number"
                value={formData.costCalculator?.disassemblyAssemblyCost || ''}
                onChange={(e) => waUpdateCostCalculator('disassemblyAssemblyCost', e.target.value)}
                placeholder="e.g., 500"
                className="pl-9 dark:bg-input dark:border-border dark:text-foreground"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Labor cost to remove and reinstall the component
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Calculated Savings Preview */}
      {savings && (
        <Card role="article" className="bg-wa-green-50 border-wa-green-200 dark:bg-accent dark:border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg dark:text-foreground">
              <Calculator className="h-5 w-5 text-wa-green-600" />
              Estimated Annual Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-muted-foreground">Lifetime Improvement:</span>
                  <span className="font-semibold text-wa-green-700 dark:text-foreground">{savings.lifetimeImprovement}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-muted-foreground">Parts Savings:</span>
                  <span className="font-semibold dark:text-foreground">${savings.partsSavings}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-muted-foreground">Maintenance Savings:</span>
                  <span className="font-semibold dark:text-foreground">${savings.maintenanceSavings}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold dark:text-foreground">Total Annual Savings:</span>
                  <span className="font-bold text-wa-green-700 dark:text-primary text-lg">${savings.totalAnnualSavings}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

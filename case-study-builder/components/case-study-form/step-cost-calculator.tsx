'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Clock, Settings, Sparkles, Wrench, AlertCircle, TrendingDown } from 'lucide-react';
import { ServiceLifePicker, ServiceLifeValue, DEFAULT_SERVICE_LIFE } from '@/components/ui/service-life-picker';
import type { CaseStudyFormData } from '@/app/dashboard/new/page';

type Props = {
  formData: CaseStudyFormData;
  updateFormData: (data: Partial<CaseStudyFormData>) => void;
};

// Currency symbols map
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  JPY: '¥',
  CNY: '¥',
  MAD: 'MAD',
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

  // Get the currency symbol for display
  const currencySymbol = CURRENCY_SYMBOLS[formData.costCalculator?.currency || 'EUR'] || '€';
  // Helper functions for ServiceLifePicker integration
  const waGetOldLifetimeValue = (): ServiceLifeValue => {
    const cc = formData.costCalculator;
    return {
      hours: parseInt(cc?.oldLifetimeHours || '0') || 0,
      days: parseInt(cc?.oldLifetimeDays || '0') || 0,
      weeks: parseInt(cc?.oldLifetimeWeeks || '0') || 0,
      months: parseInt(cc?.oldLifetimeMonths || '0') || 0,
      years: parseInt(cc?.oldLifetimeYears || '0') || 0,
    };
  };

  const waGetWaLifetimeValue = (): ServiceLifeValue => {
    const cc = formData.costCalculator;
    return {
      hours: parseInt(cc?.waLifetimeHours || '0') || 0,
      days: parseInt(cc?.waLifetimeDays || '0') || 0,
      weeks: parseInt(cc?.waLifetimeWeeks || '0') || 0,
      months: parseInt(cc?.waLifetimeMonths || '0') || 0,
      years: parseInt(cc?.waLifetimeYears || '0') || 0,
    };
  };

  const waUpdateOldLifetime = (value: ServiceLifeValue) => {
    updateFormData({
      costCalculator: {
        ...formData.costCalculator,
        oldLifetimeHours: value.hours > 0 ? String(value.hours) : '',
        oldLifetimeDays: value.days > 0 ? String(value.days) : '',
        oldLifetimeWeeks: value.weeks > 0 ? String(value.weeks) : '',
        oldLifetimeMonths: value.months > 0 ? String(value.months) : '',
        oldLifetimeYears: value.years > 0 ? String(value.years) : '',
      },
    });
  };

  const waUpdateWaLifetime = (value: ServiceLifeValue) => {
    updateFormData({
      costCalculator: {
        ...formData.costCalculator,
        waLifetimeHours: value.hours > 0 ? String(value.hours) : '',
        waLifetimeDays: value.days > 0 ? String(value.days) : '',
        waLifetimeWeeks: value.weeks > 0 ? String(value.weeks) : '',
        waLifetimeMonths: value.months > 0 ? String(value.months) : '',
        waLifetimeYears: value.years > 0 ? String(value.years) : '',
      },
    });
  };


  // Helper to convert mixed time units to total hours (for comparison)
  const waConvertToTotalHours = (hours?: string, days?: string, weeks?: string, months?: string, years?: string): number => {
    const h = parseFloat(hours || '0') || 0;
    const d = parseFloat(days || '0') || 0;
    const w = parseFloat(weeks || '0') || 0;
    const m = parseFloat(months || '0') || 0;
    const y = parseFloat(years || '0') || 0;
    // Convert all to hours: 1d=24h, 1w=168h, 1m=730h (avg), 1y=8760h
    return h + (d * 24) + (w * 168) + (m * 730) + (y * 8760);
  };

  // Calculate savings using the new formula:
  // Annual Cost Old = (A × E) + (E − 1) × (F + G + H)
  // Annual Cost WA = (B × (E ÷ (D ÷ C))) + ((E ÷ (D ÷ C)) − 1) × (F + G + H)
  // Where: A=old cost, B=WA cost, C=old lifetime, D=WA lifetime, E=parts/year, F=maintenance, G=disassembly, H=downtime
  const waCalculateSavings = () => {
    const cc = formData.costCalculator;

    // Calculate total hours from mixed units
    const oldLifetimeTotal = waConvertToTotalHours(
      cc?.oldLifetimeHours, cc?.oldLifetimeDays, cc?.oldLifetimeWeeks,
      cc?.oldLifetimeMonths, cc?.oldLifetimeYears
    );
    const waLifetimeTotal = waConvertToTotalHours(
      cc?.waLifetimeHours, cc?.waLifetimeDays, cc?.waLifetimeWeeks,
      cc?.waLifetimeMonths, cc?.waLifetimeYears
    );

    // Check required fields - use new mixed unit fields
    if (!cc?.costOfPart || !cc?.costOfWaSolution || oldLifetimeTotal === 0 || waLifetimeTotal === 0 ||
        !cc?.partsUsedPerYear || !cc?.maintenanceCostPerEvent || !cc?.disassemblyAssemblyCost || !cc?.downtimeCostPerEvent) {
      return null;
    }

    const A = parseFloat(cc.costOfPart) || 0;           // Cost of old solution/part
    const B = parseFloat(cc.costOfWaSolution) || 0;    // Cost of WA solution
    const C = oldLifetimeTotal || 1;                    // Old solution lifetime (in hours)
    const D = waLifetimeTotal || 1;                     // WA solution lifetime (in hours)
    const E = parseFloat(cc.partsUsedPerYear) || 0;    // Parts used per year
    const F = parseFloat(cc.maintenanceCostPerEvent) || 0;  // Maintenance cost per event
    const G = parseFloat(cc.disassemblyAssemblyCost) || 0;  // Disassembly/assembly cost per event
    const H = parseFloat(cc.downtimeCostPerEvent) || 0;     // Downtime cost per event

    // Calculate lifetime improvement factor
    const lifetimeRatio = D / C; // How many times longer WA solution lasts

    // Calculate new parts needed per year with WA solution
    const waPartsPerYear = E / lifetimeRatio;

    // Annual Cost Old = (A × E) + (E − 1) × (F + G + H)
    const annualCostOld = (A * E) + (E - 1) * (F + G + H);

    // Annual Cost WA = (B × waPartsPerYear) + (waPartsPerYear − 1) × (F + G + H)
    const annualCostWA = (B * waPartsPerYear) + Math.max(0, waPartsPerYear - 1) * (F + G + H);

    // Calculate savings
    const totalAnnualSavings = annualCostOld - annualCostWA;
    const savingsPercentage = annualCostOld > 0 ? (totalAnnualSavings / annualCostOld) * 100 : 0;

    // Breakdown for display
    const partsCostOld = A * E;
    const partsCostWA = B * waPartsPerYear;
    const partsSavings = partsCostOld - partsCostWA;

    const eventCostOld = (E - 1) * (F + G + H);
    const eventCostWA = Math.max(0, waPartsPerYear - 1) * (F + G + H);
    const eventSavings = eventCostOld - eventCostWA;

    return {
      lifetimeRatio: lifetimeRatio.toFixed(1),
      waPartsPerYear: waPartsPerYear.toFixed(1),
      annualCostOld: annualCostOld.toFixed(2),
      annualCostWA: annualCostWA.toFixed(2),
      partsSavings: partsSavings.toFixed(2),
      eventSavings: eventSavings.toFixed(2),
      totalAnnualSavings: totalAnnualSavings.toFixed(2),
      savingsPercentage: savingsPercentage.toFixed(1),
      oldLifetimeTotal,
      waLifetimeTotal,
    };
  };

  const savings = waCalculateSavings();

  // Calculate comparison bar widths
  const waGetCostComparisonWidths = () => {
    if (!savings) return { oldWidth: 50, waWidth: 50 };
    const oldCost = parseFloat(savings.annualCostOld);
    const waCost = parseFloat(savings.annualCostWA);
    const maxCost = Math.max(oldCost, waCost);
    if (maxCost === 0) return { oldWidth: 50, waWidth: 50 };
    return {
      oldWidth: Math.round((oldCost / maxCost) * 100),
      waWidth: Math.round((waCost / maxCost) * 100),
    };
  };

  const waGetLifetimeComparisonWidths = () => {
    if (!savings) return { oldWidth: 50, waWidth: 50 };
    const oldLife = savings.oldLifetimeTotal;
    const waLife = savings.waLifetimeTotal;
    const maxLife = Math.max(oldLife, waLife);
    if (maxLife === 0) return { oldWidth: 50, waWidth: 50 };
    return {
      oldWidth: Math.round((oldLife / maxLife) * 100),
      waWidth: Math.round((waLife / maxLife) * 100),
    };
  };

  const costWidths = waGetCostComparisonWidths();
  const lifetimeWidths = waGetLifetimeComparisonWidths();


  return (
    <div className="space-y-6">
      <div className="bg-wa-green-50 border border-wa-green-200 rounded-lg p-4 dark:bg-accent dark:border-primary">
        <p className="text-sm text-wa-green-800 dark:text-muted-foreground">
          <span className="font-semibold dark:text-foreground">Star Case Requirement:</span> The Cost Calculator helps demonstrate the financial value of the WA solution. All fields are required.
        </p>
      </div>

      {/* Currency Selection */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg dark:text-foreground">
            <Settings className="h-5 w-5 text-wa-green-600" />
            Currency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="currency" className="dark:text-foreground">
              Select Currency <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <Select
              value={formData.costCalculator?.currency || 'EUR'}
              onValueChange={(value) => waUpdateCostCalculator('currency', value)}
            >
              <SelectTrigger className="w-48 dark:bg-input dark:border-border dark:text-foreground">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="dark:bg-popover dark:border-border">
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="USD">USD (US Dollar)</SelectItem>
                <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                <SelectItem value="AUD">AUD (Australian Dollar)</SelectItem>
                <SelectItem value="CAD">CAD (Canadian Dollar)</SelectItem>
                <SelectItem value="CHF">CHF (Swiss Franc)</SelectItem>
                <SelectItem value="JPY">JPY (Japanese Yen)</SelectItem>
                <SelectItem value="CNY">CNY (Chinese Yuan)</SelectItem>
                <SelectItem value="MAD">MAD (Moroccan Dirham)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              All cost values will be in this currency
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Part & Material Costs */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg dark:text-foreground">
            <TrendingDown className="h-5 w-5 text-wa-green-600" />
            Part & Material Costs
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Compare the cost of old solution vs WA solution ({currencySymbol})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costOfPart" className="dark:text-foreground">
                Cost of Old Solution/Part (A) <span className="text-red-500 dark:text-red-400">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  {currencySymbol}
                </span>
                <Input
                  id="costOfPart"
                  type="number"
                  value={formData.costCalculator?.costOfPart || ''}
                  onChange={(e) => waUpdateCostCalculator('costOfPart', e.target.value)}
                  placeholder="Cost per unit with the old solution."
                  className="pl-12 dark:bg-input dark:border-border dark:text-foreground"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Cost per unit with old solution
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costOfWaSolution" className="dark:text-foreground">
                Cost of WA Solution (B) <span className="text-red-500 dark:text-red-400">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                  {currencySymbol}
                </span>
                <Input
                  id="costOfWaSolution"
                  type="number"
                  value={formData.costCalculator?.costOfWaSolution || ''}
                  onChange={(e) => waUpdateCostCalculator('costOfWaSolution', e.target.value)}
                  placeholder="Cost per unit with the WA solution."
                  className="pl-12 dark:bg-input dark:border-border dark:text-foreground"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Cost per unit with WA solution (may be higher, but lasts longer)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partsUsedPerYear" className="dark:text-foreground">
              Parts Used Per Year (E) <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <Input
              id="partsUsedPerYear"
              type="number"
              value={formData.costCalculator?.partsUsedPerYear || ''}
              onChange={(e) => waUpdateCostCalculator('partsUsedPerYear', e.target.value)}
              placeholder="Number of parts replaced per year with the old solution."
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
            Compare the service life of the old solution vs WA solution (use any combination of time units)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Old Solution Lifetime */}
          <div className="space-y-3">
            <Label className="dark:text-foreground">
              Old Solution Lifetime (C) <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <ServiceLifePicker
              value={waGetOldLifetimeValue()}
              onChange={waUpdateOldLifetime}
              label="Old Solution Lifetime"
              required
            />
            <p className="text-xs text-muted-foreground">
              Service life with the old solution
            </p>
          </div>

          {/* WA Solution Lifetime */}
          <div className="space-y-3">
            <Label className="dark:text-foreground">
              WA Solution Lifetime (D) <span className="text-red-500 dark:text-red-400">*</span>
            </Label>
            <ServiceLifePicker
              value={waGetWaLifetimeValue()}
              onChange={waUpdateWaLifetime}
              label="WA Solution Lifetime"
              required
            />
            <p className="text-xs text-muted-foreground">
              Expected/achieved service life with WA solution
            </p>
          </div>

          {/* Visual Lifetime Comparison */}
          {savings && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-foreground">Lifetime Comparison</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs w-24 text-muted-foreground">Old Solution</span>
                  <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${lifetimeWidths.oldWidth}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {savings.oldLifetimeTotal.toLocaleString()}h
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs w-24 text-muted-foreground">WA Solution</span>
                  <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-wa-green-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${lifetimeWidths.waWidth}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {savings.waLifetimeTotal.toLocaleString()}h
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-wa-green-700 dark:text-wa-green-400 font-semibold">
                WA solution lasts {savings.lifetimeRatio}x longer!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Costs (Per Replacement) */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg dark:text-foreground">
            <Wrench className="h-5 w-5 text-wa-green-600" />
            Event Costs (Per Replacement)
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Costs incurred each time a part needs to be replaced
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maintenanceCostPerEvent" className="dark:text-foreground">
                Maintenance Cost (F) <span className="text-red-500 dark:text-red-400">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">{currencySymbol}</span>
                <Input
                  id="maintenanceCostPerEvent"
                  type="number"
                  value={formData.costCalculator?.maintenanceCostPerEvent || ''}
                  onChange={(e) => waUpdateCostCalculator('maintenanceCostPerEvent', e.target.value)}
                  placeholder="Maintenance/repair labor cost per replacement event."
                  className="pl-9 dark:bg-input dark:border-border dark:text-foreground"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Maintenance/repair labor cost per event
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disassemblyAssemblyCost" className="dark:text-foreground">
                Disassembly/Assembly (G) <span className="text-red-500 dark:text-red-400">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">{currencySymbol}</span>
                <Input
                  id="disassemblyAssemblyCost"
                  type="number"
                  value={formData.costCalculator?.disassemblyAssemblyCost || ''}
                  onChange={(e) => waUpdateCostCalculator('disassemblyAssemblyCost', e.target.value)}
                  placeholder="Labor cost to remove and reinstall per event."
                  className="pl-9 dark:bg-input dark:border-border dark:text-foreground"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Labor to remove and reinstall per event
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="downtimeCostPerEvent" className="dark:text-foreground">
                Downtime Cost (H) <span className="text-red-500 dark:text-red-400">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">{currencySymbol}</span>
                <Input
                  id="downtimeCostPerEvent"
                  type="number"
                  value={formData.costCalculator?.downtimeCostPerEvent || ''}
                  onChange={(e) => waUpdateCostCalculator('downtimeCostPerEvent', e.target.value)}
                  placeholder="Lost production cost per replacement event."
                  className="pl-9 dark:bg-input dark:border-border dark:text-foreground"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Lost production cost per event
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extra Benefits (Qualitative) */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg dark:text-foreground">
            <Sparkles className="h-5 w-5 text-wa-green-600" />
            Extra Benefits (Qualitative)
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Describe additional qualitative benefits beyond cost savings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="extraBenefits" className="dark:text-foreground">
              Extra Benefits
            </Label>
            <Textarea
              id="extraBenefits"
              value={formData.costCalculator?.extraBenefits || ''}
              onChange={(e) => waUpdateCostCalculator('extraBenefits', e.target.value)}
              placeholder="e.g., Improved safety, reduced environmental impact, better product quality, reduced inventory requirements..."
              className="min-h-[100px] dark:bg-input dark:border-border dark:text-foreground"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Include any non-monetary benefits such as safety improvements, environmental impact, quality improvements, etc.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Formula Explanation */}
      <Card role="article" className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm dark:text-foreground">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            How Savings Are Calculated
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <p><strong>Annual Cost (Old):</strong> (A × E) + (E − 1) × (F + G + H)</p>
          <p><strong>Annual Cost (WA):</strong> (B × E÷(D/C)) + (E÷(D/C) − 1) × (F + G + H)</p>
          <p className="text-muted-foreground pt-1">
            The WA solution costs more per unit but lasts longer, reducing total parts needed and replacement events.
          </p>
        </CardContent>
      </Card>

      {/* Calculated Savings Preview */}
      {savings && (
        <Card role="article" className="bg-wa-green-50 border-wa-green-200 dark:bg-accent dark:border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg dark:text-foreground">
              <Calculator className="h-5 w-5 text-wa-green-600" />
              Calculated Annual Savings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Visual Cost Comparison Bars */}
            <div className="p-4 bg-white dark:bg-card rounded-lg space-y-3">
              <p className="text-sm font-semibold text-foreground">Annual Cost Comparison</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs w-24 text-muted-foreground">Old Solution</span>
                  <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${costWidths.oldWidth}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {currencySymbol}{parseFloat(savings.annualCostOld).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs w-24 text-muted-foreground">WA Solution</span>
                  <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-wa-green-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${costWidths.waWidth}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {currencySymbol}{parseFloat(savings.annualCostWA).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Numbers Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="text-center p-3 bg-white dark:bg-card rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Annual Cost (Old Solution)</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-foreground">
                    {currencySymbol}{parseFloat(savings.annualCostOld).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    {currencySymbol}{parseFloat(savings.annualCostWA).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Lifetime improvement:</span>
                    <span className="font-semibold text-wa-green-700 dark:text-primary">{savings.lifetimeRatio}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parts/year (reduced):</span>
                    <span>{savings.waPartsPerYear}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-center p-3 bg-wa-green-100 dark:bg-primary/20 rounded-lg border-2 border-wa-green-300 dark:border-primary">
                  <p className="text-xs text-wa-green-700 dark:text-primary mb-1">Total Annual Savings</p>
                  <p className="text-3xl font-bold text-wa-green-700 dark:text-primary">
                    {currencySymbol}{parseFloat(savings.totalAnnualSavings).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm font-semibold text-wa-green-600 dark:text-primary/80 mt-1">
                    {savings.savingsPercentage}% reduction
                  </p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Parts savings:</span>
                    <span>{currencySymbol}{savings.partsSavings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Event savings:</span>
                    <span>{currencySymbol}{savings.eventSavings}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

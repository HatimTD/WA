'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Clock, Package, Wrench, AlertCircle, Sparkles, TrendingDown } from 'lucide-react';

// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', AUD: 'A$', CAD: 'C$',
  CHF: 'CHF', JPY: '¥', CNY: '¥', MAD: 'MAD',
};

function waGetCurrencySymbol(currency: string | null | undefined): string {
  return CURRENCY_SYMBOLS[currency || 'EUR'] || '€';
}

type CostCalculatorData = {
  costOfPart?: number | null;
  costOfWaSolution?: number | null;
  oldSolutionLifetimeDays?: number | null;
  waSolutionLifetimeDays?: number | null;
  partsUsedPerYear?: number | null;
  maintenanceRepairCostBefore?: number | null;
  maintenanceRepairCostAfter?: number | null;
  disassemblyCostBefore?: number | null;
  disassemblyCostAfter?: number | null;
  downtimeCostPerEvent?: number | null;
  currency?: string | null;
  extraBenefits?: string | null;
  totalCostBefore: number;
  totalCostAfter: number;
  annualSavings: number;
  savingsPercentage: number;
  // Legacy fields (for backwards compatibility)
  materialCostBefore?: number | null;
  materialCostAfter?: number | null;
  laborCostBefore?: number | null;
  laborCostAfter?: number | null;
  downtimeCostBefore?: number | null;
  downtimeCostAfter?: number | null;
  maintenanceFrequencyBefore?: number | null;
  maintenanceFrequencyAfter?: number | null;
};

type CostCalculatorDisplayProps = {
  data: CostCalculatorData;
};

export default function CostCalculatorDisplay({ data }: CostCalculatorDisplayProps) {
  const currencySymbol = waGetCurrencySymbol(data.currency);
  const isNewFormula = data.costOfPart !== null && data.costOfPart !== undefined && data.costOfPart > 0;

  const waFormatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return `${currencySymbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const waFormatDays = (days: number | null | undefined) => {
    if (days === null || days === undefined || days === 0) return '-';
    if (days >= 365) return `${(days / 365).toFixed(1)} years`;
    if (days >= 30) return `${(days / 30).toFixed(1)} months`;
    if (days >= 7) return `${(days / 7).toFixed(1)} weeks`;
    return `${days} days`;
  };

  const waGetCostComparisonWidths = () => {
    const oldCost = data.totalCostBefore || 0;
    const waCost = data.totalCostAfter || 0;
    const maxCost = Math.max(oldCost, waCost);
    if (maxCost === 0) return { oldWidth: 50, waWidth: 50 };
    return { oldWidth: Math.round((oldCost / maxCost) * 100), waWidth: Math.round((waCost / maxCost) * 100) };
  };

  const waGetLifetimeComparisonWidths = () => {
    const oldLifetime = data.oldSolutionLifetimeDays || 0;
    const waLifetime = data.waSolutionLifetimeDays || 0;
    const maxLifetime = Math.max(oldLifetime, waLifetime);
    if (maxLifetime === 0) return { oldWidth: 50, waWidth: 50 };
    return { oldWidth: Math.round((oldLifetime / maxLifetime) * 100), waWidth: Math.round((waLifetime / maxLifetime) * 100) };
  };

  const waGetLifetimeMultiplier = () => {
    const oldLifetime = data.oldSolutionLifetimeDays || 0;
    const waLifetime = data.waSolutionLifetimeDays || 0;
    if (oldLifetime === 0 || waLifetime <= oldLifetime) return null;
    return (waLifetime / oldLifetime).toFixed(1);
  };

  const costWidths = waGetCostComparisonWidths();
  const lifetimeWidths = waGetLifetimeComparisonWidths();
  const lifetimeMultiplier = waGetLifetimeMultiplier();

  return (
    <Card role="article" className="dark:bg-card dark:border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-foreground">
          <Calculator className="h-5 w-5 text-green-600 dark:text-primary" />
          Cost Reduction Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Annual Cost Before</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{waFormatCurrency(data.totalCostBefore)}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Annual Cost After</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{waFormatCurrency(data.totalCostAfter)}</p>
          </div>
          <div className="bg-wa-green-50 dark:bg-wa-green-900/20 border border-wa-green-200 dark:border-wa-green-700 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-wa-green-700 dark:text-wa-green-300 mb-1">Annual Savings</p>
            <p className="text-3xl font-bold text-wa-green-600 dark:text-wa-green-400">{waFormatCurrency(data.annualSavings)}</p>
            <p className="text-lg font-semibold text-wa-green-500 mt-1">{data.savingsPercentage.toFixed(1)}% reduction</p>
          </div>
        </div>

        {/* Visual Cost Comparison Bars */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />Annual Cost Comparison
          </h5>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-600 dark:text-red-400 font-medium">Old Solution</span>
                <span className="text-red-600 dark:text-red-400 font-bold">{waFormatCurrency(data.totalCostBefore)}</span>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 dark:bg-red-600 rounded-full transition-all duration-500" style={{ width: `${costWidths.oldWidth}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-600 dark:text-green-400 font-medium">WA Solution</span>
                <span className="text-green-600 dark:text-green-400 font-bold">{waFormatCurrency(data.totalCostAfter)}</span>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 dark:bg-green-600 rounded-full transition-all duration-500" style={{ width: `${costWidths.waWidth}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown for New Formula */}
        {isNewFormula && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />Cost Breakdown
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Part Information</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cost of Part (A):</span>
                    <span className="font-medium dark:text-foreground">{waFormatCurrency(data.costOfPart)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cost of WA Solution (B):</span>
                    <span className="font-medium dark:text-foreground">{waFormatCurrency(data.costOfWaSolution)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Parts Used/Year (E):</span>
                    <span className="font-medium dark:text-foreground">{data.partsUsedPerYear || '-'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />Solution Lifetime Comparison
                </h5>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-red-600 dark:text-red-400">Old Solution:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{waFormatDays(data.oldSolutionLifetimeDays)}</span>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 dark:bg-red-600 rounded-full transition-all duration-500" style={{ width: `${lifetimeWidths.oldWidth}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-green-600 dark:text-green-400">WA Solution:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{waFormatDays(data.waSolutionLifetimeDays)}</span>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 dark:bg-green-600 rounded-full transition-all duration-500" style={{ width: `${lifetimeWidths.waWidth}%` }} />
                    </div>
                  </div>
                  {lifetimeMultiplier && (
                    <div className="text-center pt-2 border-t dark:border-gray-700">
                      <span className="text-wa-green-600 dark:text-wa-green-400 font-bold text-sm">WA solution lasts {lifetimeMultiplier}x longer!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Before/After Event Costs */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <h5 className="font-medium text-red-700 dark:text-red-300 mb-3">Before (Old Solution)</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">Maintenance/Repair (F):</span>
                    <span className="font-medium dark:text-foreground">{waFormatCurrency(data.maintenanceRepairCostBefore)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">Disassembly Cost (G):</span>
                    <span className="font-medium dark:text-foreground">{waFormatCurrency(data.disassemblyCostBefore)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">Downtime/Event (H):</span>
                    <span className="font-medium dark:text-foreground">{waFormatCurrency(data.downtimeCostPerEvent)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h5 className="font-medium text-green-700 dark:text-green-300 mb-3">After (WA Solution)</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400">Maintenance/Repair (F):</span>
                    <span className="font-medium dark:text-foreground">{waFormatCurrency(data.maintenanceRepairCostAfter)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400">Disassembly Cost (G):</span>
                    <span className="font-medium dark:text-foreground">{waFormatCurrency(data.disassemblyCostAfter)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400">Downtime/Event (H):</span>
                    <span className="font-medium dark:text-foreground">{waFormatCurrency(data.downtimeCostPerEvent)}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Formula Explanation */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />Formula Used
              </h5>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">Annual Cost = (A × E) + (E − 1) × (F + G + H)</p>
              <p className="text-xs text-blue-500 mt-1">Where: A = Cost of Part, E = Parts/Year, F = Maintenance, G = Disassembly, H = Downtime</p>
            </div>
          </div>
        )}

        {/* Legacy Formula Display */}
        {!isNewFormula && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" />Cost Breakdown (Legacy)
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <h5 className="font-medium text-red-700 dark:text-red-300 mb-3">Before</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Material Cost:</span><span className="font-medium">{waFormatCurrency(data.materialCostBefore)}</span></div>
                  <div className="flex justify-between"><span>Labor Cost:</span><span className="font-medium">{waFormatCurrency(data.laborCostBefore)}</span></div>
                  <div className="flex justify-between"><span>Downtime Cost:</span><span className="font-medium">{waFormatCurrency(data.downtimeCostBefore)}</span></div>
                  <div className="flex justify-between"><span>Maintenance Freq:</span><span className="font-medium">{data.maintenanceFrequencyBefore || '-'}x/year</span></div>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h5 className="font-medium text-green-700 dark:text-green-300 mb-3">After</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Material Cost:</span><span className="font-medium">{waFormatCurrency(data.materialCostAfter)}</span></div>
                  <div className="flex justify-between"><span>Labor Cost:</span><span className="font-medium">{waFormatCurrency(data.laborCostAfter)}</span></div>
                  <div className="flex justify-between"><span>Downtime Cost:</span><span className="font-medium">{waFormatCurrency(data.downtimeCostAfter)}</span></div>
                  <div className="flex justify-between"><span>Maintenance Freq:</span><span className="font-medium">{data.maintenanceFrequencyAfter || '-'}x/year</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Extra Benefits */}
        {data.extraBenefits && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <h5 className="font-medium text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />Additional Benefits
            </h5>
            <p className="text-sm text-purple-600 dark:text-purple-400 whitespace-pre-wrap">{data.extraBenefits}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

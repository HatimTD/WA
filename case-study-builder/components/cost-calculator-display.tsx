'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingDown, Calculator, Clock, Package, Wrench, AlertCircle } from 'lucide-react';

// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', AUD: 'A$', CAD: 'C$',
  CHF: 'CHF', JPY: '¥', CNY: '¥', MAD: 'MAD',
};

function getCurrencySymbol(currency: string | null | undefined): string {
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
  const currencySymbol = getCurrencySymbol(data.currency);

  // Check if using new formula (has costOfPart) or legacy formula
  const isNewFormula = data.costOfPart !== null && data.costOfPart !== undefined && data.costOfPart > 0;

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return `${currencySymbol}${value.toLocaleString()}`;
  };

  const formatDays = (days: number | null | undefined) => {
    if (days === null || days === undefined || days === 0) return '-';
    if (days >= 365) {
      const years = (days / 365).toFixed(1);
      return `${years} years`;
    }
    if (days >= 30) {
      const months = (days / 30).toFixed(1);
      return `${months} months`;
    }
    if (days >= 7) {
      const weeks = (days / 7).toFixed(1);
      return `${weeks} weeks`;
    }
    return `${days} days`;
  };

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
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(data.totalCostBefore)}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Annual Cost After</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(data.totalCostAfter)}
            </p>
          </div>
          <div className="bg-wa-green-50 dark:bg-wa-green-900/20 border border-wa-green-200 dark:border-wa-green-700 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-wa-green-700 dark:text-wa-green-300 mb-1">Annual Savings</p>
            <p className="text-3xl font-bold text-wa-green-600 dark:text-wa-green-400">
              {formatCurrency(data.annualSavings)}
            </p>
            <p className="text-lg font-semibold text-wa-green-500 dark:text-wa-green-500 mt-1">
              {data.savingsPercentage}% reduction
            </p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        {isNewFormula ? (
          // New Formula Display
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Cost Breakdown (New Formula)
            </h4>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Part Costs */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Part Information</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cost of Part (A):</span>
                    <span className="font-medium dark:text-foreground">{formatCurrency(data.costOfPart)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cost of WA Solution:</span>
                    <span className="font-medium dark:text-foreground">{formatCurrency(data.costOfWaSolution)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Parts Used/Year (E):</span>
                    <span className="font-medium dark:text-foreground">{data.partsUsedPerYear || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Lifetime */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Solution Lifetime
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Old Solution:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">{formatDays(data.oldSolutionLifetimeDays)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">WA Solution:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{formatDays(data.waSolutionLifetimeDays)}</span>
                  </div>
                  {data.oldSolutionLifetimeDays && data.waSolutionLifetimeDays && data.waSolutionLifetimeDays > data.oldSolutionLifetimeDays && (
                    <div className="flex justify-between pt-2 border-t dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Lifetime Improvement:</span>
                      <span className="font-bold text-wa-green-600 dark:text-wa-green-400">
                        {((data.waSolutionLifetimeDays / data.oldSolutionLifetimeDays - 1) * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Before/After Comparison */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <h5 className="font-medium text-red-700 dark:text-red-300 mb-3">Before (Old Solution)</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">Maintenance/Repair (F):</span>
                    <span className="font-medium dark:text-foreground">{formatCurrency(data.maintenanceRepairCostBefore)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">Disassembly Cost (G):</span>
                    <span className="font-medium dark:text-foreground">{formatCurrency(data.disassemblyCostBefore)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">Downtime/Event (H):</span>
                    <span className="font-medium dark:text-foreground">{formatCurrency(data.downtimeCostPerEvent)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h5 className="font-medium text-green-700 dark:text-green-300 mb-3">After (WA Solution)</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400">Maintenance/Repair (F):</span>
                    <span className="font-medium dark:text-foreground">{formatCurrency(data.maintenanceRepairCostAfter)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400">Disassembly Cost (G):</span>
                    <span className="font-medium dark:text-foreground">{formatCurrency(data.disassemblyCostAfter)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400">Downtime/Event (H):</span>
                    <span className="font-medium dark:text-foreground">{formatCurrency(data.downtimeCostPerEvent)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formula Explanation */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Formula Used
              </h5>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                Annual Cost = (A × E) + (E − 1) × (F + G + H)
              </p>
              <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
                Where: A = Cost of Part, E = Parts/Year, F = Maintenance, G = Disassembly, H = Downtime
              </p>
            </div>
          </div>
        ) : (
          // Legacy Formula Display
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Cost Breakdown (Legacy)
            </h4>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <h5 className="font-medium text-red-700 dark:text-red-300 mb-3">Before</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Material Cost:</span>
                    <span className="font-medium">{formatCurrency(data.materialCostBefore)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Labor Cost:</span>
                    <span className="font-medium">{formatCurrency(data.laborCostBefore)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Downtime Cost:</span>
                    <span className="font-medium">{formatCurrency(data.downtimeCostBefore)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maintenance Freq:</span>
                    <span className="font-medium">{data.maintenanceFrequencyBefore || '-'}x/year</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h5 className="font-medium text-green-700 dark:text-green-300 mb-3">After</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Material Cost:</span>
                    <span className="font-medium">{formatCurrency(data.materialCostAfter)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Labor Cost:</span>
                    <span className="font-medium">{formatCurrency(data.laborCostAfter)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Downtime Cost:</span>
                    <span className="font-medium">{formatCurrency(data.downtimeCostAfter)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maintenance Freq:</span>
                    <span className="font-medium">{data.maintenanceFrequencyAfter || '-'}x/year</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Extra Benefits */}
        {data.extraBenefits && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <h5 className="font-medium text-purple-700 dark:text-purple-300 mb-2">Additional Benefits</h5>
            <p className="text-sm text-purple-600 dark:text-purple-400 whitespace-pre-wrap">
              {data.extraBenefits}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

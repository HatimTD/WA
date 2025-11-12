'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, TrendingDown, DollarSign, Clock, Package, Users } from 'lucide-react';
import { saveCostCalculation } from '@/lib/actions/cost-calculator-actions';

type CostCalculatorProps = {
  caseStudyId: string;
  existingData?: {
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

export default function CostCalculator({ caseStudyId, existingData }: CostCalculatorProps) {
  const [values, setValues] = useState({
    materialCostBefore: existingData?.materialCostBefore || 0,
    materialCostAfter: existingData?.materialCostAfter || 0,
    laborCostBefore: existingData?.laborCostBefore || 0,
    laborCostAfter: existingData?.laborCostAfter || 0,
    downtimeCostBefore: existingData?.downtimeCostBefore || 0,
    downtimeCostAfter: existingData?.downtimeCostAfter || 0,
    maintenanceFrequencyBefore: existingData?.maintenanceFrequencyBefore || 12,
    maintenanceFrequencyAfter: existingData?.maintenanceFrequencyAfter || 4,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Auto-calculate totals and savings
  const totalCostBefore =
    values.materialCostBefore +
    values.laborCostBefore +
    values.downtimeCostBefore;

  const totalCostAfter =
    values.materialCostAfter +
    values.laborCostAfter +
    values.downtimeCostAfter;

  const annualSavings = totalCostBefore - totalCostAfter;
  const savingsPercentage = totalCostBefore > 0
    ? Math.round((annualSavings / totalCostBefore) * 100)
    : 0;

  const frequencyReduction = values.maintenanceFrequencyBefore - values.maintenanceFrequencyAfter;
  const frequencyReductionPercent = values.maintenanceFrequencyBefore > 0
    ? Math.round((frequencyReduction / values.maintenanceFrequencyBefore) * 100)
    : 0;

  const handleChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setValues({ ...values, [field]: numValue });
  };

  const handleSave = async () => {
    console.log('[CostCalculator] Save button clicked');
    console.log('[CostCalculator] Case Study ID:', caseStudyId);
    console.log('[CostCalculator] Current values:', values);
    console.log('[CostCalculator] Calculated totals:', {
      totalCostBefore,
      totalCostAfter,
      annualSavings,
      savingsPercentage,
    });

    setIsSaving(true);
    setSaveMessage('');

    try {
      console.log('[CostCalculator] Calling saveCostCalculation...');
      const result = await saveCostCalculation({
        caseStudyId,
        ...values,
        totalCostBefore,
        totalCostAfter,
        annualSavings,
        savingsPercentage,
      });

      console.log('[CostCalculator] Result received:', result);

      if (result.success) {
        setSaveMessage('Cost calculation saved successfully!');
        console.log('[CostCalculator] Save successful');
      } else {
        setSaveMessage('Error saving calculation');
        console.error('[CostCalculator] Save failed:', result);
      }
    } catch (error) {
      setSaveMessage('Error saving calculation');
      console.error('[CostCalculator] Exception during save:', error);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
      console.log('[CostCalculator] Save operation completed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Calculator className="h-6 w-6 text-blue-600" />
            Cost Reduction Calculator
          </CardTitle>
          <CardDescription>
            Calculate the total cost savings from implementing Welding Alloys solutions
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Input Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Material Costs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-purple-600" />
              Material Costs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="materialCostBefore">Before (Annual)</Label>
              <Input
                id="materialCostBefore"
                type="number"
                step="0.01"
                value={values.materialCostBefore || ''}
                onChange={(e) => handleChange('materialCostBefore', e.target.value)}
                placeholder="$0.00"
              />
            </div>
            <div>
              <Label htmlFor="materialCostAfter">After (Annual)</Label>
              <Input
                id="materialCostAfter"
                type="number"
                step="0.01"
                value={values.materialCostAfter || ''}
                onChange={(e) => handleChange('materialCostAfter', e.target.value)}
                placeholder="$0.00"
              />
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-gray-700">Savings:</p>
              <p className="text-2xl font-bold text-green-600">
                ${(values.materialCostBefore - values.materialCostAfter).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Labor Costs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-600" />
              Labor Costs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="laborCostBefore">Before (Annual)</Label>
              <Input
                id="laborCostBefore"
                type="number"
                step="0.01"
                value={values.laborCostBefore || ''}
                onChange={(e) => handleChange('laborCostBefore', e.target.value)}
                placeholder="$0.00"
              />
            </div>
            <div>
              <Label htmlFor="laborCostAfter">After (Annual)</Label>
              <Input
                id="laborCostAfter"
                type="number"
                step="0.01"
                value={values.laborCostAfter || ''}
                onChange={(e) => handleChange('laborCostAfter', e.target.value)}
                placeholder="$0.00"
              />
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-gray-700">Savings:</p>
              <p className="text-2xl font-bold text-green-600">
                ${(values.laborCostBefore - values.laborCostAfter).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Downtime Costs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-orange-600" />
              Downtime Costs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="downtimeCostBefore">Before (Annual)</Label>
              <Input
                id="downtimeCostBefore"
                type="number"
                step="0.01"
                value={values.downtimeCostBefore || ''}
                onChange={(e) => handleChange('downtimeCostBefore', e.target.value)}
                placeholder="$0.00"
              />
            </div>
            <div>
              <Label htmlFor="downtimeCostAfter">After (Annual)</Label>
              <Input
                id="downtimeCostAfter"
                type="number"
                step="0.01"
                value={values.downtimeCostAfter || ''}
                onChange={(e) => handleChange('downtimeCostAfter', e.target.value)}
                placeholder="$0.00"
              />
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-gray-700">Savings:</p>
              <p className="text-2xl font-bold text-green-600">
                ${(values.downtimeCostBefore - values.downtimeCostAfter).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Frequency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="h-5 w-5 text-green-600" />
              Maintenance Frequency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maintenanceFrequencyBefore">Before (times/year)</Label>
              <Input
                id="maintenanceFrequencyBefore"
                type="number"
                value={values.maintenanceFrequencyBefore || ''}
                onChange={(e) => handleChange('maintenanceFrequencyBefore', e.target.value)}
                placeholder="12"
              />
            </div>
            <div>
              <Label htmlFor="maintenanceFrequencyAfter">After (times/year)</Label>
              <Input
                id="maintenanceFrequencyAfter"
                type="number"
                value={values.maintenanceFrequencyAfter || ''}
                onChange={(e) => handleChange('maintenanceFrequencyAfter', e.target.value)}
                placeholder="4"
              />
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm font-medium text-gray-700">Reduction:</p>
              <p className="text-2xl font-bold text-green-600">
                {frequencyReduction} times ({frequencyReductionPercent}%)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <DollarSign className="h-6 w-6 text-green-600" />
            Total Annual Savings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Cost Before</p>
              <p className="text-3xl font-bold text-gray-800">
                ${totalCostBefore.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Cost After</p>
              <p className="text-3xl font-bold text-blue-600">
                ${totalCostAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Annual Savings</p>
              <p className="text-4xl font-bold text-green-600">
                ${annualSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-lg font-semibold text-green-700 mt-1">
                {savingsPercentage}% Reduction
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Calculator className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Calculation'}
        </Button>
        {saveMessage && (
          <p className={`text-sm font-medium ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {saveMessage}
          </p>
        )}
      </div>
    </div>
  );
}

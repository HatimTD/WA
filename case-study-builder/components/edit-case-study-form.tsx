'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import StepOne from '@/components/case-study-form/step-one';
import StepTwo from '@/components/case-study-form/step-two';
import StepThree from '@/components/case-study-form/step-three';
import StepFour from '@/components/case-study-form/step-four';
import StepFive from '@/components/case-study-form/step-five';
import StepWPS from '@/components/case-study-form/step-wps';
import StepCostCalculator from '@/components/case-study-form/step-cost-calculator';
import ChallengeQualifier, { QualifierResult } from '@/components/case-study-form/challenge-qualifier';
import NetSuiteCustomerSearch from '@/components/netsuite-customer-search';
import { NetSuiteCustomer } from '@/lib/integrations/netsuite';
import { waUpdateCaseStudy } from '@/lib/actions/waCaseStudyActions';
import { waSaveWeldingProcedure } from '@/lib/actions/waWpsActions';
import { waSaveCostCalculation } from '@/lib/actions/waCostCalculatorActions';
import { CostCalculatorValues } from '@/components/cost-calculator';
import { toast } from 'sonner';
import { WaCaseStudy, WaWeldingProcedure, WaCostCalculator } from '@prisma/client';
import type { CaseStudyFormData } from '@/app/dashboard/new/page';

// Re-export for backward compatibility
export type { CaseStudyFormData };

type Props = {
  caseStudy: WaCaseStudy;
  wpsData?: WaWeldingProcedure | null;
  costCalcData?: WaCostCalculator | null;
};

// Helper: Check if a string field has meaningful content
function waHasValue(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim() !== '';
}

// Helper: Check if WPS is complete (all required fields filled)
function waIsWpsComplete(wpsData: WaWeldingProcedure | null | undefined): boolean {
  if (!wpsData) return false;

  // Check all required string fields have meaningful content
  const requiredFields = [
    wpsData.baseMetalType,
    wpsData.surfacePreparation,
    wpsData.waProductName,
    wpsData.shieldingGas,
    wpsData.weldingProcess,
    wpsData.weldingPosition,
    wpsData.additionalNotes,
  ];

  // All required fields must have values
  if (requiredFields.some(field => !waHasValue(field))) {
    return false;
  }

  // At least one oscillation field must be filled
  if (!waHasValue(wpsData.oscillationWidth) && !waHasValue(wpsData.oscillationSpeed)) {
    return false;
  }

  // At least one temperature field must be filled
  if (!waHasValue(wpsData.preheatTemperature) && !waHasValue(wpsData.interpassTemperature)) {
    return false;
  }

  return true;
}

// Calculate the first incomplete step for resuming drafts
function waCalculateResumeStep(
  caseStudy: WaCaseStudy,
  wpsData: WaWeldingProcedure | null | undefined,
  caseType: 'APPLICATION' | 'TECH' | 'STAR'
): number {
  // Step 1: Case Type - always complete if we have a case

  // Step 2: Qualifier - check if customer selected and qualifier completed
  if (!waHasValue(caseStudy.customerName) || !caseStudy.qualifierType) {
    return 2; // Qualifier
  }

  // Step 3: Basic Info
  if (!waHasValue(caseStudy.title) || !waHasValue(caseStudy.customerName) || !waHasValue(caseStudy.industry) ||
      !waHasValue(caseStudy.location) || !waHasValue(caseStudy.componentWorkpiece) ||
      !caseStudy.workType || !caseStudy.wearType ||
      (caseStudy.wearType as string[]).length === 0 ||
      !waHasValue(caseStudy.baseMetal) || !waHasValue(caseStudy.generalDimensions)) {
    return 3; // Basic Info
  }

  // Step 4: Problem
  if (!waHasValue(caseStudy.problemDescription) || !waHasValue(caseStudy.previousSolution)) {
    return 4; // Problem
  }

  // Step 5: Solution
  if (!waHasValue(caseStudy.waSolution) || !waHasValue(caseStudy.waProduct) ||
      !waHasValue(caseStudy.technicalAdvantages)) {
    return 5; // Solution
  }

  // Step 6: WPS (for TECH and STAR)
  if (caseType === 'TECH' || caseType === 'STAR') {
    if (!waIsWpsComplete(wpsData)) {
      return 6; // WPS
    }
  }

  // Step 7 (or 6 for APPLICATION): Review - check financial fields and images
  // Note: Financial fields are numbers/Decimals, check if they exist and are > 0
  // customerSavingsAmount is now optional, so we don't check for it
  const reviewStep = (caseType === 'TECH' || caseType === 'STAR') ? 7 : 6;
  const hasValidRevenue = caseStudy.solutionValueRevenue !== null && caseStudy.solutionValueRevenue !== undefined;
  const hasValidAnnualRevenue = caseStudy.annualPotentialRevenue !== null && caseStudy.annualPotentialRevenue !== undefined;
  const hasImages = caseStudy.images && (caseStudy.images as string[]).length >= 1;

  if (!hasValidRevenue || !hasValidAnnualRevenue || !hasImages) {
    return reviewStep; // Review
  }

  // All complete - go to last step (Review)
  return reviewStep;
}

export default function EditCaseStudyForm({ caseStudy, wpsData, costCalcData }: Props) {
  const router = useRouter();
  const caseType = caseStudy.type as 'APPLICATION' | 'TECH' | 'STAR';

  // For DRAFT: resume from first incomplete step; For others: start at step 1
  const initialStep = caseStudy.status === 'DRAFT'
    ? waCalculateResumeStep(caseStudy, wpsData, caseType)
    : 1;

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref to store full cost calculator values from CostCalculator component
  const costCalcValuesRef = useRef<CostCalculatorValues | null>(
    costCalcData ? {
      materialCostBefore: Number(costCalcData.materialCostBefore) || 0,
      materialCostAfter: Number(costCalcData.materialCostAfter) || 0,
      laborCostBefore: Number(costCalcData.laborCostBefore) || 0,
      laborCostAfter: Number(costCalcData.laborCostAfter) || 0,
      downtimeCostBefore: Number(costCalcData.downtimeCostBefore) || 0,
      downtimeCostAfter: Number(costCalcData.downtimeCostAfter) || 0,
      maintenanceFrequencyBefore: costCalcData.maintenanceFrequencyBefore || 0,
      maintenanceFrequencyAfter: costCalcData.maintenanceFrequencyAfter || 0,
      costOfPart: Number(costCalcData.costOfPart) || 0,
      oldSolutionLifetimeDays: costCalcData.oldSolutionLifetimeDays || 0,
      waSolutionLifetimeDays: costCalcData.waSolutionLifetimeDays || 0,
      partsUsedPerYear: costCalcData.partsUsedPerYear || 0,
      maintenanceRepairCostBefore: Number(costCalcData.maintenanceRepairCostBefore) || 0,
      maintenanceRepairCostAfter: Number(costCalcData.maintenanceRepairCostAfter) || 0,
      disassemblyCostBefore: Number(costCalcData.disassemblyCostBefore) || 0,
      disassemblyCostAfter: Number(costCalcData.disassemblyCostAfter) || 0,
      extraBenefits: costCalcData.extraBenefits || '',
      totalCostBefore: Number(costCalcData.totalCostBefore) || 0,
      totalCostAfter: Number(costCalcData.totalCostAfter) || 0,
      annualSavings: Number(costCalcData.annualSavings) || 0,
      savingsPercentage: costCalcData.savingsPercentage || 0,
    } : null
  );

  // Pre-fill form data with existing case study values
  const [formData, setFormData] = useState<CaseStudyFormData>({
    type: caseStudy.type as 'APPLICATION' | 'TECH' | 'STAR',
    // Load qualifier data from database
    customerSelected: !!caseStudy.customerName, // If customer exists, it was selected
    qualifierType: caseStudy.qualifierType as 'NEW_CUSTOMER' | 'CROSS_SELL' | 'MAINTENANCE' | undefined,
    isTarget: caseStudy.isTarget ?? false, // Load from DB or default to false (matches DB default)
    qualifierCompleted: !!caseStudy.qualifierType, // Completed if qualifierType exists
    title: caseStudy.title || '',
    customerName: caseStudy.customerName,
    industry: caseStudy.industry,
    location: caseStudy.location,
    country: caseStudy.country || '',
    componentWorkpiece: caseStudy.componentWorkpiece,
    workType: caseStudy.workType as 'WORKSHOP' | 'ON_SITE' | 'BOTH',
    jobType: ((caseStudy as any).jobType as 'PREVENTIVE' | 'CORRECTIVE' | 'IMPROVEMENT' | 'OTHER' | '') || '',
    jobTypeOther: (caseStudy as any).jobTypeOther || '',
    wearType: caseStudy.wearType as string[],
    wearTypeOthers: (caseStudy as any).wearTypeOthers || [],
    wearSeverities: (caseStudy as any).wearSeverities || {},
    baseMetal: caseStudy.baseMetal || '',
    generalDimensions: caseStudy.generalDimensions || '',
    oem: (caseStudy as any).oem || '',
    jobDurationHours: (caseStudy as any).jobDurationHours || '',
    jobDurationDays: (caseStudy as any).jobDurationDays || '',
    jobDurationWeeks: (caseStudy as any).jobDurationWeeks || '',
    unitSystem: ((caseStudy as any).unitSystem as 'METRIC' | 'IMPERIAL') || 'METRIC',
    problemDescription: caseStudy.problemDescription,
    previousSolution: caseStudy.previousSolution || '',
    previousServiceLife: caseStudy.previousServiceLife || '',
    // Granular previous service life fields
    previousServiceLifeHours: (caseStudy as any).previousServiceLifeHours || '',
    previousServiceLifeDays: (caseStudy as any).previousServiceLifeDays || '',
    previousServiceLifeWeeks: (caseStudy as any).previousServiceLifeWeeks || '',
    previousServiceLifeMonths: (caseStudy as any).previousServiceLifeMonths || '',
    previousServiceLifeYears: (caseStudy as any).previousServiceLifeYears || '',
    // Old solution job duration fields
    oldJobDurationHours: (caseStudy as any).oldJobDurationHours || '',
    oldJobDurationDays: (caseStudy as any).oldJobDurationDays || '',
    oldJobDurationWeeks: (caseStudy as any).oldJobDurationWeeks || '',
    competitorName: caseStudy.competitorName || '',
    waSolution: caseStudy.waSolution,
    waProduct: caseStudy.waProduct,
    waProductDiameter: (caseStudy as any).waProductDiameter || '',
    technicalAdvantages: caseStudy.technicalAdvantages || '',
    expectedServiceLife: caseStudy.expectedServiceLife || '',
    // Granular expected service life fields
    expectedServiceLifeHours: (caseStudy as any).expectedServiceLifeHours || '',
    expectedServiceLifeDays: (caseStudy as any).expectedServiceLifeDays || '',
    expectedServiceLifeWeeks: (caseStudy as any).expectedServiceLifeWeeks || '',
    expectedServiceLifeMonths: (caseStudy as any).expectedServiceLifeMonths || '',
    expectedServiceLifeYears: (caseStudy as any).expectedServiceLifeYears || '',
    solutionValueRevenue: caseStudy.solutionValueRevenue ? caseStudy.solutionValueRevenue.toString() : '',
    annualPotentialRevenue: caseStudy.annualPotentialRevenue ? caseStudy.annualPotentialRevenue.toString() : '',
    customerSavingsAmount: caseStudy.customerSavingsAmount ? caseStudy.customerSavingsAmount.toString() : '',
    images: caseStudy.images as string[],
    supportingDocs: caseStudy.supportingDocs as string[],
    tags: (caseStudy as any).tags || [],
    wps: wpsData ? {
      baseMetalType: wpsData.baseMetalType || undefined,
      baseMetalGrade: wpsData.baseMetalGrade || undefined,
      baseMetalThickness: wpsData.baseMetalThickness || undefined,
      surfacePreparation: wpsData.surfacePreparation || undefined,
      waProductName: wpsData.waProductName || undefined,
      waProductDiameter: wpsData.waProductDiameter || undefined,
      shieldingGas: wpsData.shieldingGas || undefined,
      shieldingFlowRate: wpsData.shieldingFlowRate || undefined,
      flux: wpsData.flux || undefined,
      standardDesignation: wpsData.standardDesignation || undefined,
      weldingProcess: wpsData.weldingProcess || undefined,
      currentType: wpsData.currentType || undefined,
      currentModeSynergy: wpsData.currentModeSynergy || undefined,
      wireFeedSpeed: wpsData.wireFeedSpeed || undefined,
      intensity: wpsData.intensity || undefined,
      voltage: wpsData.voltage || undefined,
      heatInput: wpsData.heatInput || undefined,
      weldingPosition: wpsData.weldingPosition || undefined,
      torchAngle: wpsData.torchAngle || undefined,
      stickOut: wpsData.stickOut || undefined,
      travelSpeed: wpsData.travelSpeed || undefined,
      oscillationWidth: wpsData.oscillationWidth || undefined,
      oscillationSpeed: wpsData.oscillationSpeed || undefined,
      oscillationStepOver: wpsData.oscillationStepOver || undefined,
      oscillationTempo: wpsData.oscillationTempo || undefined,
      preheatTemperature: wpsData.preheatTemperature || undefined,
      interpassTemperature: wpsData.interpassTemperature || undefined,
      postheatTemperature: wpsData.postheatTemperature || undefined,
      pwhtDetails: wpsData.pwhtDetails || undefined,
      layerNumbers: wpsData.layerNumbers || undefined,
      hardness: wpsData.hardness || undefined,
      defectsObserved: wpsData.defectsObserved || undefined,
      additionalNotes: wpsData.additionalNotes || undefined,
    } : undefined,
    // Cost calculator form data - loaded from database
    costCalculator: costCalcData ? {
      costOfPart: costCalcData.costOfPart?.toString() || '',
      costOfWaSolution: costCalcData.costOfWaSolution?.toString() || '',
      partsUsedPerYear: costCalcData.partsUsedPerYear?.toString() || '',
      // Convert days back to days field (user can adjust if needed)
      oldLifetimeDays: costCalcData.oldSolutionLifetimeDays?.toString() || '',
      waLifetimeDays: costCalcData.waSolutionLifetimeDays?.toString() || '',
      maintenanceCostPerEvent: costCalcData.maintenanceRepairCostBefore?.toString() || '',
      disassemblyAssemblyCost: costCalcData.disassemblyCostBefore?.toString() || '',
      downtimeCostPerEvent: costCalcData.downtimeCostPerEvent?.toString() || '',
      currency: (costCalcData.currency as any) || 'EUR',
      extraBenefits: costCalcData.extraBenefits || '',
    } : undefined,
  });

  const updateFormData = (data: Partial<CaseStudyFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Dynamic steps based on case type (includes Qualifier step)
  const STEPS = useMemo(() => {
    const baseSteps = [
      { number: 1, title: 'Case Type', description: 'Select case study type' },
      { number: 2, title: 'Qualifier', description: 'Challenge qualification' },
      { number: 3, title: 'Basic Info', description: 'Customer and component details' },
      { number: 4, title: 'Problem', description: 'Describe the challenge' },
      { number: 5, title: 'Solution', description: 'WA solution details' },
    ];

    // Add WPS step for TECH and STAR cases
    if (formData.type === 'TECH' || formData.type === 'STAR') {
      baseSteps.push({ number: baseSteps.length + 1, title: 'WPS', description: 'Welding procedure specification' });
    }

    // Add Cost Calculator step for STAR cases only
    if (formData.type === 'STAR') {
      baseSteps.push({ number: baseSteps.length + 1, title: 'Cost Calculator', description: 'Cost reduction analysis' });
    }

    // Always add Review step last
    baseSteps.push({
      number: baseSteps.length + 1,
      title: 'Review',
      description: 'Additional details and review'
    });

    return baseSteps;
  }, [formData.type]);

  // Get missing fields for a step (returns array of field names that are missing)
  const getMissingFields = (step: number): string[] => {
    const currentStepData = STEPS.find(s => s.number === step);
    if (!currentStepData) return [];

    const missing: string[] = [];

    switch (currentStepData.title) {
      case 'Case Type':
        if (!formData.type) missing.push('Case Type');
        break;
      case 'Qualifier':
        if (!formData.customerName) missing.push('Customer Name');
        if (!formData.customerSelected) missing.push('Customer Selection (click a customer from the list)');
        if (!formData.qualifierCompleted) missing.push('Qualifier Questions');
        break;
      case 'Basic Info':
        if (!formData.title) missing.push('Case Study Title');
        if (!formData.customerName) missing.push('Customer Name');
        if (!formData.industry || formData.industry === '__CUSTOM__') missing.push('Industry');
        if (!formData.location) missing.push('Location');
        if (!formData.componentWorkpiece) missing.push('Component/Workpiece');
        if (!formData.workType) missing.push('Work Type');
        if (!formData.jobType) missing.push('Job Type');
        if (formData.jobType === 'OTHER' && !formData.jobTypeOther) missing.push('Job Type (specify)');
        if (!formData.wearType || formData.wearType.length === 0) missing.push('Type of Wear');
        // Check that at least one selected wear type has a severity (others are optional)
        const wearTypesWithSeverity = formData.wearType?.filter(
          type => formData.wearSeverities?.[type] && formData.wearSeverities[type] > 0
        );
        if (formData.wearType && formData.wearType.length > 0 && (!wearTypesWithSeverity || wearTypesWithSeverity.length === 0)) {
          missing.push('Wear Severity (set for at least one wear type)');
        }
        if (!formData.baseMetal) missing.push('Base Metal');
        if (!formData.generalDimensions) missing.push('General Dimensions');
        break;
      case 'Problem':
        if (!formData.problemDescription) missing.push('Problem Description');
        if (!formData.previousSolution) missing.push('Previous Solution');
        break;
      case 'Solution':
        if (!formData.waSolution) missing.push('WA Solution');
        if (!formData.waProduct) missing.push('WA Product');
        if (!formData.technicalAdvantages) missing.push('Technical Advantages');
        break;
      case 'WPS':
        if (!formData.wps?.baseMetalType) missing.push('Base Metal Type');
        if (!formData.wps?.surfacePreparation) missing.push('Surface Preparation');
        if (!formData.wps?.waProductName) missing.push('WA Product Name');
        if (!formData.wps?.shieldingGas) missing.push('Shielding Gas');
        if (!formData.wps?.weldingProcess) missing.push('Welding Process');
        if (!formData.wps?.weldingPosition) missing.push('Welding Position');
        if (!formData.wps?.oscillationWidth && !formData.wps?.oscillationSpeed) missing.push('Oscillation (Width or Speed)');
        if (!formData.wps?.preheatTemperature && !formData.wps?.interpassTemperature) missing.push('Temperature (Preheat or Interpass)');
        if (!formData.wps?.additionalNotes) missing.push('Additional WPS Notes');
        break;
      case 'Review':
        if (!formData.solutionValueRevenue) missing.push('Solution Value/Revenue');
        if (!formData.annualPotentialRevenue) missing.push('Annual Potential Revenue');
        // customerSavingsAmount is now optional
        if (!formData.images || formData.images.length < 1) missing.push('At least 1 image');
        break;
    }

    return missing;
  };

  const validateStep = (step: number): boolean => {
    return getMissingFields(step).length === 0;
  };

  const handleNext = () => {
    const missingFields = getMissingFields(currentStep);
    if (missingFields.length === 0) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    } else {
      // Show specific missing fields in toast
      const fieldList = missingFields.slice(0, 3).join(', ');
      const moreCount = missingFields.length > 3 ? ` and ${missingFields.length - 3} more` : '';
      toast.error(`Missing required fields: ${fieldList}${moreCount}`);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Handle cost calculator value changes from CostCalculator component
  const handleCostCalcChange = (values: CostCalculatorValues) => {
    costCalcValuesRef.current = values;
  };

  /**
   * Helper to convert mixed time units to total hours (for comparison)
   */
  const waConvertToTotalHours = (hours?: string, days?: string, weeks?: string, months?: string, years?: string): number => {
    const h = parseFloat(hours || '0') || 0;
    const d = parseFloat(days || '0') || 0;
    const w = parseFloat(weeks || '0') || 0;
    const m = parseFloat(months || '0') || 0;
    const y = parseFloat(years || '0') || 0;
    return h + (d * 24) + (w * 168) + (m * 730) + (y * 8760);
  };

  /**
   * Helper to convert cost calculator form data to database schema format
   */
  const waMapCostCalculatorData = (cc: NonNullable<typeof formData.costCalculator>, caseStudyId: string) => {
    const A = parseFloat(cc.costOfPart || '0') || 0;
    const B = parseFloat(cc.costOfWaSolution || '0') || 0;

    const oldLifetimeHours = waConvertToTotalHours(
      cc.oldLifetimeHours, cc.oldLifetimeDays, cc.oldLifetimeWeeks,
      cc.oldLifetimeMonths, cc.oldLifetimeYears
    );
    const waLifetimeHours = waConvertToTotalHours(
      cc.waLifetimeHours, cc.waLifetimeDays, cc.waLifetimeWeeks,
      cc.waLifetimeMonths, cc.waLifetimeYears
    );

    const C = oldLifetimeHours || parseFloat(cc.oldSolutionLifetime || '1') || 1;
    const D = waLifetimeHours || parseFloat(cc.waSolutionLifetime || '1') || 1;
    const E = parseInt(cc.partsUsedPerYear || '0') || 0;
    const F = parseFloat(cc.maintenanceCostPerEvent || '0') || 0;
    const G = parseFloat(cc.disassemblyAssemblyCost || '0') || 0;
    const H = parseFloat(cc.downtimeCostPerEvent || '0') || 0;

    const lifetimeRatio = D / C;
    const waPartsPerYear = E / lifetimeRatio;
    const annualCostOld = (A * E) + (E - 1) * (F + G + H);
    const annualCostWA = (B * waPartsPerYear) + Math.max(0, waPartsPerYear - 1) * (F + G + H);
    const annualSavings = annualCostOld - annualCostWA;
    const savingsPercentage = annualCostOld > 0 ? (annualSavings / annualCostOld) * 100 : 0;

    const materialCostBefore = A * E;
    const materialCostAfter = B * waPartsPerYear;
    const laborCostBefore = (E - 1) * G;
    const laborCostAfter = Math.max(0, waPartsPerYear - 1) * G;
    const downtimeCostBefore = (E - 1) * H;
    const downtimeCostAfter = Math.max(0, waPartsPerYear - 1) * H;
    const oldLifetimeDays = Math.round(C / 24);
    const waLifetimeDays = Math.round(D / 24);

    return {
      caseStudyId,
      materialCostBefore,
      materialCostAfter,
      laborCostBefore,
      laborCostAfter,
      downtimeCostBefore,
      downtimeCostAfter,
      maintenanceFrequencyBefore: E,
      maintenanceFrequencyAfter: Math.ceil(waPartsPerYear),
      costOfPart: A,
      costOfWaSolution: B,
      oldSolutionLifetimeDays: oldLifetimeDays || 1,
      waSolutionLifetimeDays: waLifetimeDays || 1,
      partsUsedPerYear: E,
      disassemblyCostBefore: G,
      disassemblyCostAfter: G,
      maintenanceRepairCostBefore: F,
      maintenanceRepairCostAfter: F,
      downtimeCostPerEvent: H,
      currency: cc.currency || 'EUR',
      extraBenefits: cc.extraBenefits || undefined,
      totalCostBefore: annualCostOld,
      totalCostAfter: annualCostWA,
      annualSavings,
      savingsPercentage,
    };
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const hasWPS = formData.type === 'TECH' || formData.type === 'STAR';

      // Convert string decimals to numbers
      const updateData: any = {
        ...formData,
        status: 'DRAFT',
        solutionValueRevenue: formData.solutionValueRevenue ? parseFloat(formData.solutionValueRevenue) : null,
        annualPotentialRevenue: formData.annualPotentialRevenue ? parseFloat(formData.annualPotentialRevenue) : null,
        customerSavingsAmount: formData.customerSavingsAmount ? parseFloat(formData.customerSavingsAmount) : null,
      };

      await waUpdateCaseStudy(caseStudy.id, updateData);

      // If TECH or STAR and WPS data exists, save WPS (save any filled data for drafts)
      if (hasWPS && formData.wps) {
        // Check if any WPS field has data
        const hasAnyWpsData = Object.values(formData.wps).some(v => v !== undefined && v !== '' && v !== null);
        if (hasAnyWpsData) {
          await waSaveWeldingProcedure({
            caseStudyId: caseStudy.id,
            waProductName: formData.wps.waProductName || '',
            weldingProcess: formData.wps.weldingProcess || '',
            ...formData.wps,
          });
        }
      }

      // If STAR and cost calculator data exists, save cost calculator
      if (formData.type === 'STAR' && formData.costCalculator) {
        const hasAnyCostData = Object.values(formData.costCalculator).some(v => v !== undefined && v !== '' && v !== null);
        if (hasAnyCostData) {
          const costCalcData = waMapCostCalculatorData(formData.costCalculator, caseStudy.id);
          await waSaveCostCalculation(costCalcData);
        }
      }

      toast.success('Changes saved as draft');
      router.push('/dashboard/my-cases');
    } catch (error) {
      toast.error('Failed to save changes');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    // Validate all required steps and collect missing fields
    const allMissingFields: string[] = [];
    for (let i = 1; i <= STEPS.length; i++) {
      const stepMissing = getMissingFields(i);
      allMissingFields.push(...stepMissing);
    }

    if (allMissingFields.length > 0) {
      const fieldList = allMissingFields.slice(0, 3).join(', ');
      const moreCount = allMissingFields.length > 3 ? ` and ${allMissingFields.length - 3} more` : '';
      toast.error(`Missing required fields: ${fieldList}${moreCount}`);
      return;
    }

    const hasWPS = formData.type === 'TECH' || formData.type === 'STAR';
    setIsSubmitting(true);
    try {
      // Determine the new status
      let newStatus = caseStudy.status;
      if (caseStudy.status === 'DRAFT' || caseStudy.status === 'REJECTED') {
        newStatus = 'SUBMITTED';
      }

      // Convert string decimals to numbers
      const updateData: any = {
        ...formData,
        status: newStatus,
        solutionValueRevenue: formData.solutionValueRevenue ? parseFloat(formData.solutionValueRevenue) : null,
        annualPotentialRevenue: formData.annualPotentialRevenue ? parseFloat(formData.annualPotentialRevenue) : null,
        customerSavingsAmount: formData.customerSavingsAmount ? parseFloat(formData.customerSavingsAmount) : null,
        submittedAt: newStatus === 'SUBMITTED' ? new Date() : caseStudy.submittedAt,
      };

      await waUpdateCaseStudy(caseStudy.id, updateData);

      // If TECH or STAR and WPS data exists, save WPS
      if (hasWPS && formData.wps) {
        await waSaveWeldingProcedure({
          caseStudyId: caseStudy.id,
          waProductName: formData.wps.waProductName || '',
          weldingProcess: formData.wps.weldingProcess || '',
          ...formData.wps,
        });
      }

      // If STAR and cost calculator data exists, save cost calculator
      if (formData.type === 'STAR' && formData.costCalculator) {
        const costCalcData = waMapCostCalculatorData(formData.costCalculator, caseStudy.id);
        await waSaveCostCalculation(costCalcData);
      }

      toast.success('Case study updated successfully!');
      router.push(`/dashboard/cases/${caseStudy.id}`);
    } catch (error) {
      toast.error('Failed to update case study');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header - Different titles based on status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
            {caseStudy.status === 'DRAFT' ? 'Continue Case Study' :
             caseStudy.status === 'REJECTED' ? 'Edit & Resubmit Case Study' :
             'Edit Case Study'}
          </h1>
          <p className="text-gray-600 dark:text-muted-foreground mt-2">
            {caseStudy.status === 'DRAFT' ? 'Pick up where you left off' :
             caseStudy.status === 'REJECTED' ? 'Address feedback and resubmit for approval' :
             'Update your case study information'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(caseStudy.status === 'DRAFT' ? '/dashboard/my-cases' : `/dashboard/cases/${caseStudy.id}`)}
          className="dark:border-border dark:text-foreground dark:hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {caseStudy.status === 'DRAFT' ? 'Back' : 'Cancel'}
        </Button>
      </div>

      {/* Progress */}
      <Card className="dark:bg-card dark:border-border">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              {STEPS.map((step) => {
                // Allow clicking on completed steps or current step
                const canNavigate = step.number <= currentStep;
                const handleStepClick = () => {
                  if (step.number < currentStep) {
                    // Navigate back to any previous step
                    setCurrentStep(step.number);
                  } else if (step.number > currentStep) {
                    // For forward navigation, validate current step first
                    const missingFields = getMissingFields(currentStep);
                    if (missingFields.length === 0) {
                      setCurrentStep(step.number);
                    } else {
                      const fieldList = missingFields.slice(0, 3).join(', ');
                      const moreCount = missingFields.length > 3 ? ` and ${missingFields.length - 3} more` : '';
                      toast.error(`Complete current step first: ${fieldList}${moreCount}`);
                    }
                  }
                };

                return (
                  <div
                    key={step.number}
                    className={`flex flex-col items-center flex-1 ${
                      step.number < STEPS.length ? 'relative' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={handleStepClick}
                      disabled={isSubmitting}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                        currentStep === step.number
                          ? 'bg-wa-green-600 text-white ring-2 ring-wa-green-300'
                          : currentStep > step.number
                          ? 'bg-green-700 text-white hover:bg-green-600 cursor-pointer'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer'
                      } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={canNavigate ? `Go to ${step.title}` : `Complete previous steps to access ${step.title}`}
                    >
                      {step.number}
                    </button>
                    <div className="text-xs mt-2 text-center">
                      <div className="font-semibold dark:text-foreground">{step.title}</div>
                      <div className="text-gray-500 dark:text-muted-foreground hidden sm:block">{step.description}</div>
                    </div>
                    {step.number < STEPS.length && (
                      <div
                        className={`absolute top-5 left-[60%] w-full h-0.5 ${
                          currentStep > step.number ? 'bg-green-600 dark:bg-green-600' : 'bg-gray-200 dark:bg-border'
                        }`}
                        style={{ zIndex: -1 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="dark:text-foreground">{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription className="dark:text-muted-foreground">{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {STEPS[currentStep - 1]?.title === 'Case Type' && (
            <StepOne formData={formData} updateFormData={updateFormData} />
          )}
          {STEPS[currentStep - 1]?.title === 'Qualifier' && (
            <div className="space-y-6">
              {/* Customer Search */}
              <NetSuiteCustomerSearch
                value={formData.customerName}
                onChange={(value) => {
                  if (!value) {
                    // Reset qualifier when customer is cleared
                    updateFormData({
                      customerName: '',
                      customerSelected: false,
                      qualifierCompleted: false,
                      qualifierType: undefined,
                      isTarget: false,
                      location: '',
                      country: '',
                      industry: '',
                    });
                  } else {
                    updateFormData({ customerName: value });
                  }
                }}
                onCustomerSelect={(customer: NetSuiteCustomer) => {
                  const updates: Partial<CaseStudyFormData> = {
                    customerName: customer.companyName,
                    customerSelected: true,
                    qualifierCompleted: false, // Need to re-answer qualifier questions
                    qualifierType: undefined,
                    isTarget: false,
                  };
                  if (customer.city) updates.location = customer.city;
                  if (customer.country) updates.country = customer.country;
                  if (customer.industry) updates.industry = customer.industry;
                  updateFormData(updates);
                }}
                label="Customer Name"
                required
                placeholder="Click to search customers..."
              />

              {/* Qualifier Questions - Only show after customer is selected */}
              {formData.customerSelected && (
                <ChallengeQualifier
                  key={formData.customerName}
                  customerName={formData.customerName}
                  initialQualifierType={formData.qualifierType}
                  initialIsTarget={formData.isTarget}
                  onComplete={(result: QualifierResult) => {
                    updateFormData({
                      qualifierType: result.qualifierType,
                      isTarget: result.isTarget,
                      qualifierCompleted: true,
                    });
                  }}
                  onReset={() => {
                    updateFormData({
                      qualifierType: undefined,
                      isTarget: false,
                      qualifierCompleted: false,
                    });
                  }}
                />
              )}

              {/* Show result if qualifier is completed */}
              {formData.qualifierCompleted && formData.qualifierType && (
                <div className={`p-4 rounded-lg border ${
                  formData.isTarget
                    ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                    : 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      formData.isTarget ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'
                    }`}>
                      {formData.isTarget ? '✓ Counts toward BHAG 10,000 goal' : 'ℹ Maintenance case (does not count toward BHAG)'}
                    </span>
                  </div>
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                    Qualifier Type: {formData.qualifierType?.replace('_', ' ')}
                  </p>
                </div>
              )}
            </div>
          )}
          {STEPS[currentStep - 1]?.title === 'Basic Info' && (
            <StepTwo
              formData={formData}
              updateFormData={updateFormData}
              customerReadOnly={formData.customerSelected}
            />
          )}
          {STEPS[currentStep - 1]?.title === 'Problem' && (
            <StepThree formData={formData} updateFormData={updateFormData} />
          )}
          {STEPS[currentStep - 1]?.title === 'Solution' && (
            <StepFour formData={formData} updateFormData={updateFormData} />
          )}
          {STEPS[currentStep - 1]?.title === 'WPS' && (
            <StepWPS formData={formData} updateFormData={updateFormData} />
          )}
          {STEPS[currentStep - 1]?.title === 'Cost Calculator' && (
            <StepCostCalculator formData={formData} updateFormData={updateFormData} />
          )}
          {STEPS[currentStep - 1]?.title === 'Review' && (
            <StepFive
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isSubmitting}
              className="dark:border-border dark:text-foreground dark:hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="dark:border-border dark:text-foreground dark:hover:bg-accent"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} disabled={isSubmitting}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' :
               caseStudy.status === 'DRAFT' ? 'Submit for Approval' :
               caseStudy.status === 'REJECTED' ? 'Resubmit for Approval' :
               'Save Changes'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

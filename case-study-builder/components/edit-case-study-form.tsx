'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Save, Building2, Loader2 } from 'lucide-react';
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
import { waUpdateCaseStudy, waGetCustomerIndustry } from '@/lib/actions/waCaseStudyActions';
import { waSaveWeldingProcedure } from '@/lib/actions/waWpsActions';
import { waSaveCostCalculation } from '@/lib/actions/waCostCalculatorActions';
import { waUploadDocument } from '@/lib/actions/waDocumentUploadActions';
import { CostCalculatorValues } from '@/components/cost-calculator';
import { useMasterList } from '@/lib/hooks/use-master-list';
import { toast } from 'sonner';
import { WaCaseStudy, WaWeldingProcedure, WaCostCalculator } from '@prisma/client';
import type { CaseStudyFormData } from '@/app/dashboard/new/page';

// Fallback industries if Master List API fails
const FALLBACK_INDUSTRIES = [
  { id: 'mining', value: 'Mining & Quarrying', sortOrder: 0 },
  { id: 'cement', value: 'Cement', sortOrder: 1 },
  { id: 'steel', value: 'Steel & Metal Processing', sortOrder: 2 },
  { id: 'power', value: 'Power Generation', sortOrder: 3 },
  { id: 'pulp', value: 'Pulp & Paper', sortOrder: 4 },
  { id: 'oil', value: 'Oil & Gas', sortOrder: 5 },
  { id: 'chemical', value: 'Chemical & Petrochemical', sortOrder: 6 },
  { id: 'marine', value: 'Marine', sortOrder: 7 },
  { id: 'agriculture', value: 'Agriculture', sortOrder: 8 },
  { id: 'construction', value: 'Construction', sortOrder: 9 },
  { id: 'recycling', value: 'Recycling', sortOrder: 10 },
  { id: 'other', value: 'Other', sortOrder: 11 },
];

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

  // Check base metal section
  if (!waHasValue(wpsData.baseMetalType) || !waHasValue(wpsData.surfacePreparation)) {
    return false;
  }

  // Check if layers exist (new structure)
  const layers = (wpsData as any).layers as Array<any> | undefined;
  if (layers && layers.length > 0) {
    const firstLayer = layers[0];
    // Check required fields in first layer
    if (!firstLayer.waProductName || !firstLayer.waProductDiameter ||
        !firstLayer.weldingProcess || !firstLayer.weldingPosition ||
        !firstLayer.torchAngle || !firstLayer.shieldingGas ||
        !firstLayer.stickOut || !firstLayer.currentType ||
        !firstLayer.currentModeSynergy || !firstLayer.wireFeedSpeed ||
        !firstLayer.intensity || !firstLayer.voltage || !firstLayer.travelSpeed) {
      return false;
    }
    return true;
  }

  // Legacy check for backward compatibility (no layers)
  const requiredFields = [
    wpsData.waProductName,
    wpsData.shieldingGas,
    wpsData.weldingProcess,
    wpsData.weldingPosition,
  ];

  // All required fields must have values
  if (requiredFields.some(field => !waHasValue(field))) {
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
  // If user saved draft with a specific step, return to that step
  const savedStep = (caseStudy as any).lastEditedStep;
  if (savedStep && savedStep >= 1) {
    return savedStep;
  }

  // Step 1: Case Study Type - always complete if we have a case

  // Step 2: Customer Info - check if customer selected and qualifier completed
  if (!waHasValue(caseStudy.customerName) || !caseStudy.qualifierType) {
    return 2; // Customer Info
  }

  // Step 3: Basic Info (title, customer, location, component, work type, job type)
  if (!waHasValue(caseStudy.title) || !waHasValue(caseStudy.customerName) || !waHasValue(caseStudy.industry) ||
      !waHasValue(caseStudy.location) || !waHasValue(caseStudy.componentWorkpiece) ||
      !caseStudy.workType) {
    return 3; // Basic Info
  }

  // Step 4: The Challenge (wear type and problem description)
  if (!caseStudy.wearType || (caseStudy.wearType as string[]).length === 0 ||
      !waHasValue(caseStudy.problemDescription)) {
    return 4; // The Challenge
  }

  // Step 5: The Solution (base metal, dimensions, solution details, and images)
  const hasImages = caseStudy.images && (caseStudy.images as string[]).length >= 1;
  if (!waHasValue(caseStudy.baseMetal) || !waHasValue(caseStudy.generalDimensions) ||
      !waHasValue(caseStudy.waSolution) || !waHasValue(caseStudy.waProduct) ||
      !waHasValue(caseStudy.technicalAdvantages) || !hasImages) {
    return 5; // The Solution
  }

  // Step 6: Welding Procedure (for TECH and STAR)
  if (caseType === 'TECH' || caseType === 'STAR') {
    if (!waIsWpsComplete(wpsData)) {
      return 6; // Welding Procedure
    }
  }

  // Calculate Finalize step number based on case type
  // APPLICATION: 6 steps (Type, Customer, Basic, Challenge, Solution, Finalize)
  // TECH: 7 steps (adds Welding Procedure)
  // STAR: 8 steps (adds Welding Procedure + Cost Reduction Analysis)
  const finalizeStep = caseType === 'STAR' ? 8 : (caseType === 'TECH' ? 7 : 6);

  // Step 7: Cost Reduction Analysis (for STAR only) - always optional, skip validation

  // Final step: Finalize - check financial fields
  // Note: Financial fields are numbers/Decimals, check if they exist
  // customerSavingsAmount is now optional, so we don't check for it
  const hasValidRevenue = caseStudy.solutionValueRevenue !== null && caseStudy.solutionValueRevenue !== undefined;
  const hasValidAnnualRevenue = caseStudy.annualPotentialRevenue !== null && caseStudy.annualPotentialRevenue !== undefined;

  if (!hasValidRevenue || !hasValidAnnualRevenue) {
    return finalizeStep; // Finalize
  }

  // All complete - go to last step (Finalize)
  return finalizeStep;
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
  const [industryLoading, setIndustryLoading] = useState(false);

  // Fetch master list for industries
  const { items: industries, isLoading: industriesLoading } = useMasterList('Industry', FALLBACK_INDUSTRIES);

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
    generalDescription: (caseStudy as any).generalDescription || '',
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
    jobDurationMonths: (caseStudy as any).jobDurationMonths || '',
    jobDurationYears: (caseStudy as any).jobDurationYears || '',
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
    revenueCurrency: (caseStudy as any).revenueCurrency || 'EUR',
    solutionValueRevenue: caseStudy.solutionValueRevenue ? caseStudy.solutionValueRevenue.toString() : '',
    annualPotentialRevenue: caseStudy.annualPotentialRevenue ? caseStudy.annualPotentialRevenue.toString() : '',
    customerSavingsAmount: caseStudy.customerSavingsAmount ? caseStudy.customerSavingsAmount.toString() : '',
    images: caseStudy.images as string[],
    supportingDocs: caseStudy.supportingDocs as string[],
    tags: (caseStudy as any).tags || [],
    wps: wpsData ? {
      // Base Metal
      baseMetalType: wpsData.baseMetalType || undefined,
      baseMetalGrade: wpsData.baseMetalGrade || undefined,
      baseMetalThickness: wpsData.baseMetalThickness || undefined,
      surfacePreparation: wpsData.surfacePreparation || undefined,
      surfacePreparationOther: (wpsData as any).surfacePreparationOther || undefined,
      // Layers (new multi-layer structure)
      layers: (wpsData as any).layers || undefined,
      // Legacy WA Product fields
      waProductName: wpsData.waProductName || undefined,
      waProductDiameter: wpsData.waProductDiameter || undefined,
      shieldingGas: wpsData.shieldingGas || undefined,
      shieldingFlowRate: wpsData.shieldingFlowRate || undefined,
      flux: wpsData.flux || undefined,
      standardDesignation: wpsData.standardDesignation || undefined,
      // Legacy Welding Parameters
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
      // Legacy Oscillation
      oscillationWidth: wpsData.oscillationWidth || undefined,
      oscillationSpeed: wpsData.oscillationSpeed || undefined,
      oscillationStepOver: wpsData.oscillationStepOver || undefined,
      oscillationTempo: wpsData.oscillationTempo || undefined,
      // Heating Procedure (new fields)
      preheatingTemp: (wpsData as any).preheatingTemp || undefined,
      interpassTemp: (wpsData as any).interpassTemp || undefined,
      postheatingTemp: (wpsData as any).postheatingTemp || undefined,
      // PWHT (new fields)
      pwhtRequired: (wpsData as any).pwhtRequired || undefined,
      pwhtHeatingRate: (wpsData as any).pwhtHeatingRate || undefined,
      pwhtTempHoldingTime: (wpsData as any).pwhtTempHoldingTime || undefined,
      pwhtCoolingRate: (wpsData as any).pwhtCoolingRate || undefined,
      // Legacy Temperature fields
      preheatTemperature: wpsData.preheatTemperature || undefined,
      interpassTemperature: wpsData.interpassTemperature || undefined,
      postheatTemperature: wpsData.postheatTemperature || undefined,
      pwhtDetails: wpsData.pwhtDetails || undefined,
      // Documents (new field)
      documents: (wpsData as any).documents || undefined,
      // Legacy Results
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
      { number: 1, title: 'Case Study Type', description: '' },
      { number: 2, title: 'Customer Info', description: '' },
      { number: 3, title: 'Basic Info', description: '' },
      { number: 4, title: 'The Challenge', description: '' },
      { number: 5, title: 'The Solution', description: '' },
    ];

    // Add WPS step for TECH and STAR cases
    if (formData.type === 'TECH' || formData.type === 'STAR') {
      baseSteps.push({ number: baseSteps.length + 1, title: 'Welding Procedure', description: '' });
    }

    // Add Cost Calculator step for STAR cases only
    if (formData.type === 'STAR') {
      baseSteps.push({ number: baseSteps.length + 1, title: 'Cost Reduction Analysis', description: '' });
    }

    // Always add Finalize step last
    baseSteps.push({
      number: baseSteps.length + 1,
      title: 'Finalize',
      description: ''
    });

    return baseSteps;
  }, [formData.type]);

  // Get missing fields for a step (returns array of field names that are missing)
  const getMissingFields = (step: number): string[] => {
    const currentStepData = STEPS.find(s => s.number === step);
    if (!currentStepData) return [];

    const missing: string[] = [];

    switch (currentStepData.title) {
      case 'Case Study Type':
        if (!formData.type) missing.push('Case Study Type');
        break;
      case 'Customer Info':
        if (!formData.customerName) missing.push('Customer Name');
        if (!formData.customerSelected) missing.push('Customer Selection (click a customer from the list)');
        if (!formData.industry || formData.industry === '__CUSTOM__') missing.push('Industry');
        if (!formData.qualifierCompleted) missing.push('Qualifier Questions');
        break;
      case 'Basic Info':
        if (!formData.title) missing.push('Industrial Challenge Title');
        if (!formData.customerName) missing.push('Customer Name');
        if (!formData.location) missing.push('Location');
        if (!formData.componentWorkpiece) missing.push('Component/Workpiece');
        if (!formData.workType) missing.push('Work Type');
        if (!formData.jobType) missing.push('Job Type');
        if (formData.jobType === 'OTHER' && !formData.jobTypeOther) missing.push('Job Type (specify)');
        break;
      case 'The Challenge':
        // Wear type validation
        if (!formData.wearType || formData.wearType.length === 0) missing.push('Type of Wear');
        // Check that at least one selected wear type has a severity
        const wearTypesWithSeverity = formData.wearType?.filter(
          type => formData.wearSeverities?.[type] && formData.wearSeverities[type] > 0
        );
        if (formData.wearType && formData.wearType.length > 0 && (!wearTypesWithSeverity || wearTypesWithSeverity.length === 0)) {
          missing.push('Wear Severity (set for at least one wear type)');
        }
        if (!formData.problemDescription) missing.push('Problem Description');
        break;
      case 'The Solution':
        // Base metal, dimensions moved here from Problem step
        if (!formData.baseMetal) missing.push('Base Metal');
        if (!formData.generalDimensions) missing.push('General Dimensions');
        if (!formData.waSolution) missing.push('WA Solution');
        if (!formData.waProduct) missing.push('WA Product');
        if (!formData.technicalAdvantages) missing.push('Technical Advantages');
        if (!formData.images || formData.images.length < 1) missing.push('At least 1 image');
        break;
      case 'Welding Procedure':
        // WPS is required for TECH cases
        // WPS is optional for STAR cases, but if Next is clicked (not Skip), validate for bonus point
        if (formData.type === 'TECH' || formData.type === 'STAR') {
          // Base Metal Section
          if (!formData.wps?.baseMetalType) missing.push('Base Metal Type');
          if (!formData.wps?.surfacePreparation) missing.push('Surface Preparation');
          // Layers validation - check if at least one layer has required fields
          const layers = formData.wps?.layers || [];
          if (layers.length === 0) {
            missing.push('At least one welding layer is required');
          } else {
            const firstLayer = layers[0];
            // Check required fields in first layer
            if (!firstLayer.waProductName) missing.push('Layer 1: WA Product Name');
            if (!firstLayer.waProductDiameter) missing.push('Layer 1: Diameter');
            if (!firstLayer.weldingProcess) missing.push('Layer 1: Process');
            if (!firstLayer.weldingPosition) missing.push('Layer 1: Welding Position');
            if (!firstLayer.torchAngle) missing.push('Layer 1: Torch Position');
            if (!firstLayer.shieldingGas) missing.push('Layer 1: Shielding Gas');
            // Check WA Parameters required fields
            if (!firstLayer.stickOut) missing.push('Layer 1: Stick-out');
            if (!firstLayer.currentType) missing.push('Layer 1: Type of Current');
            if (!firstLayer.currentModeSynergy) missing.push('Layer 1: Welding Mode');
            if (!firstLayer.wireFeedSpeed) missing.push('Layer 1: Wire Feed Speed');
            if (!firstLayer.intensity) missing.push('Layer 1: Intensity');
            if (!firstLayer.voltage) missing.push('Layer 1: Voltage');
            if (!firstLayer.travelSpeed) missing.push('Layer 1: Welding Speed');
          }
        }
        break;
      case 'Finalize':
        if (!formData.solutionValueRevenue) missing.push('Solution Value/Revenue');
        if (!formData.annualPotentialRevenue) missing.push('Annual Potential Revenue');
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

  const handleSkipWPS = () => {
    // Skip WPS step without validation (for STAR cases)
    // This means no bonus point (+0 instead of +1)
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
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

  // Helper to upload WPS documents to Cloudinary and get URLs
  const waUploadWpsDocuments = async (documents: any[] | undefined): Promise<{ name: string; size?: number; type?: string; url: string }[]> => {
    console.log('[WPS Upload] Starting upload, documents:', documents?.length || 0);
    if (!documents || documents.length === 0) return [];

    const uploadedDocs: { name: string; size?: number; type?: string; url: string }[] = [];

    for (const doc of documents) {
      console.log('[WPS Upload] Processing doc:', doc.name, 'hasUrl:', !!doc.url, 'hasFile:', !!doc.file, 'isFile:', doc.file instanceof File);

      // Skip if document already has a URL (already uploaded)
      if (doc.url) {
        console.log('[WPS Upload] Doc already has URL, skipping upload');
        uploadedDocs.push({ name: doc.name, size: doc.size, type: doc.type, url: doc.url });
        continue;
      }

      // Upload if document has a File object
      if (doc.file instanceof File) {
        console.log('[WPS Upload] Uploading file:', doc.file.name, 'size:', doc.file.size, 'type:', doc.file.type);
        const formDataUpload = new FormData();
        formDataUpload.append('file', doc.file);

        const result = await waUploadDocument(formDataUpload);
        console.log('[WPS Upload] Upload result:', result.success, result.url || result.error);
        if (result.success && result.url) {
          uploadedDocs.push({ name: doc.name, size: doc.size, type: doc.type, url: result.url });
        } else {
          console.error('[WPS Upload] Failed to upload document:', doc.name, result.error);
        }
      } else {
        console.warn('[WPS Upload] Doc has no file and no URL, skipping:', doc.name);
      }
    }

    console.log('[WPS Upload] Final uploaded docs:', uploadedDocs.length);
    return uploadedDocs;
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const hasWPS = formData.type === 'TECH' || formData.type === 'STAR';

      // Convert string decimals to numbers
      const updateData: any = {
        ...formData,
        status: 'DRAFT',
        lastEditedStep: currentStep, // Save which step user was on
        solutionValueRevenue: formData.solutionValueRevenue ? parseFloat(formData.solutionValueRevenue) : null,
        annualPotentialRevenue: formData.annualPotentialRevenue ? parseFloat(formData.annualPotentialRevenue) : null,
        customerSavingsAmount: formData.customerSavingsAmount ? parseFloat(formData.customerSavingsAmount) : null,
      };

      await waUpdateCaseStudy(caseStudy.id, updateData);

      // If TECH or STAR and WPS data exists, save WPS (save any filled data for drafts)
      if (hasWPS && formData.wps) {
        // Check if any WPS field has data (excluding empty arrays)
        const hasAnyWpsData = Object.entries(formData.wps).some(([key, v]) => {
          if (Array.isArray(v)) return v.length > 0;
          return v !== undefined && v !== '' && v !== null;
        });
        if (hasAnyWpsData) {
          // Upload documents to Cloudinary and get URLs
          const uploadedDocs = await waUploadWpsDocuments(formData.wps.documents);

          await waSaveWeldingProcedure({
            caseStudyId: caseStudy.id,
            // Base Metal
            baseMetalType: formData.wps.baseMetalType,
            surfacePreparation: formData.wps.surfacePreparation,
            surfacePreparationOther: formData.wps.surfacePreparationOther,
            // Layers (new multi-layer structure)
            layers: formData.wps.layers,
            // Heating Procedure
            preheatingTemp: formData.wps.preheatingTemp,
            interpassTemp: formData.wps.interpassTemp,
            postheatingTemp: formData.wps.postheatingTemp,
            // PWHT
            pwhtRequired: formData.wps.pwhtRequired,
            pwhtHeatingRate: formData.wps.pwhtHeatingRate,
            pwhtTempHoldingTime: formData.wps.pwhtTempHoldingTime,
            pwhtCoolingRate: formData.wps.pwhtCoolingRate,
            // Documents
            documents: uploadedDocs.length > 0 ? uploadedDocs : undefined,
            // Additional Notes
            additionalNotes: formData.wps.additionalNotes,
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
        // Upload documents to Cloudinary and get URLs
        const uploadedDocs = await waUploadWpsDocuments(formData.wps.documents);

        await waSaveWeldingProcedure({
          caseStudyId: caseStudy.id,
          // Base Metal
          baseMetalType: formData.wps.baseMetalType,
          surfacePreparation: formData.wps.surfacePreparation,
          surfacePreparationOther: formData.wps.surfacePreparationOther,
          // Layers (new multi-layer structure)
          layers: formData.wps.layers,
          // Heating Procedure
          preheatingTemp: formData.wps.preheatingTemp,
          interpassTemp: formData.wps.interpassTemp,
          postheatingTemp: formData.wps.postheatingTemp,
          // PWHT
          pwhtRequired: formData.wps.pwhtRequired,
          pwhtHeatingRate: formData.wps.pwhtHeatingRate,
          pwhtTempHoldingTime: formData.wps.pwhtTempHoldingTime,
          pwhtCoolingRate: formData.wps.pwhtCoolingRate,
          // Documents
          documents: uploadedDocs.length > 0 ? uploadedDocs : undefined,
          // Additional Notes
          additionalNotes: formData.wps.additionalNotes,
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
            <div className="flex justify-between items-start">
              {STEPS.map((step, index) => {
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
                    className="flex flex-col items-center relative"
                    style={{ flex: '1 1 0', minWidth: 0 }}
                  >
                    {/* Connecting line - positioned between circles */}
                    {index < STEPS.length - 1 && (
                      <div
                        className={`absolute top-5 h-0.5 ${
                          currentStep > step.number ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        style={{
                          left: 'calc(50% + 20px)',
                          right: 'calc(-50% + 20px)',
                          zIndex: 0
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleStepClick}
                      disabled={isSubmitting}
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all flex-shrink-0 ${
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
                    <div className="text-xs mt-2 text-center w-full px-1">
                      <div className="font-semibold dark:text-foreground break-words leading-tight">{step.title}</div>
                      <div className="text-gray-500 dark:text-muted-foreground hidden sm:block break-words">{step.description}</div>
                    </div>
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
          {STEPS[currentStep - 1]?.title === 'Case Study Type' && (
            <StepOne formData={formData} updateFormData={updateFormData} />
          )}
          {STEPS[currentStep - 1]?.title === 'Customer Info' && (
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
                onCustomerSelect={async (customer: NetSuiteCustomer) => {
                  const updates: Partial<CaseStudyFormData> = {
                    customerName: customer.companyName,
                    customerSelected: true,
                    qualifierCompleted: false, // Need to re-answer qualifier questions
                    qualifierType: undefined,
                    isTarget: false,
                  };
                  if (customer.city) updates.location = customer.city;
                  if (customer.country) updates.country = customer.country;

                  // Try to get industry from NetSuite first
                  if (customer.industry) {
                    updates.industry = customer.industry;
                  } else {
                    // If no industry from NetSuite, try to fetch from DB
                    setIndustryLoading(true);
                    try {
                      const result = await waGetCustomerIndustry(customer.companyName);
                      if (result.success && result.industry) {
                        updates.industry = result.industry;
                      }
                    } catch (error) {
                      console.error('Failed to fetch customer industry:', error);
                    } finally {
                      setIndustryLoading(false);
                    }
                  }

                  updateFormData(updates);
                }}
                label="Customer Name"
                required
                placeholder="Click to search customers..."
              />

              {/* Industry Selection - Show after customer is selected */}
              {formData.customerSelected && formData.customerName && (
                <div className="space-y-2">
                  <Label className="dark:text-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Industry <span className="text-red-500 dark:text-red-400">*</span>
                  </Label>
                  {industryLoading ? (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg border bg-gray-50 dark:bg-muted border-border">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Loading industry...</span>
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const isOther = formData.industry && !industries.some(i => i.value === formData.industry) && formData.industry !== '__CUSTOM__';
                        const selectValue = isOther ? '__OTHER__' : formData.industry;
                        return (
                          <>
                            <Select
                              value={selectValue}
                              onValueChange={(value) => {
                                if (value === '__OTHER__') {
                                  updateFormData({ industry: '__CUSTOM__' });
                                } else {
                                  updateFormData({ industry: value });
                                }
                              }}
                              disabled={industriesLoading}
                            >
                              <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
                                <SelectValue placeholder={industriesLoading ? "Loading..." : "Select industry"} />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-popover dark:border-border">
                                {industries
                                  .filter((industry) => industry.value.toLowerCase() !== 'other')
                                  .map((industry) => (
                                    <SelectItem key={industry.id} value={industry.value}>
                                      {industry.value}
                                    </SelectItem>
                                  ))}
                                <SelectItem value="__OTHER__">Other (specify)</SelectItem>
                              </SelectContent>
                            </Select>
                            {(isOther || formData.industry === '__CUSTOM__') && (
                              <Input
                                placeholder="Enter custom industry..."
                                value={formData.industry === '__CUSTOM__' ? '' : formData.industry}
                                onChange={(e) => updateFormData({ industry: e.target.value || '__CUSTOM__' })}
                                className="mt-2 dark:bg-input dark:border-border dark:text-foreground"
                                autoFocus
                              />
                            )}
                          </>
                        );
                      })()}
                      {formData.industry && formData.industry !== '__CUSTOM__' && (
                        <p className="text-xs text-muted-foreground">
                          {industries.some(i => i.value === formData.industry)
                            ? 'Industry auto-filled from customer data'
                            : 'Custom industry specified'}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Qualifier Questions - Only show after customer is selected and industry is selected */}
              {formData.customerSelected && formData.industry && formData.industry !== '__CUSTOM__' && (
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
                      {formData.isTarget
                        ? formData.qualifierType === 'NEW_CUSTOMER'
                          ? '✓ Counts toward the BHAG 10,000 goal and is qualified as New Customer.'
                          : '✓ Counts toward the BHAG 10,000 goal and is qualified as Cross-Sell.'
                        : 'ℹ Maintenance case (does not count toward BHAG)'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          {STEPS[currentStep - 1]?.title === 'Basic Info' && (
            <StepTwo
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          {STEPS[currentStep - 1]?.title === 'The Challenge' && (
            <StepThree formData={formData} updateFormData={updateFormData} />
          )}
          {STEPS[currentStep - 1]?.title === 'The Solution' && (
            <StepFour formData={formData} updateFormData={updateFormData} />
          )}
          {STEPS[currentStep - 1]?.title === 'Welding Procedure' && (
            <StepWPS formData={formData} updateFormData={updateFormData} />
          )}
          {STEPS[currentStep - 1]?.title === 'Cost Reduction Analysis' && (
            <StepCostCalculator formData={formData} updateFormData={updateFormData} />
          )}
          {STEPS[currentStep - 1]?.title === 'Finalize' && (
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

          {/* Show Skip button for WPS step on STAR cases (optional bonus point) */}
          {currentStep < STEPS.length &&
           STEPS[currentStep - 1]?.title === 'Welding Procedure' &&
           formData.type === 'STAR' && (
            <Button
              variant="outline"
              onClick={handleSkipWPS}
              disabled={isSubmitting}
              className="dark:border-border dark:text-foreground dark:hover:bg-accent"
            >
              Skip
            </Button>
          )}

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} disabled={isSubmitting}>
              Next{STEPS[currentStep - 1]?.title === 'Welding Procedure' && formData.type === 'STAR' ? ' (+1 pt)' : ''}
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

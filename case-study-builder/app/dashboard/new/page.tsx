'use client';

import { useState, useMemo } from 'react';
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
import ChallengeQualifier, { type QualifierResult } from '@/components/case-study-form/challenge-qualifier';
import { waCreateCaseStudy } from '@/lib/actions/waCaseStudyActions';
import { waSaveWeldingProcedure } from '@/lib/actions/waWpsActions';
import { waSaveCostCalculation } from '@/lib/actions/waCostCalculatorActions';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import NetSuiteCustomerSearch from '@/components/netsuite-customer-search';
import { NetSuiteCustomer } from '@/lib/integrations/netsuite';

export type CaseStudyFormData = {
  // Step 1: Case Type
  type: 'APPLICATION' | 'TECH' | 'STAR';

  // Case Study Title
  title: string;

  // Step 2: Challenge Qualifier (BRD 3.1)
  qualifierType?: 'NEW_CUSTOMER' | 'CROSS_SELL' | 'MAINTENANCE';
  isTarget: boolean; // Counts toward BHAG 10,000 goal
  qualifierCompleted: boolean; // Whether qualifier questions were answered
  customerSelected: boolean; // Whether customer was selected from dropdown (not just typed)

  // Step 3: Basic Information
  customerName: string;
  industry: string;
  location: string;
  country: string;
  componentWorkpiece: string;
  workType: 'WORKSHOP' | 'ON_SITE' | 'BOTH';
  jobType: 'PREVENTIVE' | 'CORRECTIVE' | 'IMPROVEMENT' | 'OTHER' | ''; // Type of maintenance job
  jobTypeOther: string; // Custom job type when "OTHER" is selected
  wearType: string[];
  wearTypeOthers: Array<{ name: string; severity: number }>; // Multiple custom wear types with severity
  wearSeverities: Record<string, number>; // Severity per wear type (1=low, 5=high)
  baseMetal: string;
  generalDimensions: string;
  oem: string; // Original Equipment Manufacturer (BRD Section 5)
  jobDurationHours: string; // Duration in hours
  jobDurationDays: string; // Duration in days
  jobDurationWeeks: string; // Duration in weeks
  unitSystem: 'METRIC' | 'IMPERIAL'; // Unit system for dimensions

  // Step 3: Problem Description
  problemDescription: string;
  previousSolution: string;
  previousServiceLife: string;
  previousServiceLifeHours: string; // Service life in hours
  previousServiceLifeDays: string; // Service life in days
  previousServiceLifeWeeks: string; // Service life in weeks
  previousServiceLifeMonths: string; // Service life in months
  previousServiceLifeYears: string; // Service life in years
  oldJobDurationHours: string; // Old solution job duration in hours
  oldJobDurationDays: string; // Old solution job duration in days
  oldJobDurationWeeks: string; // Old solution job duration in weeks
  competitorName: string;

  // Step 4: WA Solution
  waSolution: string;
  waProduct: string;
  waProductDiameter: string; // Wire diameter (e.g., 1.6mm or 0.063in)
  technicalAdvantages: string;
  expectedServiceLife: string;
  expectedServiceLifeHours: string; // Expected service life in hours
  expectedServiceLifeDays: string; // Expected service life in days
  expectedServiceLifeWeeks: string; // Expected service life in weeks
  expectedServiceLifeMonths: string; // Expected service life in months
  expectedServiceLifeYears: string; // Expected service life in years

  // Step 5: Financial & Media
  solutionValueRevenue: string;
  annualPotentialRevenue: string;
  customerSavingsAmount: string;
  images: string[];
  supportingDocs: string[];
  tags: string[];

  // Step WPS: Welding Procedure Specification (TECH & STAR only)
  wps?: {
    // Base Metal
    baseMetalType?: string;
    baseMetalGrade?: string;
    baseMetalThickness?: string;
    surfacePreparation?: string;
    // WA Product
    waProductName?: string;
    waProductDiameter?: string;
    shieldingGas?: string;
    shieldingFlowRate?: string;
    flux?: string;
    standardDesignation?: string;
    // Welding Parameters
    weldingProcess?: string;
    currentType?: string;
    currentModeSynergy?: string;
    wireFeedSpeed?: string;
    intensity?: string;
    voltage?: string;
    heatInput?: string;
    weldingPosition?: string;
    torchAngle?: string;
    stickOut?: string;
    travelSpeed?: string;
    // Oscillation
    oscillationWidth?: string;
    oscillationSpeed?: string;
    oscillationStepOver?: string;
    oscillationTempo?: string;
    // Temperature
    preheatTemperature?: string;
    interpassTemperature?: string;
    postheatTemperature?: string;
    pwhtDetails?: string;
    // Results
    layerNumbers?: number;
    hardness?: string;
    defectsObserved?: string;
    additionalNotes?: string;
  };

  // Step Cost Calculator: Cost Reduction Calculator (STAR only - BRD 3.3)
  costCalculator?: {
    currency?: 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD' | 'CHF' | 'JPY' | 'CNY'; // Currency selector
    costOfPart?: string;           // A - Cost of old solution/part
    costOfWaSolution?: string;     // B - Cost of WA solution (new field)
    // Old solution lifetime (mixed units)
    oldLifetimeHours?: string;
    oldLifetimeDays?: string;
    oldLifetimeWeeks?: string;
    oldLifetimeMonths?: string;
    oldLifetimeYears?: string;
    // WA solution lifetime (mixed units)
    waLifetimeHours?: string;
    waLifetimeDays?: string;
    waLifetimeWeeks?: string;
    waLifetimeMonths?: string;
    waLifetimeYears?: string;
    // Legacy fields (kept for backward compatibility)
    oldSolutionLifetime?: string;  // C - Old solution lifetime (deprecated)
    waSolutionLifetime?: string;   // D - WA solution lifetime (deprecated)
    serviceLifeUnit?: 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS';  // Unit for lifetime values (deprecated)
    partsUsedPerYear?: string;     // E - Parts used per year
    maintenanceCostPerEvent?: string;  // F - Maintenance cost per replacement event
    disassemblyAssemblyCost?: string;  // G - Disassembly/Assembly cost per event
    downtimeCostPerEvent?: string;     // H - Downtime cost per event
    extraBenefits?: string; // Qualitative benefits (BRD Row 38)
  };
};

export default function NewCaseStudyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CaseStudyFormData>({
    type: 'APPLICATION',
    title: '',
    qualifierType: undefined,
    isTarget: false,
    qualifierCompleted: false,
    customerSelected: false,
    customerName: '',
    industry: '',
    location: '',
    country: '',
    componentWorkpiece: '',
    workType: 'WORKSHOP',
    jobType: '',
    jobTypeOther: '',
    wearType: [],
    wearTypeOthers: [],
    wearSeverities: {},
    baseMetal: '',
    generalDimensions: '',
    oem: '',
    jobDurationHours: '',
    jobDurationDays: '',
    jobDurationWeeks: '',
    unitSystem: 'METRIC',
    problemDescription: '',
    previousSolution: '',
    previousServiceLife: '',
    previousServiceLifeHours: '',
    previousServiceLifeDays: '',
    previousServiceLifeWeeks: '',
    previousServiceLifeMonths: '',
    previousServiceLifeYears: '',
    oldJobDurationHours: '',
    oldJobDurationDays: '',
    oldJobDurationWeeks: '',
    competitorName: '',
    waSolution: '',
    waProduct: '',
    waProductDiameter: '',
    technicalAdvantages: '',
    expectedServiceLife: '',
    expectedServiceLifeHours: '',
    expectedServiceLifeDays: '',
    expectedServiceLifeWeeks: '',
    expectedServiceLifeMonths: '',
    expectedServiceLifeYears: '',
    solutionValueRevenue: '',
    annualPotentialRevenue: '',
    customerSavingsAmount: '',
    images: [],
    supportingDocs: [],
    tags: [],
    wps: undefined,
    costCalculator: undefined,
  });

  // Dynamic steps based on case type (BRD 3.3)
  const STEPS = useMemo(() => {
    const baseSteps = [
      { number: 1, title: 'Case Type', description: 'Select case study type' },
      { number: 2, title: 'Qualifier', description: 'Challenge qualification' },
      { number: 3, title: 'Basic Info', description: 'Customer and component details' },
      { number: 4, title: 'Problem', description: 'Describe the challenge' },
      { number: 5, title: 'Solution', description: 'WA solution details' },
    ];

    // Add WPS step for TECH and STAR cases (BRD 3.3 - Tech Case additive requirements)
    if (formData.type === 'TECH' || formData.type === 'STAR') {
      baseSteps.push({ number: 6, title: 'WPS', description: 'Welding procedure specification' });
    }

    // Add Cost Calculator step for STAR cases only (BRD 3.3 - Star Case additive requirements)
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

  const updateFormData = (data: Partial<CaseStudyFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

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
      case 'Cost Calculator':
        if (!formData.costCalculator?.costOfPart) missing.push('Cost of Part (Old Solution)');
        if (!formData.costCalculator?.costOfWaSolution) missing.push('Cost of WA Solution');
        if (!formData.costCalculator?.partsUsedPerYear) missing.push('Parts Used Per Year');
        // Check if any old solution lifetime field has a value (mixed units)
        const hasOldLifetime = formData.costCalculator?.oldLifetimeHours ||
          formData.costCalculator?.oldLifetimeDays ||
          formData.costCalculator?.oldLifetimeWeeks ||
          formData.costCalculator?.oldLifetimeMonths ||
          formData.costCalculator?.oldLifetimeYears;
        if (!hasOldLifetime) missing.push('Old Solution Lifetime');
        // Check if any WA solution lifetime field has a value (mixed units)
        const hasWaLifetime = formData.costCalculator?.waLifetimeHours ||
          formData.costCalculator?.waLifetimeDays ||
          formData.costCalculator?.waLifetimeWeeks ||
          formData.costCalculator?.waLifetimeMonths ||
          formData.costCalculator?.waLifetimeYears;
        if (!hasWaLifetime) missing.push('WA Solution Lifetime');
        if (!formData.costCalculator?.maintenanceCostPerEvent) missing.push('Maintenance Cost Per Event');
        if (!formData.costCalculator?.disassemblyAssemblyCost) missing.push('Disassembly/Assembly Cost');
        if (!formData.costCalculator?.downtimeCostPerEvent) missing.push('Downtime Cost Per Event');
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

  /**
   * Helper to convert mixed time units to total hours (for comparison)
   */
  const waConvertToTotalHours = (hours?: string, days?: string, weeks?: string, months?: string, years?: string): number => {
    const h = parseFloat(hours || '0') || 0;
    const d = parseFloat(days || '0') || 0;
    const w = parseFloat(weeks || '0') || 0;
    const m = parseFloat(months || '0') || 0;
    const y = parseFloat(years || '0') || 0;
    // Convert all to hours: 1d=24h, 1w=168h, 1m=730h (avg), 1y=8760h
    return h + (d * 24) + (w * 168) + (m * 730) + (y * 8760);
  };

  /**
   * Helper to convert simplified cost calculator form data to database schema format
   * Uses new formula: Annual Cost Old = (A × E) + (E − 1) × (F + G + H)
   *                   Annual Cost WA = (B × (E ÷ (D ÷ C))) + ((E ÷ (D ÷ C)) − 1) × (F + G + H)
   */
  const waMapCostCalculatorData = (cc: NonNullable<typeof formData.costCalculator>, caseStudyId: string) => {
    const A = parseFloat(cc.costOfPart || '0') || 0;           // Cost of old solution
    const B = parseFloat(cc.costOfWaSolution || '0') || 0;    // Cost of WA solution

    // Convert mixed units to total hours, then to days for database storage
    const oldLifetimeHours = waConvertToTotalHours(
      cc.oldLifetimeHours, cc.oldLifetimeDays, cc.oldLifetimeWeeks,
      cc.oldLifetimeMonths, cc.oldLifetimeYears
    );
    const waLifetimeHours = waConvertToTotalHours(
      cc.waLifetimeHours, cc.waLifetimeDays, cc.waLifetimeWeeks,
      cc.waLifetimeMonths, cc.waLifetimeYears
    );

    // Use mixed units if available, otherwise fall back to legacy fields
    const C = oldLifetimeHours || parseFloat(cc.oldSolutionLifetime || '1') || 1; // Old lifetime (in hours)
    const D = waLifetimeHours || parseFloat(cc.waSolutionLifetime || '1') || 1;   // WA lifetime (in hours)

    const E = parseInt(cc.partsUsedPerYear || '0') || 0;      // Parts/year
    const F = parseFloat(cc.maintenanceCostPerEvent || '0') || 0;  // Maintenance cost/event
    const G = parseFloat(cc.disassemblyAssemblyCost || '0') || 0;  // Disassembly cost/event
    const H = parseFloat(cc.downtimeCostPerEvent || '0') || 0;     // Downtime cost/event

    // Calculate lifetime improvement factor
    const lifetimeRatio = D / C;
    const waPartsPerYear = E / lifetimeRatio;

    // New formula calculations
    // Annual Cost Old = (A × E) + (E − 1) × (F + G + H)
    const annualCostOld = (A * E) + (E - 1) * (F + G + H);

    // Annual Cost WA = (B × waPartsPerYear) + (waPartsPerYear − 1) × (F + G + H)
    const annualCostWA = (B * waPartsPerYear) + Math.max(0, waPartsPerYear - 1) * (F + G + H);

    const annualSavings = annualCostOld - annualCostWA;
    const savingsPercentage = annualCostOld > 0 ? Math.round((annualSavings / annualCostOld) * 100) : 0;

    // Map to database schema format (before/after format for compatibility)
    const materialCostBefore = A * E;
    const materialCostAfter = B * waPartsPerYear;
    const laborCostBefore = (E - 1) * G;
    const laborCostAfter = Math.max(0, waPartsPerYear - 1) * G;
    const downtimeCostBefore = (E - 1) * H;
    const downtimeCostAfter = Math.max(0, waPartsPerYear - 1) * H;

    // Convert hours to days for database storage (C and D are in hours)
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
      oldSolutionLifetimeDays: oldLifetimeDays || 1, // Ensure at least 1 day
      waSolutionLifetimeDays: waLifetimeDays || 1,   // Ensure at least 1 day
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
      const hasCostCalc = formData.type === 'STAR';

      // Create the case study draft
      const result = await waCreateCaseStudy({ ...formData, status: 'DRAFT' });

      // If TECH or STAR and WPS data exists, save WPS (save any filled data for drafts)
      if (hasWPS && formData.wps && result.id) {
        // Check if any WPS field has data
        const hasAnyWpsData = Object.values(formData.wps).some(v => v !== undefined && v !== '' && v !== null);
        if (hasAnyWpsData) {
          await waSaveWeldingProcedure({
            caseStudyId: result.id,
            waProductName: formData.wps.waProductName || '',
            weldingProcess: formData.wps.weldingProcess || '',
            ...formData.wps,
          });
        }
      }

      // If STAR and cost calculator data exists, save cost calculator
      if (hasCostCalc && formData.costCalculator && result.id) {
        const hasAnyCostData = Object.values(formData.costCalculator).some(v => v !== undefined && v !== '' && v !== null);
        if (hasAnyCostData) {
          const costCalcData = waMapCostCalculatorData(formData.costCalculator, result.id);
          await waSaveCostCalculation(costCalcData);
        }
      }

      toast.success('Draft saved successfully');
      router.push('/dashboard/my-cases');
    } catch (error) {
      toast.error('Failed to save draft');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    // Validate all required steps
    const hasWPS = formData.type === 'TECH' || formData.type === 'STAR';
    const hasCostCalc = formData.type === 'STAR';
    for (let i = 1; i <= STEPS.length - 1; i++) { // -1 to exclude Review step
      if (!validateStep(i)) {
        toast.error('Please complete all required fields');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Create the case study
      const result = await waCreateCaseStudy({ ...formData, status: 'SUBMITTED' });

      // If TECH or STAR and WPS data exists, save WPS
      if (hasWPS && formData.wps && result.id) {
        await waSaveWeldingProcedure({
          caseStudyId: result.id,
          waProductName: formData.wps.waProductName || '',
          weldingProcess: formData.wps.weldingProcess || '',
          ...formData.wps,
        });
      }

      // If STAR and cost calculator data exists, save cost calculator
      if (hasCostCalc && formData.costCalculator && result.id) {
        const costCalcData = waMapCostCalculatorData(formData.costCalculator, result.id);
        await waSaveCostCalculation(costCalcData);
      }

      toast.success('Case study submitted for approval!');
      router.push('/dashboard/my-cases');
    } catch (error) {
      toast.error('Failed to submit case study');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Create New Case Study</h1>
        <p className="text-gray-600 dark:text-muted-foreground mt-2">
          Document a challenge and solution in just a few minutes
        </p>
      </div>

      {/* Progress */}
      <Card role="article" className="dark:bg-card dark:border-border">
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
                          : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer'
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
                          currentStep > step.number ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
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
      <Card role="article" className="dark:bg-card dark:border-border">
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
              {/* Customer Name Search - NetSuite Integration (Modal) */}
              <NetSuiteCustomerSearch
                value={formData.customerName}
                onChange={(value) => {
                  // This is called when customer is cleared (value = '')
                  if (!value) {
                    updateFormData({
                      customerName: '',
                      customerSelected: false,
                      qualifierCompleted: false,
                      qualifierType: undefined,
                      isTarget: false,
                      // Also reset location/country/industry that were auto-filled
                      location: '',
                      country: '',
                      industry: '',
                    });
                  }
                }}
                onCustomerSelect={(customer: NetSuiteCustomer) => {
                  // Auto-fill fields from NetSuite data and mark as selected
                  const updates: Partial<CaseStudyFormData> = {
                    customerName: customer.companyName,
                    customerSelected: true, // Mark that customer was clicked/selected
                    // Reset qualifier when new customer is selected
                    qualifierCompleted: false,
                    qualifierType: undefined,
                    isTarget: false,
                  };
                  if (customer.city) updates.location = customer.city;
                  if (customer.country) updates.country = customer.country;
                  if (customer.industry) updates.industry = customer.industry;

                  updateFormData(updates);
                  console.log(`[Qualifier] Customer selected from NetSuite:`, customer.companyName);
                }}
                label="Customer Name"
                required
                placeholder="Click to search customers..."
              />

              {/* Challenge Qualifier - only show once customer is SELECTED from dropdown */}
              {formData.customerSelected && formData.customerName && (
                <ChallengeQualifier
                  key={formData.customerName} // Force re-mount when customer changes
                  customerName={formData.customerName}
                  onComplete={(result: QualifierResult) => {
                    updateFormData({
                      qualifierType: result.qualifierType,
                      isTarget: result.isTarget,
                      qualifierCompleted: true,
                    });
                  }}
                  onReset={() => {
                    // Reset qualifier state when user clicks "Re-evaluate"
                    updateFormData({
                      qualifierType: undefined,
                      isTarget: false,
                      qualifierCompleted: false,
                    });
                  }}
                />
              )}

              {/* Show qualification result summary */}
              {formData.qualifierCompleted && (
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
            <StepFive formData={formData} updateFormData={updateFormData} />
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
              className="dark:border-border"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {/* Hide Save Draft for first two steps (Case Type and Qualifier) */}
          {currentStep > 2 && (
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="dark:border-border"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
          )}

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} disabled={isSubmitting}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

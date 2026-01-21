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
import { waCreateCaseStudy, waGetCustomerIndustry } from '@/lib/actions/waCaseStudyActions';
import { waSaveWeldingProcedure } from '@/lib/actions/waWpsActions';
import { waSaveCostCalculation } from '@/lib/actions/waCostCalculatorActions';
import { waUploadDocument } from '@/lib/actions/waDocumentUploadActions';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NetSuiteCustomerSearch from '@/components/netsuite-customer-search';
import { NetSuiteCustomer } from '@/lib/integrations/netsuite';
import { useMasterList } from '@/lib/hooks/use-master-list';
import { Building2, Loader2 } from 'lucide-react';

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

export type CaseStudyFormData = {
  // Step 1: Case Type
  type: 'APPLICATION' | 'TECH' | 'STAR';

  // Case Study Title
  title: string;

  // General Description (auto-generated based on components/basic info)
  generalDescription: string;

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

  // Step 5: Revenue & Media
  revenueCurrency: 'USD' | 'EUR' | 'GBP' | 'MAD' | 'AUD' | 'CAD' | 'CHF' | 'JPY' | 'CNY';
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
    surfacePreparationOther?: string;
    // Layers (new multi-layer structure for consumables, parameters, and oscillation)
    layers?: Array<{
      id: string;
      // WA Consumables
      waProductName?: string;
      waProductDiameter?: string;
      weldingProcess?: string;
      weldingProcessOther?: string;
      technique?: string;
      techniqueOther?: string;
      weldingPosition?: string;
      weldingPositionOther?: string;
      torchAngle?: string;
      shieldingGas?: string;
      shieldingGasOther?: string;
      shieldingFlowRate?: string;
      flux?: string;
      fluxOther?: string;
      standardDesignation?: string;
      // WA Parameters
      stickOut?: string;
      currentType?: string;
      currentModeSynergy?: string;
      currentModeSynergyOther?: string;
      wireFeedSpeed?: string;
      intensity?: string;
      voltage?: string;
      travelSpeed?: string;
      // Oscillation Details
      oscillationAmplitude?: string;
      oscillationPeriod?: string;
      oscillationTempos?: string;
    }>;
    // Legacy WA Product (kept for backward compatibility)
    waProductName?: string;
    waProductDiameter?: string;
    shieldingGas?: string;
    shieldingFlowRate?: string;
    flux?: string;
    standardDesignation?: string;
    // Legacy Welding Parameters
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
    // Legacy Oscillation
    oscillationWidth?: string;
    oscillationSpeed?: string;
    oscillationStepOver?: string;
    oscillationTempo?: string;
    // Heating Procedure (new fields)
    preheatingTemp?: string;
    interpassTemp?: string;
    postheatingTemp?: string;
    // PWHT (new fields)
    pwhtRequired?: string; // 'Y' or 'N'
    pwhtHeatingRate?: string;
    pwhtTempHoldingTime?: string;
    pwhtCoolingRate?: string;
    // Legacy Temperature (kept for backward compatibility)
    preheatTemperature?: string;
    interpassTemperature?: string;
    postheatTemperature?: string;
    pwhtDetails?: string;
    // Documents (new field)
    documents?: Array<{ name: string; size?: number; type?: string; url?: string; file?: File }>;
    // Legacy Results
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
  const [industryLoading, setIndustryLoading] = useState(false);

  // Fetch master list for industries
  const { items: industries, isLoading: industriesLoading } = useMasterList('Industry', FALLBACK_INDUSTRIES);

  const [formData, setFormData] = useState<CaseStudyFormData>({
    type: 'APPLICATION',
    title: '',
    generalDescription: '',
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
    revenueCurrency: 'EUR',
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
      { number: 1, title: 'Case Study Type', description: '' },
      { number: 2, title: 'Customer Info', description: '' },
      { number: 3, title: 'Basic Info', description: '' },
      { number: 4, title: 'The Challenge', description: '' },
      { number: 5, title: 'The Solution', description: '' },
    ];

    // Add WPS step for TECH and STAR cases (BRD 3.3 - Tech Case additive requirements)
    if (formData.type === 'TECH' || formData.type === 'STAR') {
      baseSteps.push({ number: 6, title: 'Welding Procedure', description: '' });
    }

    // Add Cost Calculator step for STAR cases only (BRD 3.3 - Star Case additive requirements)
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

  const updateFormData = (data: Partial<CaseStudyFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

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
        if (!formData.generalDescription) missing.push('General Description');
        if (!formData.location) missing.push('Location');
        if (!formData.country) missing.push('Country');
        if (!formData.componentWorkpiece) missing.push('Component/Workpiece');
        if (!formData.workType) missing.push('Work Type');
        if (!formData.jobType) missing.push('Job Type');
        if (formData.jobType === 'OTHER' && !formData.jobTypeOther) missing.push('Job Type (specify)');
        break;
      case 'The Challenge':
        if (!formData.problemDescription) missing.push('Problem Description');
        // Previous service life validation - at least one time unit must have a value
        const hasPreviousServiceLife = formData.previousServiceLifeHours ||
          formData.previousServiceLifeDays ||
          formData.previousServiceLifeWeeks ||
          formData.previousServiceLifeMonths ||
          formData.previousServiceLifeYears;
        if (!hasPreviousServiceLife) missing.push('Previous Service Life');
        // Wear type validation
        if (!formData.wearType || formData.wearType.length === 0) missing.push('Type of Wear');
        // Check that at least one selected wear type has a severity
        const wearTypesWithSeverity = formData.wearType?.filter(
          type => formData.wearSeverities?.[type] && formData.wearSeverities[type] > 0
        );
        if (formData.wearType && formData.wearType.length > 0 && (!wearTypesWithSeverity || wearTypesWithSeverity.length === 0)) {
          missing.push('Wear Severity (set for at least one wear type)');
        }
        break;
      case 'The Solution':
        // Base metal, dimensions moved here from Problem step
        if (!formData.baseMetal) missing.push('Base Metal');
        if (!formData.generalDimensions) missing.push('General Dimensions');
        if (!formData.waSolution) missing.push('WA Solution Description');
        if (!formData.waProduct) missing.push('WA Product Used');
        if (!formData.waProductDiameter) missing.push('Diameter');
        // Job duration validation - at least one time unit must have a value
        const hasJobDuration = formData.jobDurationHours ||
          formData.jobDurationDays ||
          formData.jobDurationWeeks;
        if (!hasJobDuration) missing.push('Job Duration');
        if (!formData.technicalAdvantages) missing.push('Technical Advantages');
        if (!formData.images || formData.images.length < 2) missing.push('At least 2 images');
        break;
      case 'Welding Procedure':
        // WPS is required for TECH cases
        // WPS is optional for STAR cases, but if Next is clicked (not Skip), validate for bonus point
        if (formData.type === 'TECH' || formData.type === 'STAR') {
          if (!formData.wps?.baseMetalType) missing.push('Base Metal Type');
          if (!formData.wps?.surfacePreparation) missing.push('Surface Preparation');
          if (!formData.wps?.waProductName) missing.push('WA Product Name');
          if (!formData.wps?.shieldingGas) missing.push('Shielding Gas');
          if (!formData.wps?.weldingProcess) missing.push('Welding Process');
          if (!formData.wps?.weldingPosition) missing.push('Welding Position');
          if (!formData.wps?.oscillationWidth && !formData.wps?.oscillationSpeed) missing.push('Oscillation (Width or Speed)');
          if (!formData.wps?.preheatTemperature && !formData.wps?.interpassTemperature) missing.push('Temperature (Preheat or Interpass)');
          if (!formData.wps?.additionalNotes) missing.push('Additional WPS Notes');
        }
        break;
      case 'Cost Reduction Analysis':
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

  // Helper to upload WPS documents to Cloudinary and get URLs
  const waUploadWpsDocuments = async (documents: any[] | undefined): Promise<{ name: string; size?: number; type?: string; url: string }[]> => {
    if (!documents || documents.length === 0) return [];

    const uploadedDocs: { name: string; size?: number; type?: string; url: string }[] = [];

    for (const doc of documents) {
      // Skip if document already has a URL (already uploaded)
      if (doc.url) {
        uploadedDocs.push({ name: doc.name, size: doc.size, type: doc.type, url: doc.url });
        continue;
      }

      // Upload if document has a File object
      if (doc.file instanceof File) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', doc.file);

        const result = await waUploadDocument(formDataUpload);
        if (result.success && result.url) {
          uploadedDocs.push({ name: doc.name, size: doc.size, type: doc.type, url: result.url });
        } else {
          console.error('[WPS Upload] Failed to upload document:', doc.name, result.error);
        }
      }
    }

    return uploadedDocs;
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
          // Upload documents first to get URLs
          const uploadedDocs = await waUploadWpsDocuments(formData.wps.documents);

          await waSaveWeldingProcedure({
            caseStudyId: result.id,
            waProductName: formData.wps.waProductName || '',
            weldingProcess: formData.wps.weldingProcess || '',
            ...formData.wps,
            documents: uploadedDocs.length > 0 ? uploadedDocs : undefined,
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
        // Upload documents first to get URLs
        const uploadedDocs = await waUploadWpsDocuments(formData.wps.documents);

        await waSaveWeldingProcedure({
          caseStudyId: result.id,
          waProductName: formData.wps.waProductName || '',
          weldingProcess: formData.wps.weldingProcess || '',
          ...formData.wps,
          documents: uploadedDocs.length > 0 ? uploadedDocs : undefined,
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
          Create and submit your solved challenge in just a few minutes.
        </p>
      </div>

      {/* Progress */}
      <Card role="article" className="dark:bg-card dark:border-border">
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
                          : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer'
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
      <Card role="article" className="dark:bg-card dark:border-border">
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
                onCustomerSelect={async (customer: NetSuiteCustomer) => {
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
                  console.log(`[Qualifier] Customer selected from NetSuite:`, customer.companyName, {
                    city: customer.city,
                    country: customer.country,
                    industry: customer.industry,
                    updates
                  });
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

              {/* Challenge Qualifier - only show once customer is SELECTED and industry is selected */}
              {formData.customerSelected && formData.customerName && formData.industry && formData.industry !== '__CUSTOM__' && (
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

          {/* Show Skip button for WPS step on STAR cases (optional bonus point) */}
          {currentStep < STEPS.length &&
           STEPS[currentStep - 1]?.title === 'Welding Procedure' &&
           formData.type === 'STAR' && (
            <Button
              variant="outline"
              onClick={handleSkipWPS}
              disabled={isSubmitting}
              className="dark:border-border dark:text-foreground"
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
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

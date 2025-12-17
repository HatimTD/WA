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
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import CRMCustomerSearch, { type CRMCustomer } from '@/components/crm-customer-search';

export type CaseStudyFormData = {
  // Step 1: Case Type
  type: 'APPLICATION' | 'TECH' | 'STAR';

  // Step 2: Challenge Qualifier (BRD 3.1)
  qualifierType?: 'NEW_CUSTOMER' | 'CROSS_SELL' | 'MAINTENANCE';
  isTarget: boolean; // Counts toward BHAG 10,000 goal
  qualifierCompleted: boolean; // Whether qualifier questions were answered

  // Step 3: Basic Information
  customerName: string;
  industry: string;
  location: string;
  country: string;
  componentWorkpiece: string;
  workType: 'WORKSHOP' | 'ON_SITE' | 'BOTH';
  wearType: string[];
  baseMetal: string;
  generalDimensions: string;
  oem: string; // Original Equipment Manufacturer (BRD Section 5)

  // Step 3: Problem Description
  problemDescription: string;
  previousSolution: string;
  previousServiceLife: string;
  competitorName: string;

  // Step 4: WA Solution
  waSolution: string;
  waProduct: string;
  technicalAdvantages: string;
  expectedServiceLife: string;

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
    costOfPart?: string;
    oldSolutionLifetime?: string;
    waSolutionLifetime?: string;
    partsUsedPerYear?: string;
    maintenanceDowntimeCost?: string;
    disassemblyAssemblyCost?: string;
  };
};

export default function NewCaseStudyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CaseStudyFormData>({
    type: 'APPLICATION',
    qualifierType: undefined,
    isTarget: false,
    qualifierCompleted: false,
    customerName: '',
    industry: '',
    location: '',
    country: '',
    componentWorkpiece: '',
    workType: 'WORKSHOP',
    wearType: [],
    baseMetal: '',
    generalDimensions: '',
    oem: '',
    problemDescription: '',
    previousSolution: '',
    previousServiceLife: '',
    competitorName: '',
    waSolution: '',
    waProduct: '',
    technicalAdvantages: '',
    expectedServiceLife: '',
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
      { number: 2, title: 'Qualifier', description: 'Challenge qualification (BRD 3.1)' },
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

  const validateStep = (step: number): boolean => {
    const currentStepData = STEPS.find(s => s.number === step);
    if (!currentStepData) return false;

    switch (currentStepData.title) {
      case 'Case Type':
        return !!formData.type;
      case 'Qualifier':
        // Customer name required and qualifier questions must be answered
        return !!(formData.customerName && formData.qualifierCompleted);
      case 'Basic Info':
        // BRD 3.3 - Application Case Base: Customer, Industry, Location, Component, Work Type, Wear Type, Base Metal, Dimensions
        return !!(
          formData.customerName &&
          formData.industry &&
          formData.location &&
          formData.componentWorkpiece &&
          formData.workType &&
          formData.wearType.length > 0 &&
          formData.baseMetal &&
          formData.generalDimensions
        );
      case 'Problem':
        // BRD 3.3 - Application Case Base: Problem Description, Previous Solution
        return !!(formData.problemDescription && formData.previousSolution);
      case 'Solution':
        // BRD 3.3 - Application Case Base: WA Solution, WA Product, Technical Advantages
        return !!(formData.waSolution && formData.waProduct && formData.technicalAdvantages);
      case 'WPS':
        // BRD 3.3 - Tech Case Additive: All 8 WPS fields required
        // Base Metal (Detailed), Surface Preparation, Welding Process/Params, Welding Position,
        // Temperature Management, Shielding Gas, Oscillation Details, Additional Notes
        return !!(
          formData.wps?.baseMetalType &&
          formData.wps?.surfacePreparation &&
          formData.wps?.weldingProcess &&
          formData.wps?.weldingPosition &&
          (formData.wps?.preheatTemperature || formData.wps?.interpassTemperature) && // Temperature Management
          formData.wps?.shieldingGas &&
          (formData.wps?.oscillationWidth || formData.wps?.oscillationSpeed) && // Oscillation Details
          formData.wps?.additionalNotes
        );
      case 'Cost Calculator':
        // BRD 3.3 - Star Case Additive: All cost calculator fields required
        return !!(
          formData.costCalculator?.costOfPart &&
          formData.costCalculator?.oldSolutionLifetime &&
          formData.costCalculator?.waSolutionLifetime &&
          formData.costCalculator?.partsUsedPerYear &&
          formData.costCalculator?.maintenanceDowntimeCost &&
          formData.costCalculator?.disassemblyAssemblyCost
        );
      case 'Review':
        // BRD 3.3 - Application Case Base: Financial fields and at least one image required
        return !!(
          formData.solutionValueRevenue &&
          formData.annualPotentialRevenue &&
          formData.customerSavingsAmount &&
          formData.images.length >= 1
        );
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const hasWPS = formData.type === 'TECH' || formData.type === 'STAR';

      // Create the case study draft
      const result = await waCreateCaseStudy({ ...formData, status: 'DRAFT' });

      // If TECH or STAR and WPS data exists, save WPS
      if (hasWPS && formData.wps && result.id && formData.wps.waProductName && formData.wps.weldingProcess) {
        await waSaveWeldingProcedure({
          caseStudyId: result.id,
          waProductName: formData.wps.waProductName,
          weldingProcess: formData.wps.weldingProcess,
          ...formData.wps,
        });
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
              {STEPS.map((step) => (
                <div
                  key={step.number}
                  className={`flex flex-col items-center flex-1 ${
                    step.number < STEPS.length ? 'relative' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                      currentStep === step.number
                        ? 'bg-wa-green-600 text-white'
                        : currentStep > step.number
                        ? 'bg-green-700 text-white' /* Darkened for WCAG AA contrast */
                        : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {step.number}
                  </div>
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
              ))}
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
              {/* Customer Name Search - BRD 3.1 + 3.4D Insightly Integration */}
              <CRMCustomerSearch
                value={formData.customerName}
                onChange={(value) => updateFormData({ customerName: value })}
                onCustomerSelect={(customer: CRMCustomer) => {
                  // Auto-fill fields from CRM data
                  const updates: Partial<CaseStudyFormData> = {
                    customerName: customer.name,
                  };
                  if (customer.city) updates.location = customer.city;
                  if (customer.country) updates.country = customer.country;
                  if (customer.industry) updates.industry = customer.industry;

                  updateFormData(updates);
                  console.log(`[Qualifier] Customer selected from ${customer.source}:`, customer.name);
                }}
                label="Customer Name"
                required
                placeholder="Search Insightly/NetSuite or enter new customer..."
                defaultCRM="insightly"
              />
              <p className="text-sm text-muted-foreground -mt-4">
                Search for existing customers in CRM or enter a new customer name
              </p>

              {/* Challenge Qualifier - only show once customer name is entered */}
              {formData.customerName && (
                <ChallengeQualifier
                  customerName={formData.customerName}
                  onComplete={(result: QualifierResult) => {
                    updateFormData({
                      qualifierType: result.qualifierType,
                      isTarget: result.isTarget,
                      qualifierCompleted: true,
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
            <StepTwo formData={formData} updateFormData={updateFormData} />
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
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="dark:border-border"
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
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

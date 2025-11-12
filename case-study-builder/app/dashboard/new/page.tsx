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
import { createCaseStudy } from '@/lib/actions/case-study-actions';
import { saveWeldingProcedure } from '@/lib/actions/wps-actions';
import { toast } from 'sonner';

export type CaseStudyFormData = {
  // Step 1: Case Type
  type: 'APPLICATION' | 'TECH' | 'STAR';

  // Step 2: Basic Information
  customerName: string;
  industry: string;
  location: string;
  country: string;
  componentWorkpiece: string;
  workType: 'WORKSHOP' | 'ON_SITE' | 'BOTH';
  wearType: string[];
  baseMetal: string;
  generalDimensions: string;

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
};

export default function NewCaseStudyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CaseStudyFormData>({
    type: 'APPLICATION',
    customerName: '',
    industry: '',
    location: '',
    country: '',
    componentWorkpiece: '',
    workType: 'WORKSHOP',
    wearType: [],
    baseMetal: '',
    generalDimensions: '',
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
    wps: undefined,
  });

  // Dynamic steps based on case type
  const STEPS = useMemo(() => {
    const baseSteps = [
      { number: 1, title: 'Case Type', description: 'Select case study type' },
      { number: 2, title: 'Basic Info', description: 'Customer and component details' },
      { number: 3, title: 'Problem', description: 'Describe the challenge' },
      { number: 4, title: 'Solution', description: 'WA solution details' },
    ];

    // Add WPS step for TECH and STAR cases
    if (formData.type === 'TECH' || formData.type === 'STAR') {
      baseSteps.push({ number: 5, title: 'WPS', description: 'Welding procedure specification' });
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
      case 'Basic Info':
        return !!(
          formData.customerName &&
          formData.industry &&
          formData.location &&
          formData.componentWorkpiece &&
          formData.workType &&
          formData.wearType.length > 0
        );
      case 'Problem':
        return !!formData.problemDescription;
      case 'Solution':
        return !!(formData.waSolution && formData.waProduct);
      case 'WPS':
        // WPS required fields: waProductName and weldingProcess
        return !!(formData.wps?.waProductName && formData.wps?.weldingProcess);
      case 'Review':
        return true; // Review step always valid
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
      const result = await createCaseStudy({ ...formData, status: 'DRAFT' });

      // If TECH or STAR and WPS data exists, save WPS
      if (hasWPS && formData.wps && result.id && formData.wps.waProductName && formData.wps.weldingProcess) {
        await saveWeldingProcedure({
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
      const result = await createCaseStudy({ ...formData, status: 'SUBMITTED' });

      // If TECH or STAR and WPS data exists, save WPS
      if (hasWPS && formData.wps && result.id) {
        await saveWeldingProcedure({
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
        <h1 className="text-3xl font-bold text-gray-900">Create New Case Study</h1>
        <p className="text-gray-600 mt-2">
          Document a challenge and solution in just a few minutes
        </p>
      </div>

      {/* Progress */}
      <Card>
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
                        ? 'bg-blue-600 text-white'
                        : currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.number}
                  </div>
                  <div className="text-xs mt-2 text-center">
                    <div className="font-semibold">{step.title}</div>
                    <div className="text-gray-500 hidden sm:block">{step.description}</div>
                  </div>
                  {step.number < STEPS.length && (
                    <div
                      className={`absolute top-5 left-[60%] w-full h-0.5 ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
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
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {STEPS[currentStep - 1]?.title === 'Case Type' && (
            <StepOne formData={formData} updateFormData={updateFormData} />
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

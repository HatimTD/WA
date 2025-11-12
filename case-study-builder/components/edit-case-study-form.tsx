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
import { updateCaseStudy } from '@/lib/actions/case-study-actions';
import { saveWeldingProcedure } from '@/lib/actions/wps-actions';
import { toast } from 'sonner';
import { CaseStudy, WeldingProcedure, CostCalculator } from '@prisma/client';

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

type Props = {
  caseStudy: CaseStudy;
  wpsData?: WeldingProcedure | null;
  costCalcData?: CostCalculator | null;
};

export default function EditCaseStudyForm({ caseStudy, wpsData, costCalcData }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill form data with existing case study values
  const [formData, setFormData] = useState<CaseStudyFormData>({
    type: caseStudy.type as 'APPLICATION' | 'TECH' | 'STAR',
    customerName: caseStudy.customerName,
    industry: caseStudy.industry,
    location: caseStudy.location,
    country: caseStudy.country || '',
    componentWorkpiece: caseStudy.componentWorkpiece,
    workType: caseStudy.workType as 'WORKSHOP' | 'ON_SITE' | 'BOTH',
    wearType: caseStudy.wearType as string[],
    baseMetal: caseStudy.baseMetal || '',
    generalDimensions: caseStudy.generalDimensions || '',
    problemDescription: caseStudy.problemDescription,
    previousSolution: caseStudy.previousSolution || '',
    previousServiceLife: caseStudy.previousServiceLife || '',
    competitorName: caseStudy.competitorName || '',
    waSolution: caseStudy.waSolution,
    waProduct: caseStudy.waProduct,
    technicalAdvantages: caseStudy.technicalAdvantages || '',
    expectedServiceLife: caseStudy.expectedServiceLife || '',
    solutionValueRevenue: caseStudy.solutionValueRevenue ? caseStudy.solutionValueRevenue.toString() : '',
    annualPotentialRevenue: caseStudy.annualPotentialRevenue ? caseStudy.annualPotentialRevenue.toString() : '',
    customerSavingsAmount: caseStudy.customerSavingsAmount ? caseStudy.customerSavingsAmount.toString() : '',
    images: caseStudy.images as string[],
    supportingDocs: caseStudy.supportingDocs as string[],
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
  });

  const updateFormData = (data: Partial<CaseStudyFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

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

      // Convert string decimals to numbers
      const updateData: any = {
        ...formData,
        status: 'DRAFT',
        solutionValueRevenue: formData.solutionValueRevenue ? parseFloat(formData.solutionValueRevenue) : null,
        annualPotentialRevenue: formData.annualPotentialRevenue ? parseFloat(formData.annualPotentialRevenue) : null,
        customerSavingsAmount: formData.customerSavingsAmount ? parseFloat(formData.customerSavingsAmount) : null,
      };

      await updateCaseStudy(caseStudy.id, updateData);

      // If TECH or STAR and WPS data exists, save WPS
      if (hasWPS && formData.wps && formData.wps.waProductName && formData.wps.weldingProcess) {
        await saveWeldingProcedure({
          caseStudyId: caseStudy.id,
          waProductName: formData.wps.waProductName,
          weldingProcess: formData.wps.weldingProcess,
          ...formData.wps,
        });
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

      await updateCaseStudy(caseStudy.id, updateData);

      // If TECH or STAR and WPS data exists, save WPS
      if (hasWPS && formData.wps) {
        await saveWeldingProcedure({
          caseStudyId: caseStudy.id,
          waProductName: formData.wps.waProductName || '',
          weldingProcess: formData.wps.weldingProcess || '',
          ...formData.wps,
        });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Case Study</h1>
          <p className="text-gray-600 mt-2">
            Update your case study information
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/cases/${caseStudy.id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel
        </Button>
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
            <StepFive
              formData={formData}
              updateFormData={updateFormData}
              caseStudyId={caseStudy.id}
              existingCostCalc={costCalcData ? {
                materialCostBefore: Number(costCalcData.materialCostBefore),
                materialCostAfter: Number(costCalcData.materialCostAfter),
                laborCostBefore: Number(costCalcData.laborCostBefore),
                laborCostAfter: Number(costCalcData.laborCostAfter),
                downtimeCostBefore: Number(costCalcData.downtimeCostBefore),
                downtimeCostAfter: Number(costCalcData.downtimeCostAfter),
                maintenanceFrequencyBefore: costCalcData.maintenanceFrequencyBefore,
                maintenanceFrequencyAfter: costCalcData.maintenanceFrequencyAfter,
              } : undefined}
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
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Case Study'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

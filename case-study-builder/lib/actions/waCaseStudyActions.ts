'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { waAutoTranslateOnSubmit } from './waTranslationActions';

type WaCreateCaseStudyInput = {
  type: 'APPLICATION' | 'TECH' | 'STAR';
  title?: string;
  generalDescription?: string; // Overview based on components/basic info
  status?: 'DRAFT' | 'SUBMITTED';
  customerName: string;
  industry: string;
  location: string;
  country: string;
  componentWorkpiece: string;
  workType: 'WORKSHOP' | 'ON_SITE' | 'BOTH';
  wearType: string[];
  wearSeverities?: Record<string, number>; // { "ABRASION": 3, "IMPACT": 2, ... }
  wearTypeOthers?: Array<{ name: string; severity: number }>; // Custom wear types
  baseMetal: string;
  generalDimensions: string;
  oem?: string; // Original Equipment Manufacturer (BRD Section 5)
  unitSystem?: 'METRIC' | 'IMPERIAL'; // Unit system for dimensions
  // Job type and duration
  jobType?: string;
  jobTypeOther?: string;
  jobDurationHours?: string;
  jobDurationDays?: string;
  jobDurationWeeks?: string;
  jobDurationMonths?: string;
  jobDurationYears?: string;
  problemDescription: string;
  previousSolution: string;
  previousServiceLife: string;
  // Granular previous service life (h/d/w/m/y)
  previousServiceLifeHours?: string;
  previousServiceLifeDays?: string;
  previousServiceLifeWeeks?: string;
  previousServiceLifeMonths?: string;
  previousServiceLifeYears?: string;
  // Old solution job duration (h/d/w)
  oldJobDurationHours?: string;
  oldJobDurationDays?: string;
  oldJobDurationWeeks?: string;
  competitorName: string;
  waSolution: string;
  productCategory?: string; // CONSUMABLES, COMPOSITE_WEAR_PLATES, WEAR_PIPES_TUBES, OTHER
  productCategoryOther?: string; // Custom category name when OTHER is selected
  waProduct: string; // Only for CONSUMABLES
  waProductDiameter?: string; // Only for CONSUMABLES (wire diameter e.g., 1.6mm or 0.063in)
  productDescription?: string; // For non-CONSUMABLES categories
  technicalAdvantages: string;
  expectedServiceLife: string;
  // Granular expected service life (h/d/w/m/y)
  expectedServiceLifeHours?: string;
  expectedServiceLifeDays?: string;
  expectedServiceLifeWeeks?: string;
  expectedServiceLifeMonths?: string;
  expectedServiceLifeYears?: string;
  revenueCurrency?: 'USD' | 'EUR' | 'GBP' | 'MAD' | 'AUD' | 'CAD' | 'CHF' | 'JPY' | 'CNY';
  solutionValueRevenue: string;
  annualPotentialRevenue: string;
  customerSavingsAmount: string;
  images: string[];
  supportingDocs: string[];
  tags: string[];
  // Challenge Qualifier fields (BRD 3.1)
  qualifierType?: 'NEW_CUSTOMER' | 'CROSS_SELL' | 'MAINTENANCE';
  isTarget?: boolean;
};

export async function waCreateCaseStudy(data: WaCreateCaseStudyInput) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // Convert string numbers to Decimal
    const solutionValue = data.solutionValueRevenue
      ? parseFloat(data.solutionValueRevenue)
      : null;
    const annualPotential = data.annualPotentialRevenue
      ? parseFloat(data.annualPotentialRevenue)
      : null;
    const customerSavings = data.customerSavingsAmount
      ? parseFloat(data.customerSavingsAmount)
      : null;

    // Normalize wearType values to uppercase (now accepts any string from master data)
    const normalizedWearType = (data.wearType || [])
      .map((wt: string) => wt.toUpperCase());

    const caseStudy = await prisma.waCaseStudy.create({
      data: {
        type: data.type,
        title: data.title || null,
        generalDescription: data.generalDescription || null,
        status: data.status || 'DRAFT',
        contributorId: session.user.id,
        customerName: data.customerName,
        industry: data.industry,
        location: data.location,
        country: data.country || null,
        componentWorkpiece: data.componentWorkpiece,
        workType: data.workType,
        wearType: normalizedWearType as any,
        wearSeverities: data.wearSeverities || undefined,
        wearTypeOthers: data.wearTypeOthers || undefined,
        baseMetal: data.baseMetal || null,
        generalDimensions: data.generalDimensions || null,
        oem: data.oem || null,
        unitSystem: data.unitSystem || 'METRIC',
        // Job type and duration
        jobType: data.jobType || null,
        jobTypeOther: data.jobTypeOther || null,
        jobDurationHours: data.jobDurationHours || null,
        jobDurationDays: data.jobDurationDays || null,
        jobDurationWeeks: data.jobDurationWeeks || null,
        jobDurationMonths: data.jobDurationMonths || null,
        jobDurationYears: data.jobDurationYears || null,
        problemDescription: data.problemDescription,
        previousSolution: data.previousSolution || null,
        previousServiceLife: data.previousServiceLife || null,
        // Granular previous service life
        previousServiceLifeHours: data.previousServiceLifeHours || null,
        previousServiceLifeDays: data.previousServiceLifeDays || null,
        previousServiceLifeWeeks: data.previousServiceLifeWeeks || null,
        previousServiceLifeMonths: data.previousServiceLifeMonths || null,
        previousServiceLifeYears: data.previousServiceLifeYears || null,
        // Old solution job duration
        oldJobDurationHours: data.oldJobDurationHours || null,
        oldJobDurationDays: data.oldJobDurationDays || null,
        oldJobDurationWeeks: data.oldJobDurationWeeks || null,
        competitorName: data.competitorName || null,
        waSolution: data.waSolution,
        productCategory: data.productCategory || null,
        productCategoryOther: data.productCategoryOther || null,
        waProduct: data.waProduct,
        waProductDiameter: data.waProductDiameter || null,
        productDescription: data.productDescription || null,
        technicalAdvantages: data.technicalAdvantages || null,
        expectedServiceLife: data.expectedServiceLife || null,
        // Granular expected service life
        expectedServiceLifeHours: data.expectedServiceLifeHours || null,
        expectedServiceLifeDays: data.expectedServiceLifeDays || null,
        expectedServiceLifeWeeks: data.expectedServiceLifeWeeks || null,
        expectedServiceLifeMonths: data.expectedServiceLifeMonths || null,
        expectedServiceLifeYears: data.expectedServiceLifeYears || null,
        revenueCurrency: data.revenueCurrency || 'EUR',
        solutionValueRevenue: solutionValue,
        annualPotentialRevenue: annualPotential,
        customerSavingsAmount: customerSavings,
        images: data.images || [],
        supportingDocs: data.supportingDocs || [],
        tags: data.tags || [],
        submittedAt: data.status === 'SUBMITTED' ? new Date() : null,
        // Challenge Qualifier fields (BRD 3.1)
        qualifierType: data.qualifierType || null,
        isTarget: data.isTarget || false,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/my-cases');

    logger.audit('CASE_CREATED', session.user.id, caseStudy.id, {
      type: data.type,
      status: data.status || 'DRAFT'
    });

    // BRD: Auto-translate to Corporate English on submission
    // Translation runs synchronously so it's ready when user views the case
    if (data.status === 'SUBMITTED') {
      try {
        const translationResult = await waAutoTranslateOnSubmit(caseStudy.id);
        if (translationResult.wasTranslated) {
          console.log(`[Case Study] Auto-translated case ${caseStudy.id} from ${translationResult.originalLanguage} to English`);
        } else if (translationResult.originalLanguage !== 'en') {
          console.log(`[Case Study] Detected ${translationResult.originalLanguage} but translation not performed`);
        }
      } catch (err) {
        console.error(`[Case Study] Auto-translation failed for ${caseStudy.id}:`, err);
        // Don't fail the submission if translation fails
      }
    }

    return { success: true, id: caseStudy.id };
  } catch (error: any) {
    logger.error('Case creation failed', {
      userId: session.user.id,
      error: error.message,
      code: error.code,
      meta: error.meta
    });
    console.error('Error creating case study:', error);

    // Check for unique constraint violation
    if (error.code === 'P2002') {
      throw new Error(
        'A case study with this combination already exists. Each challenge must be unique.'
      );
    }

    // Check for validation errors
    if (error.code === 'P2003') {
      throw new Error('Invalid reference: A related record was not found.');
    }

    // Check for invalid data type
    if (error.code === 'P2005' || error.code === 'P2006') {
      throw new Error(`Invalid data format: ${error.meta?.field_name || 'unknown field'}`);
    }

    // Return actual error message for debugging (in development)
    const errorMessage = error.message || 'Unknown error occurred';
    throw new Error(`Failed to create case study: ${errorMessage}`);
  }
}

export async function waUpdateCaseStudy(id: string, data: any) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // Verify ownership or approver role
    const caseStudy = await prisma.waCaseStudy.findUnique({
      where: { id },
    });

    if (!caseStudy) {
      throw new Error('Case study not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (
      caseStudy.contributorId !== session.user.id &&
      user?.role !== 'APPROVER'
    ) {
      throw new Error('Unauthorized to edit this case study');
    }

    // Prepare update data with proper type conversions
    const updateData: any = { ...data };

    // Remove WPS and cost calculator data (handled separately)
    delete updateData.wps;
    delete updateData.costCalculator;

    // Remove form-only fields that don't exist in the database schema
    delete updateData.customerSelected;
    delete updateData.qualifierCompleted;
    delete updateData.industryOther;

    // Handle wearType array conversion if present - normalize to uppercase (accepts any string from master data)
    if (data.wearType) {
      updateData.wearType = data.wearType
        .map((wt: string) => wt.toUpperCase());
    }

    // Handle wearSeverities JSON
    if (data.wearSeverities !== undefined) {
      updateData.wearSeverities = data.wearSeverities || undefined;
    }

    // Handle wearTypeOthers JSON
    if (data.wearTypeOthers !== undefined) {
      updateData.wearTypeOthers = data.wearTypeOthers || undefined;
    }

    // Handle qualifierType - ensure it's saved correctly
    if (data.qualifierType !== undefined) {
      updateData.qualifierType = data.qualifierType || null;
    }

    // Handle isTarget - ensure boolean is saved correctly
    if (data.isTarget !== undefined) {
      updateData.isTarget = !!data.isTarget;
    }

    // Handle decimal conversions if present
    if (data.solutionValueRevenue !== undefined) {
      updateData.solutionValueRevenue = typeof data.solutionValueRevenue === 'string'
        ? parseFloat(data.solutionValueRevenue) || null
        : data.solutionValueRevenue;
    }

    if (data.annualPotentialRevenue !== undefined) {
      updateData.annualPotentialRevenue = typeof data.annualPotentialRevenue === 'string'
        ? parseFloat(data.annualPotentialRevenue) || null
        : data.annualPotentialRevenue;
    }

    if (data.customerSavingsAmount !== undefined) {
      updateData.customerSavingsAmount = typeof data.customerSavingsAmount === 'string'
        ? parseFloat(data.customerSavingsAmount) || null
        : data.customerSavingsAmount;
    }

    // Handle empty strings to null
    if (data.country === '') updateData.country = null;
    if (data.baseMetal === '') updateData.baseMetal = null;
    if (data.generalDimensions === '') updateData.generalDimensions = null;
    if (data.generalDescription === '') updateData.generalDescription = null;
    if (data.previousSolution === '') updateData.previousSolution = null;
    if (data.previousServiceLife === '') updateData.previousServiceLife = null;
    if (data.competitorName === '') updateData.competitorName = null;
    if (data.technicalAdvantages === '') updateData.technicalAdvantages = null;
    if (data.expectedServiceLife === '') updateData.expectedServiceLife = null;
    if (data.oem === '') updateData.oem = null;
    if (data.productCategory === '') updateData.productCategory = null;
    if (data.productCategoryOther === '') updateData.productCategoryOther = null;
    if (data.waProductDiameter === '') updateData.waProductDiameter = null;
    if (data.productDescription === '') updateData.productDescription = null;
    // Granular service life fields
    if (data.previousServiceLifeHours === '') updateData.previousServiceLifeHours = null;
    if (data.previousServiceLifeDays === '') updateData.previousServiceLifeDays = null;
    if (data.previousServiceLifeWeeks === '') updateData.previousServiceLifeWeeks = null;
    if (data.previousServiceLifeMonths === '') updateData.previousServiceLifeMonths = null;
    if (data.previousServiceLifeYears === '') updateData.previousServiceLifeYears = null;
    if (data.expectedServiceLifeHours === '') updateData.expectedServiceLifeHours = null;
    if (data.expectedServiceLifeDays === '') updateData.expectedServiceLifeDays = null;
    if (data.expectedServiceLifeWeeks === '') updateData.expectedServiceLifeWeeks = null;
    if (data.expectedServiceLifeMonths === '') updateData.expectedServiceLifeMonths = null;
    if (data.expectedServiceLifeYears === '') updateData.expectedServiceLifeYears = null;
    // Old job duration fields
    if (data.oldJobDurationHours === '') updateData.oldJobDurationHours = null;
    if (data.oldJobDurationDays === '') updateData.oldJobDurationDays = null;
    if (data.oldJobDurationWeeks === '') updateData.oldJobDurationWeeks = null;
    // Job type and duration fields
    if (data.jobType === '') updateData.jobType = null;
    if (data.jobTypeOther === '') updateData.jobTypeOther = null;
    if (data.jobDurationHours === '') updateData.jobDurationHours = null;
    if (data.jobDurationDays === '') updateData.jobDurationDays = null;
    if (data.jobDurationWeeks === '') updateData.jobDurationWeeks = null;
    if (data.jobDurationMonths === '') updateData.jobDurationMonths = null;
    if (data.jobDurationYears === '') updateData.jobDurationYears = null;

    updateData.updatedAt = new Date();

    const updated = await prisma.waCaseStudy.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/my-cases');
    revalidatePath(`/dashboard/cases/${id}`);

    logger.audit('CASE_UPDATED', session.user.id, id, {
      type: updated.type,
      status: updated.status
    });

    // BRD: Auto-translate to Corporate English when status changes to SUBMITTED
    // Translation runs synchronously so it's ready when user views the case
    if (data.status === 'SUBMITTED' && caseStudy.status !== 'SUBMITTED') {
      try {
        const translationResult = await waAutoTranslateOnSubmit(id);
        if (translationResult.wasTranslated) {
          console.log(`[Case Study] Auto-translated case ${id} from ${translationResult.originalLanguage} to English`);
        } else if (translationResult.originalLanguage !== 'en') {
          console.log(`[Case Study] Detected ${translationResult.originalLanguage} but translation not performed`);
        }
      } catch (err) {
        console.error(`[Case Study] Auto-translation failed for ${id}:`, err);
        // Don't fail the update if translation fails
      }
    }

    return { success: true, id: updated.id };
  } catch (error: any) {
    logger.error('Case update failed', {
      userId: session.user.id,
      caseId: id,
      error: error.message
    });
    console.error('Error updating case study:', error);
    throw new Error('Failed to update case study');
  }
}

export async function waDeleteCaseStudy(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const caseStudy = await prisma.waCaseStudy.findUnique({
      where: { id },
    });

    if (!caseStudy) {
      throw new Error('Case study not found');
    }

    if (caseStudy.contributorId !== session.user.id) {
      throw new Error('Unauthorized to delete this case study');
    }

    await prisma.waCaseStudy.delete({
      where: { id },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/my-cases');

    logger.audit('CASE_DELETED', session.user.id, id, {
      customerName: caseStudy.customerName,
      type: caseStudy.type
    });

    return { success: true };
  } catch (error: any) {
    logger.error('Case deletion failed', {
      userId: session.user.id,
      caseId: id,
      error: error.message
    });
    console.error('Error deleting case study:', error);
    throw new Error('Failed to delete case study');
  }
}

/**
 * Fetch the most recent industry for a customer from existing case studies
 * This will be replaced with NetSuite API call when access is available
 */
export async function waGetCustomerIndustry(customerName: string): Promise<{
  success: boolean;
  industry?: string;
  industries?: string[];
  error?: string;
}> {
  try {
    if (!customerName || customerName.trim().length < 2) {
      return { success: false, error: 'Customer name is required' };
    }

    // Find all case studies for this customer and get their industries
    const caseStudies = await prisma.waCaseStudy.findMany({
      where: {
        customerName: {
          equals: customerName,
          mode: 'insensitive',
        },
      },
      select: {
        industry: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    if (caseStudies.length === 0) {
      return { success: true, industry: undefined, industries: [] };
    }

    // Get unique industries
    const uniqueIndustries = [...new Set(caseStudies.map(cs => cs.industry))];

    // Return the most recent industry as the default
    return {
      success: true,
      industry: caseStudies[0].industry,
      industries: uniqueIndustries,
    };
  } catch (error) {
    console.error('Error fetching customer industry:', error);
    return { success: false, error: 'Failed to fetch customer industry' };
  }
}

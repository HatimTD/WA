'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type WaCreateCaseStudyInput = {
  type: 'APPLICATION' | 'TECH' | 'STAR';
  status?: 'DRAFT' | 'SUBMITTED';
  customerName: string;
  industry: string;
  location: string;
  country: string;
  componentWorkpiece: string;
  workType: 'WORKSHOP' | 'ON_SITE' | 'BOTH';
  wearType: string[];
  baseMetal: string;
  generalDimensions: string;
  oem?: string; // Original Equipment Manufacturer (BRD Section 5)
  problemDescription: string;
  previousSolution: string;
  previousServiceLife: string;
  competitorName: string;
  waSolution: string;
  waProduct: string;
  technicalAdvantages: string;
  expectedServiceLife: string;
  solutionValueRevenue: string;
  annualPotentialRevenue: string;
  customerSavingsAmount: string;
  images: string[];
  supportingDocs: string[];
  tags: string[];
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

    const caseStudy = await prisma.waCaseStudy.create({
      data: {
        type: data.type,
        status: data.status || 'DRAFT',
        contributorId: session.user.id,
        customerName: data.customerName,
        industry: data.industry,
        location: data.location,
        country: data.country || null,
        componentWorkpiece: data.componentWorkpiece,
        workType: data.workType,
        wearType: data.wearType as any,
        baseMetal: data.baseMetal || null,
        generalDimensions: data.generalDimensions || null,
        oem: data.oem || null,
        problemDescription: data.problemDescription,
        previousSolution: data.previousSolution || null,
        previousServiceLife: data.previousServiceLife || null,
        competitorName: data.competitorName || null,
        waSolution: data.waSolution,
        waProduct: data.waProduct,
        technicalAdvantages: data.technicalAdvantages || null,
        expectedServiceLife: data.expectedServiceLife || null,
        solutionValueRevenue: solutionValue,
        annualPotentialRevenue: annualPotential,
        customerSavingsAmount: customerSavings,
        images: data.images || [],
        supportingDocs: data.supportingDocs || [],
        tags: data.tags || [],
        submittedAt: data.status === 'SUBMITTED' ? new Date() : null,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/my-cases');

    logger.audit('CASE_CREATED', session.user.id, caseStudy.id, {
      type: data.type,
      status: data.status || 'DRAFT'
    });

    return { success: true, id: caseStudy.id };
  } catch (error: any) {
    logger.error('Case creation failed', {
      userId: session.user.id,
      error: error.message
    });
    console.error('Error creating case study:', error);

    // Check for unique constraint violation
    if (error.code === 'P2002') {
      throw new Error(
        'A case study with this combination already exists. Each challenge must be unique.'
      );
    }

    throw new Error('Failed to create case study. Please try again.');
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

    // Remove WPS data from case study update (it's handled separately)
    delete updateData.wps;

    // Handle wearType array conversion if present
    if (data.wearType) {
      updateData.wearType = data.wearType as any;
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
    if (data.previousSolution === '') updateData.previousSolution = null;
    if (data.previousServiceLife === '') updateData.previousServiceLife = null;
    if (data.competitorName === '') updateData.competitorName = null;
    if (data.technicalAdvantages === '') updateData.technicalAdvantages = null;
    if (data.expectedServiceLife === '') updateData.expectedServiceLife = null;
    if (data.oem === '') updateData.oem = null;

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

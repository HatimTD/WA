'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { waCheckAndAwardBadges } from './waBadgeActions';
import { waCreateNotification } from './waNotificationActions';
import { generateCaseStudyPDF, type CaseStudyPDFData } from '@/lib/pdf-export';
import { waPushPDFToCRM } from './waInsightlyActions';

export async function waApproveCaseStudy(caseStudyId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Check if user is an approver
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'APPROVER') {
      return { success: false, error: 'Only approvers can approve case studies' };
    }

    // Check if case study exists and is submitted
    const caseStudy = await prisma.waCaseStudy.findUnique({
      where: { id: caseStudyId },
      select: {
        status: true,
        type: true,
        contributorId: true,
        customerName: true,
        industry: true,
      },
    });

    if (!caseStudy) {
      return { success: false, error: 'Case study not found' };
    }

    if (caseStudy.status !== 'SUBMITTED') {
      return { success: false, error: 'Only submitted case studies can be approved' };
    }

    // Calculate points based on type
    const pointsMap = {
      APPLICATION: 1,
      TECH: 2,
      STAR: 3,
    };
    const points = pointsMap[caseStudy.type];

    // Update case study and award points in a transaction
    await prisma.$transaction([
      // Approve case study
      prisma.waCaseStudy.update({
        where: { id: caseStudyId },
        data: {
          status: 'APPROVED',
          approverId: session.user.id,
          approvedAt: new Date(),
        },
      }),
      // Award points to contributor
      prisma.user.update({
        where: { id: caseStudy.contributorId },
        data: {
          totalPoints: {
            increment: points,
          },
        },
      }),
    ]);

    // Check and award badges based on approved case counts
    const badgeResult = await waCheckAndAwardBadges(caseStudy.contributorId);

    // Send approval notification to contributor
    await waCreateNotification({
      userId: caseStudy.contributorId,
      type: 'CASE_APPROVED',
      title: 'Case Study Approved!',
      message: `Your case study "${caseStudy.customerName} - ${caseStudy.industry}" has been approved and is now live. You earned ${points} point${points > 1 ? 's' : ''}!`,
      link: `/dashboard/cases/${caseStudyId}`,
    });

    // Send badge notification if new badges were awarded
    if (badgeResult.success && badgeResult.newBadges && badgeResult.newBadges.length > 0) {
      for (const badge of badgeResult.newBadges) {
        await waCreateNotification({
          userId: caseStudy.contributorId,
          type: 'BADGE_EARNED',
          title: 'New Badge Earned!',
          message: `Congratulations! You've earned the ${badge} badge!`,
          link: '/dashboard/analytics',
        });
      }
    }

    revalidatePath('/dashboard/approvals');
    revalidatePath('/dashboard/my-cases');
    revalidatePath(`/dashboard/cases/${caseStudyId}`);

    logger.audit('CASE_APPROVED', session.user.id, caseStudyId, {
      type: caseStudy.type,
      contributorId: caseStudy.contributorId,
      pointsAwarded: points
    });

    // BRD 3.4D - Push PDF to CRM upon publication (async, non-blocking)
    waPushApprovedCaseToCRM(caseStudyId).catch((error) => {
      logger.error('CRM push failed after approval', {
        caseId: caseStudyId,
        error: error.message
      });
    });

    return {
      success: true,
      badgeAwarded: badgeResult.success && badgeResult.newBadges && badgeResult.newBadges.length > 0,
      newBadges: badgeResult.newBadges || [],
      badgeMessage: badgeResult.message,
    };
  } catch (error: any) {
    logger.error('Case approval failed', {
      userId: session.user.id,
      caseId: caseStudyId,
      error: error.message
    });
    console.error('Error approving case study:', error);
    return { success: false, error: 'Failed to approve case study' };
  }
}

export async function waRejectCaseStudy(caseStudyId: string, reason: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!reason || !reason.trim()) {
    return { success: false, error: 'Rejection reason is required' };
  }

  try {
    // Check if user is an approver
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'APPROVER') {
      return { success: false, error: 'Only approvers can reject case studies' };
    }

    // Check if case study exists and is submitted
    const caseStudy = await prisma.waCaseStudy.findUnique({
      where: { id: caseStudyId },
      select: {
        status: true,
        contributorId: true,
        customerName: true,
        industry: true,
      },
    });

    if (!caseStudy) {
      return { success: false, error: 'Case study not found' };
    }

    if (caseStudy.status !== 'SUBMITTED') {
      return { success: false, error: 'Only submitted case studies can be rejected' };
    }

    // Reject case study with reason
    await prisma.waCaseStudy.update({
      where: { id: caseStudyId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason.trim(),
        rejectedAt: new Date(),
        rejectedBy: session.user.id,
      },
    });

    // Send rejection notification to contributor
    await waCreateNotification({
      userId: caseStudy.contributorId,
      type: 'CASE_REJECTED',
      title: 'Case Study Needs Revision',
      message: `Your case study "${caseStudy.customerName} - ${caseStudy.industry}" requires revisions. Please review the feedback and resubmit.`,
      link: `/dashboard/my-cases`,
    });

    revalidatePath('/dashboard/approvals');
    revalidatePath('/dashboard/my-cases');
    revalidatePath(`/dashboard/cases/${caseStudyId}`);

    logger.audit('CASE_REJECTED', session.user.id, caseStudyId, {
      contributorId: caseStudy.contributorId,
      reason: reason.trim()
    });

    return { success: true };
  } catch (error: any) {
    logger.error('Case rejection failed', {
      userId: session.user.id,
      caseId: caseStudyId,
      error: error.message
    });
    console.error('Error rejecting case study:', error);
    return { success: false, error: 'Failed to reject case study' };
  }
}

/**
 * BRD 3.4D - Push approved case study PDF to CRM
 * Called asynchronously after case approval to sync with Insightly
 */
async function waPushApprovedCaseToCRM(caseStudyId: string): Promise<void> {
  try {
    // Fetch full case study data for PDF generation
    const caseStudy = await prisma.waCaseStudy.findUnique({
      where: { id: caseStudyId },
      include: {
        contributor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!caseStudy) {
      logger.error('CRM push: Case study not found', { caseId: caseStudyId });
      return;
    }

    if (caseStudy.status !== 'APPROVED') {
      logger.error('CRM push: Case study not approved', { caseId: caseStudyId, status: caseStudy.status });
      return;
    }

    // Prepare PDF data
    const pdfData: CaseStudyPDFData = {
      id: caseStudy.id,
      type: caseStudy.type,
      customerName: caseStudy.customerName,
      industry: caseStudy.industry,
      componentWorkpiece: caseStudy.componentWorkpiece,
      workType: caseStudy.workType,
      wearType: caseStudy.wearType,
      problemDescription: caseStudy.problemDescription,
      previousSolution: caseStudy.previousSolution || undefined,
      previousServiceLife: caseStudy.previousServiceLife || undefined,
      competitorName: caseStudy.competitorName || undefined,
      baseMetal: caseStudy.baseMetal || undefined,
      generalDimensions: caseStudy.generalDimensions || undefined,
      waSolution: caseStudy.waSolution,
      waProduct: caseStudy.waProduct,
      technicalAdvantages: caseStudy.technicalAdvantages || undefined,
      expectedServiceLife: caseStudy.expectedServiceLife || undefined,
      solutionValueRevenue: caseStudy.solutionValueRevenue ? Number(caseStudy.solutionValueRevenue) : undefined,
      annualPotentialRevenue: caseStudy.annualPotentialRevenue ? Number(caseStudy.annualPotentialRevenue) : undefined,
      customerSavingsAmount: caseStudy.customerSavingsAmount ? Number(caseStudy.customerSavingsAmount) : undefined,
      location: caseStudy.location,
      country: caseStudy.country || undefined,
      contributor: {
        name: caseStudy.contributor.name || 'Unknown',
        email: caseStudy.contributor.email || '',
      },
      approver: caseStudy.approver ? {
        name: caseStudy.approver.name || 'Unknown',
      } : undefined,
      createdAt: caseStudy.createdAt,
      approvedAt: caseStudy.approvedAt || undefined,
    };

    // Generate PDF
    const doc = generateCaseStudyPDF(pdfData);
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const pdfBase64 = pdfBuffer.toString('base64');

    // Push to CRM
    const result = await waPushPDFToCRM(caseStudyId, pdfBase64);

    if (result.success) {
      logger.audit('CRM_PUSH_SUCCESS', 'system', caseStudyId, {
        opportunityId: result.opportunityId,
        fileId: result.fileId,
      });
    } else {
      logger.error('CRM push failed', {
        caseId: caseStudyId,
        error: result.error,
      });
    }
  } catch (error: any) {
    logger.error('CRM push exception', {
      caseId: caseStudyId,
      error: error.message,
    });
  }
}

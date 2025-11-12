'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { checkAndAwardBadges } from './badge-actions';

export async function approveCaseStudy(caseStudyId: string) {
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
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id: caseStudyId },
      select: { status: true, type: true, contributorId: true },
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
      prisma.caseStudy.update({
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
    const badgeResult = await checkAndAwardBadges(caseStudy.contributorId);

    // TODO: Send notification to contributor

    revalidatePath('/dashboard/approvals');
    revalidatePath('/dashboard/my-cases');
    revalidatePath(`/dashboard/cases/${caseStudyId}`);

    return {
      success: true,
      badgeAwarded: badgeResult.success && badgeResult.newBadges && badgeResult.newBadges.length > 0,
      newBadges: badgeResult.newBadges || [],
      badgeMessage: badgeResult.message,
    };
  } catch (error) {
    console.error('Error approving case study:', error);
    return { success: false, error: 'Failed to approve case study' };
  }
}

export async function rejectCaseStudy(caseStudyId: string, reason: string) {
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
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id: caseStudyId },
      select: { status: true },
    });

    if (!caseStudy) {
      return { success: false, error: 'Case study not found' };
    }

    if (caseStudy.status !== 'SUBMITTED') {
      return { success: false, error: 'Only submitted case studies can be rejected' };
    }

    // Reject case study
    // Note: We're not storing the rejection reason in the current schema
    // You could add a rejectionReason field to the CaseStudy model
    await prisma.caseStudy.update({
      where: { id: caseStudyId },
      data: {
        status: 'REJECTED',
        approverId: session.user.id,
        approvedAt: new Date(), // Using same field to track when it was reviewed
      },
    });

    // TODO: Send notification to contributor with reason

    revalidatePath('/dashboard/approvals');
    revalidatePath('/dashboard/my-cases');
    revalidatePath(`/dashboard/cases/${caseStudyId}`);

    return { success: true };
  } catch (error) {
    console.error('Error rejecting case study:', error);
    return { success: false, error: 'Failed to reject case study' };
  }
}

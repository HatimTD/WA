'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { waCheckAndAwardBadges } from './waBadgeActions';
import { waCreateNotification } from './waNotificationActions';

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
    const caseStudy = await prisma.caseStudy.findUnique({
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
    const caseStudy = await prisma.caseStudy.findUnique({
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
    await prisma.caseStudy.update({
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

'use server';

import { prisma } from '@/lib/prisma';
import { Badge, CaseType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Badge thresholds
const WA_BADGE_REQUIREMENTS = {
  EXPLORER: { type: 'APPLICATION' as CaseType, count: 10 },
  EXPERT: { type: 'TECH' as CaseType, count: 10 },
  CHAMPION: { type: 'STAR' as CaseType, count: 10 },
};

/**
 * Check and award badges to a user based on their approved case studies
 * Call this after approving a case study
 */
export async function waCheckAndAwardBadges(userId: string) {
  try {
    // Get user's current badges
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { badges: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const currentBadges = user.badges as Badge[];
    const newBadges: Badge[] = [];

    // Check each badge type
    for (const [badgeName, requirement] of Object.entries(WA_BADGE_REQUIREMENTS)) {
      const badge = badgeName as Badge;

      // Skip if user already has this badge
      if (currentBadges.includes(badge)) {
        continue;
      }

      // Count approved cases of this type
      const approvedCount = await prisma.waCaseStudy.count({
        where: {
          contributorId: userId,
          status: 'APPROVED',
          type: requirement.type,
        },
      });

      // Award badge if threshold is met
      if (approvedCount >= requirement.count) {
        newBadges.push(badge);
      }
    }

    // Update user's badges if any new badges earned
    if (newBadges.length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          badges: [...currentBadges, ...newBadges],
        },
      });

      revalidatePath('/dashboard');
      revalidatePath('/dashboard/leaderboard');

      return {
        success: true,
        newBadges,
        message: `Congratulations! You earned ${newBadges.length} new badge(s): ${newBadges.join(', ')}`,
      };
    }

    return { success: true, newBadges: [] };
  } catch (error) {
    console.error('Error checking badges:', error);
    return { success: false, error: 'Failed to check badges' };
  }
}

/**
 * Get badge progress for a user
 */
export async function waGetUserBadgeProgress(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { badges: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const progress = await Promise.all(
      Object.entries(WA_BADGE_REQUIREMENTS).map(async ([badgeName, requirement]) => {
        const badge = badgeName as Badge;
        const earned = (user.badges as Badge[]).includes(badge);

        const count = await prisma.waCaseStudy.count({
          where: {
            contributorId: userId,
            status: 'APPROVED',
            type: requirement.type,
          },
        });

        return {
          badge,
          earned,
          progress: count,
          required: requirement.count,
          percentage: Math.min(100, Math.round((count / requirement.count) * 100)),
        };
      })
    );

    return { success: true, progress };
  } catch (error) {
    console.error('Error fetching badge progress:', error);
    return { success: false, error: 'Failed to fetch badge progress' };
  }
}

'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Badge as BadgeType } from '@prisma/client';
import { WA_REGIONS } from '@/lib/constants/waRegions';

export type LeaderboardUser = {
  id: string;
  name: string | null;
  email: string;
  totalPoints: number;
  badges: BadgeType[];
  region: string | null;
  approvedCases: number;
};

/**
 * Get leaderboard data with optional regional filtering
 * BRD - Gamification: Global and Regional rankings
 */
export async function waGetLeaderboardData(region?: string | null) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Build where clause for regional filtering
    const whereClause = region && region !== 'all' ? { region } : {};

    // Get all users ranked by points
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        totalPoints: true,
        badges: true,
        region: true,
        _count: {
          select: {
            caseStudies: {
              where: { status: 'APPROVED' },
            },
          },
        },
      },
      orderBy: {
        totalPoints: 'desc',
      },
    });

    const leaderboardUsers: LeaderboardUser[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      totalPoints: user.totalPoints,
      badges: user.badges as BadgeType[],
      region: user.region,
      approvedCases: user._count.caseStudies,
    }));

    // Find current user's rank in the filtered list
    const currentUserRank = leaderboardUsers.findIndex((u) => u.id === session.user.id) + 1;
    const currentUser = leaderboardUsers.find((u) => u.id === session.user.id);

    return {
      success: true,
      users: leaderboardUsers,
      currentUserRank: currentUserRank > 0 ? currentUserRank : null,
      currentUser,
      currentUserId: session.user.id,
    };
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return { success: false, error: 'Failed to fetch leaderboard data' };
  }
}

/**
 * Get all available regions for the filter dropdown
 * Uses predefined WA_REGIONS from constants (matches NetSuite)
 */
export async function waGetAvailableRegions() {
  try {
    // Return predefined regions from constants (aligned with NetSuite)
    const regions = WA_REGIONS.map((r) => r.value);

    return {
      success: true,
      regions,
    };
  } catch (error) {
    console.error('Error fetching regions:', error);
    return { success: false, error: 'Failed to fetch regions', regions: [] };
  }
}

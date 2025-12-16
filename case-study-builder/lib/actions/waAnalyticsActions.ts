'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import type {
  AdminAnalytics,
  ContributorAnalytics,
  ApproverAnalytics,
  ViewerAnalytics,
} from '@/lib/types/analytics';

// Helper function to get date ranges
function getMonthlyDateRange(monthsBack: number = 6) {
  const dates = [];
  const now = new Date();

  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    dates.push({
      label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    });
  }

  return dates;
}

// ADMIN Analytics
export async function waGetAdminAnalytics(): Promise<AdminAnalytics> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    throw new Error('Unauthorized - Admin access required');
  }

  // Total cases over time (last 6 months)
  const monthlyRange = getMonthlyDateRange(6);
  const casesOverTime = await Promise.all(
    monthlyRange.map(async ({ label, year, month }) => {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const count = await prisma.waCaseStudy.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      return { month: label, count };
    })
  );

  // Cases by type
  const casesByType = await prisma.waCaseStudy.groupBy({
    by: ['type'],
    _count: true,
  });

  // Cases by status
  const casesByStatus = await prisma.waCaseStudy.groupBy({
    by: ['status'],
    _count: true,
  });

  // Cases by industry (top 10)
  const casesByIndustry = await prisma.waCaseStudy.groupBy({
    by: ['industry'],
    _count: true,
    orderBy: {
      _count: {
        industry: 'desc',
      },
    },
    take: 10,
  });

  // Top contributors by points
  const topContributors = await prisma.user.findMany({
    where: {
      totalPoints: {
        gt: 0,
      },
    },
    select: {
      id: true,
      name: true,
      totalPoints: true,
      _count: {
        select: {
          caseStudies: true,
        },
      },
    },
    orderBy: {
      totalPoints: 'desc',
    },
    take: 10,
  });

  // Approval rate over time
  const approvalRateOverTime = await Promise.all(
    monthlyRange.map(async ({ label, year, month }) => {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const submitted = await prisma.waCaseStudy.count({
        where: {
          submittedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const approved = await prisma.waCaseStudy.count({
        where: {
          approvedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const rate = submitted > 0 ? Math.round((approved / submitted) * 100) : 0;

      return { month: label, rate, approved, submitted };
    })
  );

  // Summary stats
  const totalCases = await prisma.waCaseStudy.count();
  const totalUsers = await prisma.user.count();
  const approvedCases = await prisma.waCaseStudy.count({
    where: { status: 'APPROVED' },
  });
  const pendingCases = await prisma.waCaseStudy.count({
    where: { status: 'SUBMITTED' },
  });

  return {
    casesOverTime,
    casesByType: casesByType.map(item => ({
      type: item.type,
      count: item._count,
    })),
    casesByStatus: casesByStatus.map(item => ({
      status: item.status,
      count: item._count,
    })),
    casesByIndustry: casesByIndustry.map(item => ({
      industry: item.industry,
      count: item._count,
    })),
    topContributors: topContributors.map(user => ({
      name: user.name || 'Unknown',
      points: user.totalPoints,
      cases: user._count.caseStudies,
    })),
    approvalRateOverTime,
    summary: {
      totalCases,
      totalUsers,
      approvedCases,
      pendingCases,
    },
  };
}

// CONTRIBUTOR Analytics
export async function waGetContributorAnalytics(): Promise<ContributorAnalytics> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;

  // Submissions over time
  const monthlyRange = getMonthlyDateRange(6);
  const submissionsOverTime = await Promise.all(
    monthlyRange.map(async ({ label, year, month }) => {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const count = await prisma.waCaseStudy.count({
        where: {
          contributorId: userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      return { month: label, count };
    })
  );

  // Cases by type
  const casesByType = await prisma.waCaseStudy.groupBy({
    by: ['type'],
    where: {
      contributorId: userId,
    },
    _count: true,
  });

  // Cases by status
  const casesByStatus = await prisma.waCaseStudy.groupBy({
    by: ['status'],
    where: {
      contributorId: userId,
    },
    _count: true,
  });

  // Badge progress
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      totalPoints: true,
      badges: true,
      _count: {
        select: {
          caseStudies: {
            where: {
              status: 'APPROVED',
            },
          },
        },
      },
    },
  });

  const approvedByType = await prisma.waCaseStudy.groupBy({
    by: ['type'],
    where: {
      contributorId: userId,
      status: 'APPROVED',
    },
    _count: true,
  });

  const badgeProgress = {
    EXPLORER: approvedByType.find(t => t.type === 'APPLICATION')?._count || 0,
    EXPERT: approvedByType.find(t => t.type === 'TECH')?._count || 0,
    CHAMPION: approvedByType.find(t => t.type === 'STAR')?._count || 0,
  };

  // Success rate
  const approved = casesByStatus.find(s => s.status === 'APPROVED')?._count || 0;
  const rejected = casesByStatus.find(s => s.status === 'REJECTED')?._count || 0;
  const total = approved + rejected;

  return {
    submissionsOverTime,
    casesByType: casesByType.map(item => ({
      type: item.type,
      count: item._count,
    })),
    casesByStatus: casesByStatus.map(item => ({
      status: item.status,
      count: item._count,
    })),
    badgeProgress,
    earnedBadges: user?.badges || [],
    totalPoints: user?.totalPoints || 0,
    successRate: {
      approved,
      rejected,
      total,
      percentage: total > 0 ? Math.round((approved / total) * 100) : 0,
    },
  };
}

// APPROVER Analytics
export async function waGetApproverAnalytics(): Promise<ApproverAnalytics> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'APPROVER' && user?.role !== 'ADMIN') {
    throw new Error('Unauthorized - Approver access required');
  }

  const userId = session.user.id;

  // Cases reviewed over time
  const monthlyRange = getMonthlyDateRange(6);
  const reviewsOverTime = await Promise.all(
    monthlyRange.map(async ({ label, year, month }) => {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const approved = await prisma.waCaseStudy.count({
        where: {
          approverId: userId,
          approvedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const rejected = await prisma.waCaseStudy.count({
        where: {
          rejectedBy: userId,
          rejectedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      return { month: label, approved, rejected, total: approved + rejected };
    })
  );

  // Approval vs rejection rate
  const totalApproved = await prisma.waCaseStudy.count({
    where: { approverId: userId },
  });

  const totalRejected = await prisma.waCaseStudy.count({
    where: { rejectedBy: userId },
  });

  // Average review time (in days)
  const reviewedCases = await prisma.waCaseStudy.findMany({
    where: {
      OR: [
        { approverId: userId },
        { rejectedBy: userId },
      ],
      submittedAt: { not: null },
    },
    select: {
      submittedAt: true,
      approvedAt: true,
      rejectedAt: true,
    },
  });

  const reviewTimesByMonth = monthlyRange.map(({ label, year, month }) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const casesInMonth = reviewedCases.filter(c => {
      const reviewDate = c.approvedAt || c.rejectedAt;
      return reviewDate && reviewDate >= startDate && reviewDate <= endDate;
    });

    if (casesInMonth.length === 0) {
      return { month: label, avgDays: 0 };
    }

    const totalDays = casesInMonth.reduce((sum, c) => {
      const reviewDate = c.approvedAt || c.rejectedAt;
      if (c.submittedAt && reviewDate) {
        const days = Math.floor((reviewDate.getTime() - c.submittedAt.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }
      return sum;
    }, 0);

    return { month: label, avgDays: Math.round(totalDays / casesInMonth.length) };
  });

  // Cases by type reviewed
  const reviewedByType = await prisma.waCaseStudy.groupBy({
    by: ['type'],
    where: {
      OR: [
        { approverId: userId },
        { rejectedBy: userId },
      ],
    },
    _count: true,
  });

  // Pending cases count
  const pendingCases = await prisma.waCaseStudy.count({
    where: {
      status: 'SUBMITTED',
    },
  });

  return {
    reviewsOverTime,
    approvalRate: {
      approved: totalApproved,
      rejected: totalRejected,
      total: totalApproved + totalRejected,
      percentage: totalApproved + totalRejected > 0
        ? Math.round((totalApproved / (totalApproved + totalRejected)) * 100)
        : 0,
    },
    reviewTimesByMonth,
    reviewedByType: reviewedByType.map(item => ({
      type: item.type,
      count: item._count,
    })),
    pendingCases,
  };
}

// VIEWER Analytics
export async function waGetViewerAnalytics(): Promise<ViewerAnalytics> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Only approved cases for viewers
  const approvedCases = await prisma.waCaseStudy.findMany({
    where: {
      status: 'APPROVED',
    },
    select: {
      industry: true,
      location: true,
      waProduct: true,
      country: true,
    },
  });

  // Cases by industry
  const industryMap = new Map<string, number>();
  approvedCases.forEach(c => {
    industryMap.set(c.industry, (industryMap.get(c.industry) || 0) + 1);
  });

  const casesByIndustry = Array.from(industryMap.entries())
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Cases by region/country
  const regionMap = new Map<string, number>();
  approvedCases.forEach(c => {
    const region = c.country || c.location;
    if (region) {
      regionMap.set(region, (regionMap.get(region) || 0) + 1);
    }
  });

  const casesByRegion = Array.from(regionMap.entries())
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Most popular WA products
  const productMap = new Map<string, number>();
  approvedCases.forEach(c => {
    productMap.set(c.waProduct, (productMap.get(c.waProduct) || 0) + 1);
  });

  const popularProducts = Array.from(productMap.entries())
    .map(([product, count]) => ({ product, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Total stats
  const totalApprovedCases = approvedCases.length;
  const totalIndustries = industryMap.size;
  const totalRegions = regionMap.size;
  const totalProducts = productMap.size;

  return {
    casesByIndustry,
    casesByRegion,
    popularProducts,
    summary: {
      totalApprovedCases,
      totalIndustries,
      totalRegions,
      totalProducts,
    },
  };
}

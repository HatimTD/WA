'use server';

import { prisma } from '@/lib/prisma';
import { getBHAGTarget } from './system-config-actions';

/**
 * Get BHAG progress with deduplication logic
 * Deduplication: Count unique combinations of industry + location + component
 * Only count APPROVED case studies
 */
export async function getBHAGProgress() {
  try {
    // Get all approved case studies with deduplication fields
    const approvedCases = await prisma.caseStudy.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        industry: true,
        location: true,
        componentWorkpiece: true,
        type: true,
      },
    });

    // Create unique identifier for each case
    // Format: "industry|location|componentWorkpiece"
    const uniqueCases = new Set(
      approvedCases.map((cs) =>
        `${cs.industry.toLowerCase().trim()}|${cs.location.toLowerCase().trim()}|${cs.componentWorkpiece.toLowerCase().trim()}`
      )
    );

    const uniqueCount = uniqueCases.size;
    const totalCount = approvedCases.length;

    // Count by type (deduplicated)
    const byType = {
      APPLICATION: 0,
      TECH: 0,
      STAR: 0,
    };

    const uniqueByType = {
      APPLICATION: new Set<string>(),
      TECH: new Set<string>(),
      STAR: new Set<string>(),
    };

    approvedCases.forEach((cs) => {
      const uniqueKey = `${cs.industry.toLowerCase().trim()}|${cs.location.toLowerCase().trim()}|${cs.componentWorkpiece.toLowerCase().trim()}`;
      uniqueByType[cs.type].add(uniqueKey);
    });

    byType.APPLICATION = uniqueByType.APPLICATION.size;
    byType.TECH = uniqueByType.TECH.size;
    byType.STAR = uniqueByType.STAR.size;

    // BHAG target (read from system configuration)
    const target = await getBHAGTarget();
    const percentage = Math.min(100, Math.round((uniqueCount / target) * 100));

    return {
      success: true,
      bhag: {
        uniqueCount,
        totalCount,
        target,
        percentage,
        byType,
      },
    };
  } catch (error) {
    console.error('Error fetching BHAG progress:', error);
    return {
      success: false,
      error: 'Failed to fetch BHAG progress',
    };
  }
}

/**
 * Get regional breakdown of case studies
 */
export async function getRegionalBHAGProgress() {
  try {
    const approvedCases = await prisma.caseStudy.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        location: true,
        industry: true,
        componentWorkpiece: true,
      },
    });

    // Group by region/location
    const byRegion: Record<string, Set<string>> = {};

    approvedCases.forEach((cs) => {
      const region = cs.location;
      const uniqueKey = `${cs.industry.toLowerCase().trim()}|${cs.location.toLowerCase().trim()}|${cs.componentWorkpiece.toLowerCase().trim()}`;

      if (!byRegion[region]) {
        byRegion[region] = new Set();
      }
      byRegion[region].add(uniqueKey);
    });

    // Convert to array with counts
    const regionalData = Object.entries(byRegion)
      .map(([region, uniqueCases]) => ({
        region,
        uniqueCount: uniqueCases.size,
      }))
      .sort((a, b) => b.uniqueCount - a.uniqueCount);

    return {
      success: true,
      regionalData,
    };
  } catch (error) {
    console.error('Error fetching regional BHAG progress:', error);
    return {
      success: false,
      error: 'Failed to fetch regional progress',
    };
  }
}

/**
 * Get industry breakdown
 */
export async function getIndustryBHAGProgress() {
  try {
    const approvedCases = await prisma.caseStudy.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        industry: true,
        location: true,
        componentWorkpiece: true,
      },
    });

    // Group by industry
    const byIndustry: Record<string, Set<string>> = {};

    approvedCases.forEach((cs) => {
      const industry = cs.industry;
      const uniqueKey = `${cs.industry.toLowerCase().trim()}|${cs.location.toLowerCase().trim()}|${cs.componentWorkpiece.toLowerCase().trim()}`;

      if (!byIndustry[industry]) {
        byIndustry[industry] = new Set();
      }
      byIndustry[industry].add(uniqueKey);
    });

    // Convert to array with counts
    const industryData = Object.entries(byIndustry)
      .map(([industry, uniqueCases]) => ({
        industry,
        uniqueCount: uniqueCases.size,
      }))
      .sort((a, b) => b.uniqueCount - a.uniqueCount);

    return {
      success: true,
      industryData,
    };
  } catch (error) {
    console.error('Error fetching industry BHAG progress:', error);
    return {
      success: false,
      error: 'Failed to fetch industry progress',
    };
  }
}

/**
 * Get BHAG progress split by Qualifier Type (BRD 3.5)
 * NEW_CUSTOMER vs CROSS_SELL vs MAINTENANCE
 */
export async function getQualifierTypeBHAGProgress() {
  try {
    const approvedCases = await prisma.caseStudy.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        industry: true,
        location: true,
        componentWorkpiece: true,
        qualifierType: true,
        isTarget: true,
      },
    });

    // Group by qualifier type
    const byQualifierType = {
      NEW_CUSTOMER: new Set<string>(),
      CROSS_SELL: new Set<string>(),
      MAINTENANCE: new Set<string>(),
      UNQUALIFIED: new Set<string>(), // Cases without qualifierType
    };

    let targetCount = 0;

    approvedCases.forEach((cs) => {
      const uniqueKey = `${cs.industry.toLowerCase().trim()}|${cs.location.toLowerCase().trim()}|${cs.componentWorkpiece.toLowerCase().trim()}`;

      if (cs.isTarget) {
        targetCount++;
      }

      if (cs.qualifierType === 'NEW_CUSTOMER') {
        byQualifierType.NEW_CUSTOMER.add(uniqueKey);
      } else if (cs.qualifierType === 'CROSS_SELL') {
        byQualifierType.CROSS_SELL.add(uniqueKey);
      } else if (cs.qualifierType === 'MAINTENANCE') {
        byQualifierType.MAINTENANCE.add(uniqueKey);
      } else {
        byQualifierType.UNQUALIFIED.add(uniqueKey);
      }
    });

    const qualifierData = {
      newCustomer: {
        count: byQualifierType.NEW_CUSTOMER.size,
        label: 'New Customer',
        description: 'No purchase in 3 years - Counts toward target',
        countsTowardTarget: true,
      },
      crossSell: {
        count: byQualifierType.CROSS_SELL.size,
        label: 'Cross-Sell',
        description: 'Existing customer, new product - Counts toward target',
        countsTowardTarget: true,
      },
      maintenance: {
        count: byQualifierType.MAINTENANCE.size,
        label: 'Maintenance',
        description: 'Repeat of existing solution - Does NOT count toward target',
        countsTowardTarget: false,
      },
      unqualified: {
        count: byQualifierType.UNQUALIFIED.size,
        label: 'Unqualified',
        description: 'Not yet qualified through Challenge Qualifier',
        countsTowardTarget: false,
      },
      targetTotal: targetCount,
    };

    return {
      success: true,
      qualifierData,
    };
  } catch (error) {
    console.error('Error fetching qualifier type BHAG progress:', error);
    return {
      success: false,
      error: 'Failed to fetch qualifier type progress',
    };
  }
}

/**
 * Get BHAG progress split by Contributor's Region (BRD 3.5)
 * Groups by user.region instead of case study location
 */
export async function getContributorRegionBHAGProgress() {
  try {
    const approvedCases = await prisma.caseStudy.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        industry: true,
        location: true,
        componentWorkpiece: true,
        contributor: {
          select: {
            region: true,
          },
        },
      },
    });

    // Group by contributor's region
    const byContributorRegion: Record<string, Set<string>> = {};

    approvedCases.forEach((cs) => {
      const region = cs.contributor?.region || 'Unknown';
      const uniqueKey = `${cs.industry.toLowerCase().trim()}|${cs.location.toLowerCase().trim()}|${cs.componentWorkpiece.toLowerCase().trim()}`;

      if (!byContributorRegion[region]) {
        byContributorRegion[region] = new Set();
      }
      byContributorRegion[region].add(uniqueKey);
    });

    // Convert to array with counts
    const contributorRegionData = Object.entries(byContributorRegion)
      .map(([region, uniqueCases]) => ({
        region,
        uniqueCount: uniqueCases.size,
      }))
      .sort((a, b) => b.uniqueCount - a.uniqueCount);

    return {
      success: true,
      contributorRegionData,
    };
  } catch (error) {
    console.error('Error fetching contributor region BHAG progress:', error);
    return {
      success: false,
      error: 'Failed to fetch contributor region progress',
    };
  }
}

'use server';

import { prisma } from '@/lib/prisma';
import { waGetBHAGTarget } from './waSystemConfigActions';

/**
 * BHAG Deduplication Key Generator (BRD Section 5)
 *
 * A solved challenge is counted ONCE when Customer Name, Location,
 * Component, and WA Solution are unique. Duplicates are treated as updates.
 *
 * @param cs Case study with required fields
 * @returns Unique key string: "customerName|location|componentWorkpiece|waProduct"
 */
function waCreateUniqueKey(cs: {
  customerName: string;
  location: string;
  componentWorkpiece: string;
  waProduct: string;
}): string {
  return `${cs.customerName.toLowerCase().trim()}|${cs.location.toLowerCase().trim()}|${cs.componentWorkpiece.toLowerCase().trim()}|${cs.waProduct.toLowerCase().trim()}`;
}

/**
 * Get BHAG progress with deduplication logic
 *
 * BRD Section 5 - BHAG Counting Rule:
 * A solved challenge is counted ONCE when Customer Name, Location, Component,
 * and WA Solution are unique. Duplicates are treated as updates.
 *
 * Deduplication Key: customerName + location + componentWorkpiece + waProduct
 * Only count APPROVED case studies
 */
export async function waGetBhagProgress() {
  try {
    // Get all approved case studies with deduplication fields (BRD Section 5)
    const approvedCases = await prisma.caseStudy.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        customerName: true,
        location: true,
        componentWorkpiece: true,
        waProduct: true,
        type: true,
      },
    });

    // Create unique identifier for each case per BRD Section 5
    // Format: "customerName|location|componentWorkpiece|waProduct"
    const uniqueCases = new Set(approvedCases.map(waCreateUniqueKey));

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
      const uniqueKey = waCreateUniqueKey(cs);
      uniqueByType[cs.type].add(uniqueKey);
    });

    byType.APPLICATION = uniqueByType.APPLICATION.size;
    byType.TECH = uniqueByType.TECH.size;
    byType.STAR = uniqueByType.STAR.size;

    // BHAG target (read from system configuration)
    const target = await waGetBHAGTarget();
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
 * Uses BRD Section 5 deduplication logic
 */
export async function waGetRegionalBhagProgress() {
  try {
    const approvedCases = await prisma.caseStudy.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        customerName: true,
        location: true,
        componentWorkpiece: true,
        waProduct: true,
      },
    });

    // Group by region/location
    const byRegion: Record<string, Set<string>> = {};

    approvedCases.forEach((cs) => {
      const region = cs.location;
      const uniqueKey = waCreateUniqueKey(cs);

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
 * Uses BRD Section 5 deduplication logic
 */
export async function waGetIndustryBhagProgress() {
  try {
    const approvedCases = await prisma.caseStudy.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        customerName: true,
        industry: true,
        location: true,
        componentWorkpiece: true,
        waProduct: true,
      },
    });

    // Group by industry
    const byIndustry: Record<string, Set<string>> = {};

    approvedCases.forEach((cs) => {
      const industry = cs.industry;
      const uniqueKey = waCreateUniqueKey(cs);

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
 * Uses BRD Section 5 deduplication logic
 */
export async function waGetQualifierTypeBhagProgress() {
  try {
    const approvedCases = await prisma.caseStudy.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        customerName: true,
        location: true,
        componentWorkpiece: true,
        waProduct: true,
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
      const uniqueKey = waCreateUniqueKey(cs);

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
 * Uses BRD Section 5 deduplication logic
 */
export async function waGetContributorRegionBhagProgress() {
  try {
    const approvedCases = await prisma.caseStudy.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        customerName: true,
        location: true,
        componentWorkpiece: true,
        waProduct: true,
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
      const uniqueKey = waCreateUniqueKey(cs);

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

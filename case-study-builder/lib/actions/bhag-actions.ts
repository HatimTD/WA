'use server';

import { prisma } from '@/lib/prisma';

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

    // BHAG target (can be configured)
    const target = 1000;
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

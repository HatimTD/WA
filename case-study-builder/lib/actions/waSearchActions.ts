'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * BRD Section 5 - Search & Filtering
 * Database must be searchable by: Tags, Industry, Component, OEM, Wear Type,
 * WA Product, Country, Customer, Revenue, and Contributor
 */
type WaSearchFilters = {
  query?: string;
  type?: string;
  industry?: string;
  location?: string;
  status?: string;
  tags?: string[];
  // BRD Required Filters
  componentWorkpiece?: string;
  wearType?: string[];
  oem?: string; // competitorName field
  waProduct?: string;
  country?: string;
  contributorId?: string;
  minRevenue?: number;
  maxRevenue?: number;
};

export async function waSearchCaseStudies(filters: WaSearchFilters) {
  try {
    // Build the where clause dynamically based on filters
    const where: Prisma.WaCaseStudyWhereInput = {};

    // Status filter (default to APPROVED)
    if (filters.status) {
      where.status = filters.status as any;
    }

    // Type filter
    if (filters.type) {
      where.type = filters.type as any;
    }

    // Industry filter (case-insensitive contains)
    if (filters.industry) {
      where.industry = {
        contains: filters.industry,
        mode: 'insensitive',
      };
    }

    // Location filter (case-insensitive contains)
    if (filters.location) {
      where.location = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    // Tags filter (case-insensitive array contains)
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    // BRD: Component/Workpiece filter
    if (filters.componentWorkpiece) {
      where.componentWorkpiece = {
        contains: filters.componentWorkpiece,
        mode: 'insensitive',
      };
    }

    // BRD: Wear Type filter (array field - hasSome for multi-select)
    // Uppercase values to match database storage format
    if (filters.wearType && filters.wearType.length > 0) {
      where.wearType = {
        hasSome: filters.wearType.map(wt => wt.toUpperCase()),
      };
    }

    // BRD: OEM filter (competitorName field)
    if (filters.oem) {
      where.competitorName = {
        contains: filters.oem,
        mode: 'insensitive',
      };
    }

    // BRD: WA Product filter
    if (filters.waProduct) {
      where.waProduct = {
        contains: filters.waProduct,
        mode: 'insensitive',
      };
    }

    // BRD: Country filter (separate from location)
    if (filters.country) {
      where.country = {
        contains: filters.country,
        mode: 'insensitive',
      };
    }

    // BRD: Contributor filter
    if (filters.contributorId) {
      where.contributorId = filters.contributorId;
    }

    // BRD: Revenue filter (using annualPotentialRevenue)
    if (filters.minRevenue !== undefined || filters.maxRevenue !== undefined) {
      where.annualPotentialRevenue = {};
      if (filters.minRevenue !== undefined) {
        where.annualPotentialRevenue.gte = filters.minRevenue;
      }
      if (filters.maxRevenue !== undefined) {
        where.annualPotentialRevenue.lte = filters.maxRevenue;
      }
    }

    // Text search across multiple fields
    if (filters.query) {
      where.OR = [
        {
          customerName: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
        {
          problemDescription: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
        {
          previousSolution: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
        {
          waSolution: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
        {
          waProduct: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
        {
          componentWorkpiece: {
            contains: filters.query,
            mode: 'insensitive',
          },
        },
        {
          tags: {
            has: filters.query.toLowerCase(),
          },
        },
      ];
    }

    // Perform the search
    const caseStudies = await prisma.waCaseStudy.findMany({
      where,
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
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to 100 results
    });

    // Convert Decimal fields to numbers for client components
    const serializedCaseStudies = caseStudies.map(cs => ({
      ...cs,
      solutionValueRevenue: cs.solutionValueRevenue ? Number(cs.solutionValueRevenue) : null,
      annualPotentialRevenue: cs.annualPotentialRevenue ? Number(cs.annualPotentialRevenue) : null,
      customerSavingsAmount: cs.customerSavingsAmount ? Number(cs.customerSavingsAmount) : null,
    }));

    return {
      success: true,
      caseStudies: serializedCaseStudies,
      count: serializedCaseStudies.length,
    };
  } catch (error) {
    console.error('Error searching case studies:', error);
    return {
      success: false,
      error: 'Failed to search case studies',
      caseStudies: [],
      count: 0,
    };
  }
}

// Fallback wear types if master data not available
const FALLBACK_WEAR_TYPES = ['ABRASION', 'IMPACT', 'CORROSION', 'TEMPERATURE', 'COMBINATION'];

/**
 * Get unique values for filter dropdowns
 * BRD Section 5 - Provides all searchable field options
 */
export async function waGetSearchFilterOptions() {
  try {
    // Get distinct values from approved cases and master data wear types
    const [caseStudies, masterWearTypes] = await Promise.all([
      prisma.waCaseStudy.findMany({
        where: { status: 'APPROVED' },
        select: {
          industry: true,
          location: true,
          componentWorkpiece: true,
          wearType: true,
          competitorName: true,
          waProduct: true,
          country: true,
          contributorId: true,
          contributor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      // Fetch wear types from master data (admin-managed)
      prisma.waMasterList.findMany({
        where: {
          isActive: true,
          listKey: { keyName: 'WearType' },
        },
        orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
        select: {
          value: true,
        },
      }),
    ]);

    // Extract unique values for each filter
    const industries = [...new Set(caseStudies.map((cs) => cs.industry))].filter(Boolean).sort();
    const locations = [...new Set(caseStudies.map((cs) => cs.location))].filter(Boolean).sort();
    const components = [...new Set(caseStudies.map((cs) => cs.componentWorkpiece))].filter(Boolean).sort();
    const waProducts = [...new Set(caseStudies.map((cs) => cs.waProduct))].filter(Boolean).sort();
    const countries = [...new Set(caseStudies.map((cs) => cs.country))].filter((c): c is string => c !== null).sort();
    const oems = [...new Set(caseStudies.map((cs) => cs.competitorName))].filter((c): c is string => c !== null).sort();

    // Use master data wear types, fallback to hardcoded if none found
    const wearTypes = masterWearTypes.length > 0
      ? masterWearTypes.map(wt => wt.value)
      : FALLBACK_WEAR_TYPES;

    // Get unique contributors with their names
    const contributorMap = new Map<string, string>();
    caseStudies.forEach((cs) => {
      if (cs.contributor) {
        contributorMap.set(cs.contributorId, cs.contributor.name || cs.contributorId);
      }
    });
    const contributors = Array.from(contributorMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return {
      success: true,
      industries,
      locations,
      components,
      wearTypes,
      oems,
      waProducts,
      countries,
      contributors,
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return {
      success: false,
      industries: [],
      locations: [],
      components: [],
      wearTypes: [],
      oems: [],
      waProducts: [],
      countries: [],
      contributors: [],
    };
  }
}

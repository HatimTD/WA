'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type SearchFilters = {
  query?: string;
  type?: string;
  industry?: string;
  location?: string;
  status?: string;
  tags?: string[];
};

export async function searchCaseStudies(filters: SearchFilters) {
  try {
    // Build the where clause dynamically based on filters
    const where: Prisma.CaseStudyWhereInput = {};

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
    const caseStudies = await prisma.caseStudy.findMany({
      where,
      include: {
        contributor: {
          select: {
            id: true,
            name: true,
            email: true,
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

/**
 * Get unique values for filter dropdowns
 */
export async function getSearchFilterOptions() {
  try {
    // Get distinct industries and locations from approved cases
    const caseStudies = await prisma.caseStudy.findMany({
      where: { status: 'APPROVED' },
      select: {
        industry: true,
        location: true,
      },
    });

    const industries = [...new Set(caseStudies.map((cs) => cs.industry))].sort();
    const locations = [...new Set(caseStudies.map((cs) => cs.location))].sort();

    return {
      success: true,
      industries,
      locations,
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return {
      success: false,
      industries: [],
      locations: [],
    };
  }
}

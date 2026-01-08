import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ cases: [], results: [], suggestions: [] });
    }

    // Search case studies - only approved ones
    const cases = await prisma.waCaseStudy.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            customerName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            industry: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            componentWorkpiece: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            waProduct: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            location: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            oem: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        customerName: true,
        industry: true,
        location: true,
        country: true,
        componentWorkpiece: true,
        workType: true,
        wearType: true,
        wearSeverities: true,
        wearTypeOthers: true,
        type: true,
        status: true,
        waProduct: true,
        waProductDiameter: true,
        problemDescription: true,
        previousSolution: true,
        baseMetal: true,
        generalDimensions: true,
        waSolution: true,
        technicalAdvantages: true,
        expectedServiceLife: true,
        previousServiceLife: true,
        solutionValueRevenue: true,
        annualPotentialRevenue: true,
        customerSavingsAmount: true,
        jobType: true,
        jobTypeOther: true,
        oem: true,
        jobDurationHours: true,
        jobDurationDays: true,
        jobDurationWeeks: true,
        approvedAt: true,
        currency: true,
        // Include cost calculator to get currency
        costCalculator: {
          select: {
            currency: true,
          },
        },
      },
      take: 20,
      orderBy: {
        approvedAt: 'desc',
      },
    });

    // Generate autocomplete suggestions
    const suggestions: string[] = [];

    // Get unique suggestions from matching fields
    const [titles, customerNames, industries, products] = await Promise.all([
      prisma.waCaseStudy.findMany({
        where: {
          status: 'APPROVED',
          title: { contains: query, mode: 'insensitive' },
        },
        select: { title: true },
        distinct: ['title'],
        take: 3,
      }),
      prisma.waCaseStudy.findMany({
        where: {
          status: 'APPROVED',
          customerName: { contains: query, mode: 'insensitive' },
        },
        select: { customerName: true },
        distinct: ['customerName'],
        take: 3,
      }),
      prisma.waCaseStudy.findMany({
        where: {
          status: 'APPROVED',
          industry: { contains: query, mode: 'insensitive' },
        },
        select: { industry: true },
        distinct: ['industry'],
        take: 3,
      }),
      prisma.waCaseStudy.findMany({
        where: {
          status: 'APPROVED',
          waProduct: { contains: query, mode: 'insensitive' },
        },
        select: { waProduct: true },
        distinct: ['waProduct'],
        take: 3,
      }),
    ]);

    suggestions.push(...titles.filter(t => t.title).map((t) => t.title!));
    suggestions.push(...customerNames.map((c) => c.customerName));
    suggestions.push(...industries.map((i) => i.industry));
    suggestions.push(...products.map((p) => p.waProduct));

    // Transform cases to flatten currency from costCalculator
    const transformedCases = cases.map(caseStudy => {
      const { costCalculator, ...rest } = caseStudy;
      return {
        ...rest,
        // Use costCalculator currency if available, otherwise use case study currency, default to EUR
        currency: costCalculator?.currency || rest.currency || 'EUR',
      };
    });

    return NextResponse.json({
      cases: transformedCases,
      results: transformedCases, // Keep for backwards compatibility
      suggestions: [...new Set(suggestions)].slice(0, 5), // Remove duplicates and limit to 5
    });
  } catch (error) {
    console.error('[API] Case study search error:', error);
    return NextResponse.json(
      { error: 'Internal server error', cases: [], results: [], suggestions: [] },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ cases: [] });
    }

    // Search case studies - only approved ones for comparison
    const cases = await prisma.caseStudy.findMany({
      where: {
        status: 'APPROVED',
        OR: [
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
        ],
      },
      select: {
        id: true,
        customerName: true,
        industry: true,
        location: true,
        country: true,
        componentWorkpiece: true,
        workType: true,
        wearType: true,
        problemDescription: true,
        waSolution: true,
        waProduct: true,
        technicalAdvantages: true,
        expectedServiceLife: true,
        previousServiceLife: true,
        solutionValueRevenue: true,
        annualPotentialRevenue: true,
        customerSavingsAmount: true,
        type: true,
        status: true,
      },
      take: 20,
      orderBy: {
        approvedAt: 'desc',
      },
    });

    return NextResponse.json({ cases });
  } catch (error) {
    console.error('[API] Case study search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

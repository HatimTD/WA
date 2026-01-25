import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const caseStudy = await prisma.waCaseStudy.findUnique({
      where: { id },
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
        problemDescription: true,
        previousSolution: true,
        baseMetal: true,
        generalDimensions: true,
        waSolution: true,
        waProduct: true,
        waProductDiameter: true,
        technicalAdvantages: true,
        expectedServiceLife: true,
        previousServiceLife: true,
        solutionValueRevenue: true,
        annualPotentialRevenue: true,
        customerSavingsAmount: true,
        revenueCurrency: true,
        currency: true,
        type: true,
        status: true,
        jobType: true,
        jobTypeOther: true,
        oem: true,
        jobDurationHours: true,
        jobDurationDays: true,
        jobDurationWeeks: true,
        approvedAt: true,
        // Include cost calculator to get currency
        costCalculator: {
          select: {
            currency: true,
          },
        },
        // Include WPS to check if filled (for STAR bonus point)
        wps: {
          select: {
            weldingProcess: true,
          },
        },
      },
    });

    if (!caseStudy) {
      return NextResponse.json({ error: 'Case study not found' }, { status: 404 });
    }

    // Transform to flatten currency from costCalculator or revenueCurrency
    const { costCalculator, wps, ...rest } = caseStudy;
    const transformedCase = {
      ...rest,
      // Use costCalculator currency (STAR) if available, otherwise use revenueCurrency (APPLICATION), default to EUR
      currency: costCalculator?.currency || rest.revenueCurrency || rest.currency || 'EUR',
      // Flag to indicate if WPS is filled (for STAR +4 bonus point display)
      hasWps: !!wps?.weldingProcess,
    };

    return NextResponse.json(transformedCase);
  } catch (error) {
    console.error('[API] Error fetching case study:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

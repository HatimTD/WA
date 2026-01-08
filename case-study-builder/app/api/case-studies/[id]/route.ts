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
        waSolution: true,
        waProduct: true,
        waProductDiameter: true,
        technicalAdvantages: true,
        expectedServiceLife: true,
        previousServiceLife: true,
        solutionValueRevenue: true,
        annualPotentialRevenue: true,
        customerSavingsAmount: true,
        type: true,
        status: true,
        jobType: true,
        jobTypeOther: true,
        oem: true,
        jobDurationHours: true,
        jobDurationDays: true,
        jobDurationWeeks: true,
      },
    });

    if (!caseStudy) {
      return NextResponse.json({ error: 'Case study not found' }, { status: 404 });
    }

    return NextResponse.json(caseStudy);
  } catch (error) {
    console.error('[API] Error fetching case study:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

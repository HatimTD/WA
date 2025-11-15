import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        region: true,
        totalPoints: true,
        createdAt: true,
      },
    });

    // Fetch all case studies created by this user
    const caseStudies = await prisma.caseStudy.findMany({
      where: { contributorId: session.user.id },
      select: {
        id: true,
        customerName: true,
        country: true,
        industry: true,
        componentWorkpiece: true,
        problemDescription: true,
        waSolution: true,
        waProduct: true,
        technicalAdvantages: true,
        type: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
        // Financial impact data
        solutionValueRevenue: true,
        annualPotentialRevenue: true,
        customerSavingsAmount: true,
        // WPS data
        wps: {
          select: {
            id: true,
            baseMetalType: true,
            baseMetalGrade: true,
            baseMetalThickness: true,
            weldingProcess: true,
            waProductName: true,
            waProductDiameter: true,
            shieldingGas: true,
            currentType: true,
            intensity: true,
            voltage: true,
            travelSpeed: true,
            heatInput: true,
            preheatTemperature: true,
            interpassTemperature: true,
            postheatTemperature: true,
            pwhtDetails: true,
            hardness: true,
            additionalNotes: true,
          },
        },
        // Cost calculator data
        costCalculator: {
          select: {
            id: true,
            materialCostBefore: true,
            materialCostAfter: true,
            laborCostBefore: true,
            laborCostAfter: true,
            downtimeCostBefore: true,
            downtimeCostAfter: true,
            maintenanceFrequencyBefore: true,
            maintenanceFrequencyAfter: true,
            totalCostBefore: true,
            totalCostAfter: true,
            annualSavings: true,
            savingsPercentage: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert Decimal fields to numbers for JSON serialization
    const serializedCases = caseStudies.map((c) => ({
      ...c,
      solutionValueRevenue: c.solutionValueRevenue ? Number(c.solutionValueRevenue) : null,
      annualPotentialRevenue: c.annualPotentialRevenue ? Number(c.annualPotentialRevenue) : null,
      customerSavingsAmount: c.customerSavingsAmount ? Number(c.customerSavingsAmount) : null,
      costCalculator: c.costCalculator ? {
        ...c.costCalculator,
        materialCostBefore: Number(c.costCalculator.materialCostBefore),
        materialCostAfter: Number(c.costCalculator.materialCostAfter),
        laborCostBefore: Number(c.costCalculator.laborCostBefore),
        laborCostAfter: Number(c.costCalculator.laborCostAfter),
        downtimeCostBefore: Number(c.costCalculator.downtimeCostBefore),
        downtimeCostAfter: Number(c.costCalculator.downtimeCostAfter),
        totalCostBefore: Number(c.costCalculator.totalCostBefore),
        totalCostAfter: Number(c.costCalculator.totalCostAfter),
        annualSavings: Number(c.costCalculator.annualSavings),
      } : null,
      wps: c.wps ? c.wps : null,
    }));

    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      user: user,
      statistics: {
        totalCaseStudies: caseStudies.length,
        approvedCases: caseStudies.filter((c) => c.status === 'APPROVED').length,
        submittedCases: caseStudies.filter((c) => c.status === 'SUBMITTED').length,
        rejectedCases: caseStudies.filter((c) => c.status === 'REJECTED').length,
        draftCases: caseStudies.filter((c) => c.status === 'DRAFT').length,
        publishedCases: caseStudies.filter((c) => c.status === 'PUBLISHED').length,
        totalPoints: user?.totalPoints || 0,
      },
      caseStudies: serializedCases,
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('[API] Export data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

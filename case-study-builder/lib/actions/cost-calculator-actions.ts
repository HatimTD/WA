'use server';

import { prisma } from '@/lib/prisma';

type CostCalculationData = {
  caseStudyId: string;
  materialCostBefore: number;
  materialCostAfter: number;
  laborCostBefore: number;
  laborCostAfter: number;
  downtimeCostBefore: number;
  downtimeCostAfter: number;
  maintenanceFrequencyBefore: number;
  maintenanceFrequencyAfter: number;
  totalCostBefore: number;
  totalCostAfter: number;
  annualSavings: number;
  savingsPercentage: number;
};

export async function saveCostCalculation(data: CostCalculationData) {
  console.log('saveCostCalculation called with data:', {
    caseStudyId: data.caseStudyId,
    materialCostBefore: data.materialCostBefore,
    totalCostBefore: data.totalCostBefore,
    annualSavings: data.annualSavings,
  });

  try {
    // Check if calculation already exists
    const existing = await prisma.costCalculator.findUnique({
      where: { caseStudyId: data.caseStudyId },
    });

    console.log('Existing calculation:', existing ? 'Found' : 'Not found');

    let calculation;

    if (existing) {
      // Update existing calculation
      calculation = await prisma.costCalculator.update({
        where: { caseStudyId: data.caseStudyId },
        data: {
          materialCostBefore: data.materialCostBefore,
          materialCostAfter: data.materialCostAfter,
          laborCostBefore: data.laborCostBefore,
          laborCostAfter: data.laborCostAfter,
          downtimeCostBefore: data.downtimeCostBefore,
          downtimeCostAfter: data.downtimeCostAfter,
          maintenanceFrequencyBefore: data.maintenanceFrequencyBefore,
          maintenanceFrequencyAfter: data.maintenanceFrequencyAfter,
          totalCostBefore: data.totalCostBefore,
          totalCostAfter: data.totalCostAfter,
          annualSavings: data.annualSavings,
          savingsPercentage: data.savingsPercentage,
        },
      });
      console.log('Calculation updated successfully');
    } else {
      // Create new calculation
      calculation = await prisma.costCalculator.create({
        data: {
          caseStudyId: data.caseStudyId,
          materialCostBefore: data.materialCostBefore,
          materialCostAfter: data.materialCostAfter,
          laborCostBefore: data.laborCostBefore,
          laborCostAfter: data.laborCostAfter,
          downtimeCostBefore: data.downtimeCostBefore,
          downtimeCostAfter: data.downtimeCostAfter,
          maintenanceFrequencyBefore: data.maintenanceFrequencyBefore,
          maintenanceFrequencyAfter: data.maintenanceFrequencyAfter,
          totalCostBefore: data.totalCostBefore,
          totalCostAfter: data.totalCostAfter,
          annualSavings: data.annualSavings,
          savingsPercentage: data.savingsPercentage,
        },
      });
      console.log('Calculation created successfully');
    }

    return {
      success: true,
      calculation,
    };
  } catch (error) {
    console.error('Error saving cost calculation:', error);
    return {
      success: false,
      error: 'Failed to save cost calculation',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getCostCalculation(caseStudyId: string) {
  try {
    const calculation = await prisma.costCalculator.findUnique({
      where: { caseStudyId },
    });

    return {
      success: true,
      calculation,
    };
  } catch (error) {
    console.error('Error fetching cost calculation:', error);
    return {
      success: false,
      error: 'Failed to fetch cost calculation',
      calculation: null,
    };
  }
}

/**
 * Get aggregate cost savings statistics
 */
export async function getCostSavingsStats() {
  try {
    const calculations = await prisma.costCalculator.findMany({
      include: {
        caseStudy: {
          select: {
            status: true,
            industry: true,
            location: true,
          },
        },
      },
    });

    // Filter only approved case studies
    const approvedCalculations = calculations.filter(
      (calc) => calc.caseStudy.status === 'APPROVED'
    );

    const totalSavings = approvedCalculations.reduce(
      (sum, calc) => sum + calc.annualSavings,
      0
    );

    const averageSavings = approvedCalculations.length > 0
      ? totalSavings / approvedCalculations.length
      : 0;

    const averageSavingsPercentage = approvedCalculations.length > 0
      ? approvedCalculations.reduce((sum, calc) => sum + calc.savingsPercentage, 0) / approvedCalculations.length
      : 0;

    // Group by industry
    const byIndustry: Record<string, { count: number; totalSavings: number }> = {};

    approvedCalculations.forEach((calc) => {
      const industry = calc.caseStudy.industry;
      if (!byIndustry[industry]) {
        byIndustry[industry] = { count: 0, totalSavings: 0 };
      }
      byIndustry[industry].count++;
      byIndustry[industry].totalSavings += calc.annualSavings;
    });

    const industryStats = Object.entries(byIndustry)
      .map(([industry, stats]) => ({
        industry,
        count: stats.count,
        totalSavings: stats.totalSavings,
        averageSavings: stats.totalSavings / stats.count,
      }))
      .sort((a, b) => b.totalSavings - a.totalSavings);

    return {
      success: true,
      stats: {
        totalCalculations: approvedCalculations.length,
        totalSavings,
        averageSavings,
        averageSavingsPercentage,
        industryStats,
      },
    };
  } catch (error) {
    console.error('Error fetching cost savings stats:', error);
    return {
      success: false,
      error: 'Failed to fetch cost savings statistics',
    };
  }
}

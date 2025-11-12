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
      where: { createdById: session.user.id },
      select: {
        id: true,
        customerName: true,
        country: true,
        industry: true,
        application: true,
        challenge: true,
        solution: true,
        results: true,
        lessonsLearned: true,
        type: true,
        status: true,
        statusMessage: true,
        points: true,
        isUnique: true,
        createdAt: true,
        updatedAt: true,
        // Financial impact data
        solutionValueRevenue: true,
        annualPotentialRevenue: true,
        customerSavingsAmount: true,
        customerSavingsUnit: true,
        // WPS data
        wpsData: {
          select: {
            wpsNumber: true,
            revision: true,
            dateQualified: true,
            baseMetalGrade: true,
            baseMetalThickness: true,
            weldingProcess: true,
            shieldingGas: true,
            polarity: true,
            current: true,
            voltage: true,
            travelSpeed: true,
            heatInput: true,
            preheating: true,
            interpassTemperature: true,
            postWeldHeatTreatment: true,
            fillerMetalSpecification: true,
            fillerMetalDiameter: true,
            wireExtension: true,
            jointDesign: true,
            notes: true,
          },
        },
        // Cost calculator data
        costCalculator: {
          select: {
            customerName: true,
            projectName: true,
            // Base metal costs
            baseMetal1Type: true,
            baseMetal1CostPerUnit: true,
            baseMetal1Quantity: true,
            baseMetal2Type: true,
            baseMetal2CostPerUnit: true,
            baseMetal2Quantity: true,
            // Consumable costs
            wireType: true,
            wireCostPerKg: true,
            wireQuantity: true,
            gasType: true,
            gasCostPerCubicMeter: true,
            gasQuantity: true,
            fluxType: true,
            fluxCostPerKg: true,
            fluxQuantity: true,
            // Labor costs
            weldersCount: true,
            hourlyRate: true,
            hoursWorked: true,
            // Equipment costs
            equipmentType: true,
            equipmentCostPerHour: true,
            equipmentHours: true,
            // Other costs
            energyCostPerKwh: true,
            energyConsumption: true,
            maintenanceCost: true,
            overheadCost: true,
            // Calculated totals
            totalCost: true,
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
        baseMetal1CostPerUnit: c.costCalculator.baseMetal1CostPerUnit ? Number(c.costCalculator.baseMetal1CostPerUnit) : null,
        baseMetal1Quantity: c.costCalculator.baseMetal1Quantity ? Number(c.costCalculator.baseMetal1Quantity) : null,
        baseMetal2CostPerUnit: c.costCalculator.baseMetal2CostPerUnit ? Number(c.costCalculator.baseMetal2CostPerUnit) : null,
        baseMetal2Quantity: c.costCalculator.baseMetal2Quantity ? Number(c.costCalculator.baseMetal2Quantity) : null,
        wireCostPerKg: c.costCalculator.wireCostPerKg ? Number(c.costCalculator.wireCostPerKg) : null,
        wireQuantity: c.costCalculator.wireQuantity ? Number(c.costCalculator.wireQuantity) : null,
        gasCostPerCubicMeter: c.costCalculator.gasCostPerCubicMeter ? Number(c.costCalculator.gasCostPerCubicMeter) : null,
        gasQuantity: c.costCalculator.gasQuantity ? Number(c.costCalculator.gasQuantity) : null,
        fluxCostPerKg: c.costCalculator.fluxCostPerKg ? Number(c.costCalculator.fluxCostPerKg) : null,
        fluxQuantity: c.costCalculator.fluxQuantity ? Number(c.costCalculator.fluxQuantity) : null,
        hourlyRate: c.costCalculator.hourlyRate ? Number(c.costCalculator.hourlyRate) : null,
        hoursWorked: c.costCalculator.hoursWorked ? Number(c.costCalculator.hoursWorked) : null,
        equipmentCostPerHour: c.costCalculator.equipmentCostPerHour ? Number(c.costCalculator.equipmentCostPerHour) : null,
        equipmentHours: c.costCalculator.equipmentHours ? Number(c.costCalculator.equipmentHours) : null,
        energyCostPerKwh: c.costCalculator.energyCostPerKwh ? Number(c.costCalculator.energyCostPerKwh) : null,
        energyConsumption: c.costCalculator.energyConsumption ? Number(c.costCalculator.energyConsumption) : null,
        maintenanceCost: c.costCalculator.maintenanceCost ? Number(c.costCalculator.maintenanceCost) : null,
        overheadCost: c.costCalculator.overheadCost ? Number(c.costCalculator.overheadCost) : null,
        totalCost: c.costCalculator.totalCost ? Number(c.costCalculator.totalCost) : null,
      } : null,
      wpsData: c.wpsData ? {
        ...c.wpsData,
        baseMetalThickness: c.wpsData.baseMetalThickness ? Number(c.wpsData.baseMetalThickness) : null,
        current: c.wpsData.current ? Number(c.wpsData.current) : null,
        voltage: c.wpsData.voltage ? Number(c.wpsData.voltage) : null,
        travelSpeed: c.wpsData.travelSpeed ? Number(c.wpsData.travelSpeed) : null,
        heatInput: c.wpsData.heatInput ? Number(c.wpsData.heatInput) : null,
        preheating: c.wpsData.preheating ? Number(c.wpsData.preheating) : null,
        interpassTemperature: c.wpsData.interpassTemperature ? Number(c.wpsData.interpassTemperature) : null,
        fillerMetalDiameter: c.wpsData.fillerMetalDiameter ? Number(c.wpsData.fillerMetalDiameter) : null,
        wireExtension: c.wpsData.wireExtension ? Number(c.wpsData.wireExtension) : null,
      } : null,
    }));

    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      user: user,
      statistics: {
        totalCaseStudies: caseStudies.length,
        approvedCases: caseStudies.filter((c) => c.status === 'APPROVED').length,
        pendingCases: caseStudies.filter((c) => c.status === 'PENDING').length,
        rejectedCases: caseStudies.filter((c) => c.status === 'REJECTED').length,
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

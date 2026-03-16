import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, wps } = await request.json();

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Missing case study data' },
        { status: 400 }
      );
    }

    // Convert string numbers to Decimal
    const solutionValue = data.solutionValueRevenue
      ? parseFloat(data.solutionValueRevenue)
      : null;
    const annualPotential = data.annualPotentialRevenue
      ? parseFloat(data.annualPotentialRevenue)
      : null;
    const customerSavings = data.customerSavingsAmount
      ? parseFloat(data.customerSavingsAmount)
      : null;

    // Create the case study
    const caseStudy = await prisma.waCaseStudy.create({
      data: {
        type: data.type,
        status: data.status || 'DRAFT',
        contributorId: session.user.id,
        customerName: data.customerName,
        industry: data.industry,
        location: data.location,
        country: data.country || null,
        componentWorkpiece: data.componentWorkpiece,
        workType: data.workType,
        wearType: data.wearType as any,
        baseMetal: data.baseMetal || null,
        generalDimensions: data.generalDimensions || null,
        oem: data.oem || null,
        problemDescription: data.problemDescription,
        previousSolution: data.previousSolution || null,
        previousServiceLife: data.previousServiceLife || null,
        competitorName: data.competitorName || null,
        waSolution: data.waSolution,
        waProduct: data.waProduct,
        technicalAdvantages: data.technicalAdvantages || null,
        expectedServiceLife: data.expectedServiceLife || null,
        solutionValueRevenue: solutionValue,
        annualPotentialRevenue: annualPotential,
        customerSavingsAmount: customerSavings,
        images: data.images || [],
        supportingDocs: data.supportingDocs || [],
        tags: data.tags || [],
        submittedAt: data.status === 'SUBMITTED' ? new Date() : null,
      },
    });

    // If WPS data is provided (for TECH/STAR cases), create the WPS record
    if (wps && wps.waProductName && wps.weldingProcess) {
      await prisma.waWeldingProcedure.create({
        data: {
          caseStudyId: caseStudy.id,
          waProductName: wps.waProductName,
          weldingProcess: wps.weldingProcess,
          baseMetalType: wps.baseMetalType || null,
          baseMetalGrade: wps.baseMetalGrade || null,
          baseMetalThickness: wps.baseMetalThickness || null,
          surfacePreparation: wps.surfacePreparation || null,
          waProductDiameter: wps.waProductDiameter || null,
          shieldingGas: wps.shieldingGas || null,
          shieldingFlowRate: wps.shieldingFlowRate || null,
          flux: wps.flux || null,
          standardDesignation: wps.standardDesignation || null,
          currentType: wps.currentType || null,
          currentModeSynergy: wps.currentModeSynergy || null,
          wireFeedSpeed: wps.wireFeedSpeed || null,
          intensity: wps.intensity || null,
          voltage: wps.voltage || null,
          heatInput: wps.heatInput || null,
          weldingPosition: wps.weldingPosition || null,
          torchAngle: wps.torchAngle || null,
          stickOut: wps.stickOut || null,
          travelSpeed: wps.travelSpeed || null,
          oscillationWidth: wps.oscillationWidth || null,
          oscillationSpeed: wps.oscillationSpeed || null,
          oscillationStepOver: wps.oscillationStepOver || null,
          oscillationTempo: wps.oscillationTempo || null,
          preheatTemperature: wps.preheatTemperature || null,
          interpassTemperature: wps.interpassTemperature || null,
          postheatTemperature: wps.postheatTemperature || null,
          pwhtDetails: wps.pwhtDetails || null,
          layerNumbers: wps.layerNumbers ? parseInt(wps.layerNumbers) : null,
          hardness: wps.hardness || null,
          defectsObserved: wps.defectsObserved || null,
          additionalNotes: wps.additionalNotes || null,
        },
      });
    }

    logger.audit('CASE_CREATED_OFFLINE_SYNC', session.user.id, caseStudy.id, {
      type: data.type,
      status: data.status || 'DRAFT',
      offlineSync: true,
    });

    return NextResponse.json({
      success: true,
      id: caseStudy.id,
    });
  } catch (error: any) {
    console.error('[OfflineSync] Case study sync failed:', error);

    // Check for unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'A case study with this combination already exists.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync case study',
      },
      { status: 500 }
    );
  }
}

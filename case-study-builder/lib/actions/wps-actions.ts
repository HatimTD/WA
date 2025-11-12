'use server';

import { prisma } from '@/lib/prisma';

export type WPSFormData = {
  caseStudyId: string;
  // Base Metal
  baseMetalType?: string;
  baseMetalGrade?: string;
  baseMetalThickness?: string;
  surfacePreparation?: string;
  // WA Product
  waProductName: string;
  waProductDiameter?: string;
  shieldingGas?: string;
  shieldingFlowRate?: string;
  flux?: string;
  standardDesignation?: string;
  // Welding Parameters
  weldingProcess: string;
  currentType?: string;
  currentModeSynergy?: string;
  wireFeedSpeed?: string;
  intensity?: string;
  voltage?: string;
  heatInput?: string;
  weldingPosition?: string;
  torchAngle?: string;
  stickOut?: string;
  travelSpeed?: string;
  // Oscillation
  oscillationWidth?: string;
  oscillationSpeed?: string;
  oscillationStepOver?: string;
  oscillationTempo?: string;
  // Temperature
  preheatTemperature?: string;
  interpassTemperature?: string;
  postheatTemperature?: string;
  pwhtDetails?: string;
  // Results
  layerNumbers?: number;
  hardness?: string;
  defectsObserved?: string;
  additionalNotes?: string;
};

export async function saveWeldingProcedure(data: WPSFormData) {
  try {
    console.log('[WPS Actions] Saving welding procedure:', data);

    const { caseStudyId, ...wpsData } = data;

    // Check if WPS already exists
    const existingWPS = await prisma.weldingProcedure.findUnique({
      where: { caseStudyId },
    });

    let wps;
    if (existingWPS) {
      // Update existing WPS
      wps = await prisma.weldingProcedure.update({
        where: { caseStudyId },
        data: wpsData,
      });
      console.log('[WPS Actions] WPS updated successfully');
    } else {
      // Create new WPS
      wps = await prisma.weldingProcedure.create({
        data: {
          caseStudyId,
          ...wpsData,
        },
      });
      console.log('[WPS Actions] WPS created successfully');
    }

    return { success: true, wps };
  } catch (error) {
    console.error('[WPS Actions] Error saving welding procedure:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save welding procedure',
    };
  }
}

export async function getWeldingProcedure(caseStudyId: string) {
  try {
    console.log('[WPS Actions] Fetching welding procedure for case study:', caseStudyId);

    const wps = await prisma.weldingProcedure.findUnique({
      where: { caseStudyId },
    });

    if (!wps) {
      console.log('[WPS Actions] No welding procedure found');
      return { success: true, wps: null };
    }

    console.log('[WPS Actions] WPS found');
    return { success: true, wps };
  } catch (error) {
    console.error('[WPS Actions] Error fetching welding procedure:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch welding procedure',
      wps: null,
    };
  }
}

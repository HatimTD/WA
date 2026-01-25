'use server';

import { prisma } from '@/lib/prisma';

// WPS Layer interface (matches step-wps.tsx WpsLayer)
export type WpsLayer = {
  id: string;
  // WA Consumables
  waProductName?: string;
  waProductDiameter?: string;
  weldingProcess?: string;
  weldingProcessOther?: string;
  technique?: string;
  techniqueOther?: string;
  weldingPosition?: string;
  weldingPositionOther?: string;
  torchAngle?: string;
  shieldingGas?: string;
  shieldingGasOther?: string;
  shieldingFlowRate?: string;
  flux?: string;
  fluxOther?: string;
  standardDesignation?: string;
  // WA Parameters
  stickOut?: string;
  currentType?: string;
  currentTypeOther?: string;
  currentModeSynergy?: string;
  currentModeSynergyOther?: string;
  wireFeedSpeed?: string;
  intensity?: string;
  voltage?: string;
  travelSpeed?: string;
  // Oscillation Details
  oscillationAmplitude?: string;
  oscillationPeriod?: string;
  oscillationTempos?: string;
};

// Document metadata for uploaded files
export type WpsDocument = {
  name: string;
  size?: number;
  type?: string;
  url?: string;
};

export type WaWpsFormData = {
  caseStudyId: string;
  // Base Metal
  baseMetalType?: string;
  baseMetalGrade?: string;
  baseMetalThickness?: string;
  surfacePreparation?: string;
  surfacePreparationOther?: string;
  // Layers (new multi-layer structure)
  layers?: WpsLayer[];
  // Legacy WA Product fields (for backward compatibility)
  waProductName?: string;
  waProductDiameter?: string;
  shieldingGas?: string;
  shieldingGasOther?: string;
  shieldingFlowRate?: string;
  flux?: string;
  fluxOther?: string;
  standardDesignation?: string;
  // Legacy Welding Parameters
  weldingProcess?: string;
  weldingProcessOther?: string;
  currentType?: string;
  currentModeSynergy?: string;
  currentModeSynergyOther?: string;
  wireFeedSpeed?: string;
  intensity?: string;
  voltage?: string;
  heatInput?: string;
  weldingPosition?: string;
  weldingPositionOther?: string;
  torchAngle?: string;
  stickOut?: string;
  travelSpeed?: string;
  technique?: string;
  techniqueOther?: string;
  // Legacy Oscillation
  oscillationWidth?: string;
  oscillationSpeed?: string;
  oscillationStepOver?: string;
  oscillationTempo?: string;
  // Heating Procedure (new fields)
  preheatingTemp?: string;
  interpassTemp?: string;
  postheatingTemp?: string;
  // PWHT (new fields)
  pwhtRequired?: string;
  pwhtHeatingRate?: string;
  pwhtTempHoldingTime?: string;
  pwhtCoolingRate?: string;
  // Legacy Temperature
  preheatTemperature?: string;
  interpassTemperature?: string;
  postheatTemperature?: string;
  pwhtDetails?: string;
  // Documents (new field)
  documents?: WpsDocument[];
  // Results (legacy)
  layerNumbers?: number;
  hardness?: string;
  defectsObserved?: string;
  additionalNotes?: string;
};

export async function waSaveWeldingProcedure(data: WaWpsFormData) {
  try {
    console.log('[WPS Actions] Saving welding procedure:', data);

    const { caseStudyId, layers, documents, ...wpsData } = data;

    // Prepare data for Prisma - handle layers and documents as JSON
    const prismaData: Record<string, unknown> = {
      ...wpsData,
      // Store layers as JSON (new multi-layer structure)
      layers: layers && layers.length > 0 ? layers : undefined,
      // Store documents as JSON
      documents: documents && documents.length > 0 ? documents.map(doc => ({
        name: doc.name,
        size: doc.size,
        type: doc.type,
        url: doc.url
      })) : undefined,
    };

    // For backward compatibility, also store first layer data in legacy fields
    if (layers && layers.length > 0) {
      const firstLayer = layers[0];
      prismaData.waProductName = firstLayer.waProductName || prismaData.waProductName;
      prismaData.waProductDiameter = firstLayer.waProductDiameter || prismaData.waProductDiameter;
      prismaData.weldingProcess = firstLayer.weldingProcess || prismaData.weldingProcess;
      prismaData.weldingPosition = firstLayer.weldingPosition || prismaData.weldingPosition;
      prismaData.torchAngle = firstLayer.torchAngle || prismaData.torchAngle;
      prismaData.shieldingGas = firstLayer.shieldingGas || prismaData.shieldingGas;
      prismaData.shieldingFlowRate = firstLayer.shieldingFlowRate || prismaData.shieldingFlowRate;
      prismaData.flux = firstLayer.flux || prismaData.flux;
      prismaData.standardDesignation = firstLayer.standardDesignation || prismaData.standardDesignation;
      prismaData.currentType = firstLayer.currentType || prismaData.currentType;
      prismaData.currentModeSynergy = firstLayer.currentModeSynergy || prismaData.currentModeSynergy;
      prismaData.wireFeedSpeed = firstLayer.wireFeedSpeed || prismaData.wireFeedSpeed;
      prismaData.intensity = firstLayer.intensity || prismaData.intensity;
      prismaData.voltage = firstLayer.voltage || prismaData.voltage;
      prismaData.travelSpeed = firstLayer.travelSpeed || prismaData.travelSpeed;
      prismaData.stickOut = firstLayer.stickOut || prismaData.stickOut;
    }

    // Check if WPS already exists
    const existingWPS = await prisma.waWeldingProcedure.findUnique({
      where: { caseStudyId },
    });

    let wps;
    if (existingWPS) {
      // Update existing WPS
      wps = await prisma.waWeldingProcedure.update({
        where: { caseStudyId },
        data: prismaData,
      });
      console.log('[WPS Actions] WPS updated successfully');
    } else {
      // Create new WPS
      wps = await prisma.waWeldingProcedure.create({
        data: {
          caseStudyId,
          ...prismaData,
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

export async function waGetWeldingProcedure(caseStudyId: string) {
  try {
    console.log('[WPS Actions] Fetching welding procedure for case study:', caseStudyId);

    const wps = await prisma.waWeldingProcedure.findUnique({
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

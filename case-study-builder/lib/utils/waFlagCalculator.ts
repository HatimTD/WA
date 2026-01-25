/**
 * Flag Calculator Utility
 *
 * Implements BRD 3.2 - Case Study Tiers (Flags Logic)
 *
 * Flag System:
 * - Flag 1: Application Case Study (Base) - General + Problem/Solution filled
 * - Flag 2: Tech Case Study - WPS Details filled
 * - Flag 3: Star Case Study - Cost Calculator filled
 * - Complete Profile = All 3 flags
 *
 * @module lib/utils/flag-calculator
 * @author WA Development Team
 * @version 1.0.0
 * @since 2025-12-13
 */

import type { WaCaseStudy, WaWeldingProcedure, WaCostCalculator } from '@prisma/client';

// Type for case study with relations
export type CaseStudyWithRelations = WaCaseStudy & {
  weldingProcedure?: WaWeldingProcedure | null;
  costCalculator?: WaCostCalculator | null;
};

// Result type for flag calculations
export type FlagCalculationResult = {
  hasApplicationFlag: boolean;
  hasWpsFlag: boolean;
  hasCostFlag: boolean;
  tier: 'INCOMPLETE' | 'APPLICATION' | 'TECH' | 'STAR' | 'COMPLETE';
  tierLabel: string;
  tierDescription: string;
  completionPercentage: number;
  missingForNextTier: string[];
};

/**
 * Check if Application Case Study flag should be set
 * Requires: General Information + Problem & Solution sections filled
 */
export function waCalculateApplicationFlag(caseStudy: CaseStudyWithRelations): boolean {
  const requiredFields = [
    caseStudy.customerName,
    caseStudy.location,
    caseStudy.industry,
    caseStudy.componentWorkpiece,
    caseStudy.workType,
    caseStudy.wearType && caseStudy.wearType.length > 0,
    caseStudy.problemDescription,
    caseStudy.baseMetal,
    caseStudy.waSolution,
    caseStudy.waProduct,
    caseStudy.technicalAdvantages,
    caseStudy.images && caseStudy.images.length > 0, // Min 1 photo required
  ];

  return requiredFields.every(Boolean);
}

/**
 * Check if Tech Case Study flag should be set
 * Requires: All WPS Details filled
 */
export function waCalculateWpsFlag(caseStudy: CaseStudyWithRelations): boolean {
  const wps = caseStudy.weldingProcedure;
  if (!wps) return false;

  const requiredWpsFields = [
    wps.baseMetalType,
    wps.surfacePreparation,
    wps.weldingProcess,
    wps.weldingPosition,
    wps.waProductName,
    // Temperature management (at least one)
    wps.preheatTemperature || wps.interpassTemperature,
    // Shielding
    wps.shieldingGas || wps.flux,
    // Welding parameters
    wps.wireFeedSpeed || wps.intensity,
    wps.voltage,
  ];

  return requiredWpsFields.every(Boolean);
}

/**
 * Check if Star Case Study flag should be set
 * Requires: All Cost Calculator fields filled
 */
export function waCalculateCostFlag(caseStudy: CaseStudyWithRelations): boolean {
  const cost = caseStudy.costCalculator;
  if (!cost) return false;

  const requiredCostFields = [
    cost.materialCostBefore !== undefined && cost.materialCostBefore !== null,
    cost.materialCostAfter !== undefined && cost.materialCostAfter !== null,
    cost.laborCostBefore !== undefined && cost.laborCostBefore !== null,
    cost.laborCostAfter !== undefined && cost.laborCostAfter !== null,
    cost.downtimeCostBefore !== undefined && cost.downtimeCostBefore !== null,
    cost.downtimeCostAfter !== undefined && cost.downtimeCostAfter !== null,
    cost.totalCostBefore !== undefined && cost.totalCostBefore !== null,
    cost.totalCostAfter !== undefined && cost.totalCostAfter !== null,
    cost.annualSavings !== undefined && cost.annualSavings !== null,
  ];

  return requiredCostFields.every(Boolean);
}

/**
 * Calculate all flags for a case study
 */
export function waCalculateAllFlags(caseStudy: CaseStudyWithRelations): Pick<FlagCalculationResult, 'hasApplicationFlag' | 'hasWpsFlag' | 'hasCostFlag'> {
  return {
    hasApplicationFlag: waCalculateApplicationFlag(caseStudy),
    hasWpsFlag: waCalculateWpsFlag(caseStudy),
    hasCostFlag: waCalculateCostFlag(caseStudy),
  };
}

/**
 * Get case study tier based on flags
 */
export function waGetCaseStudyTier(flags: { hasApplicationFlag: boolean; hasWpsFlag: boolean; hasCostFlag: boolean }): FlagCalculationResult['tier'] {
  if (flags.hasCostFlag && flags.hasWpsFlag && flags.hasApplicationFlag) {
    return 'COMPLETE'; // All 3 flags
  }
  if (flags.hasCostFlag && flags.hasApplicationFlag) {
    return 'STAR';
  }
  if (flags.hasWpsFlag && flags.hasApplicationFlag) {
    return 'TECH';
  }
  if (flags.hasApplicationFlag) {
    return 'APPLICATION';
  }
  return 'INCOMPLETE';
}

/**
 * Get tier label for display
 */
export function waGetTierLabel(tier: FlagCalculationResult['tier']): string {
  const labels: Record<FlagCalculationResult['tier'], string> = {
    INCOMPLETE: 'Incomplete',
    APPLICATION: 'Application Case Study',
    TECH: 'Tech Case Study',
    STAR: 'Star Case Study',
    COMPLETE: 'Complete Profile',
  };
  return labels[tier];
}

/**
 * Get tier description
 */
export function waGetTierDescription(tier: FlagCalculationResult['tier']): string {
  const descriptions: Record<FlagCalculationResult['tier'], string> = {
    INCOMPLETE: 'Missing required fields for Application tier',
    APPLICATION: 'General information and problem/solution complete',
    TECH: 'Includes WPS (Welding Procedure Specification) details',
    STAR: 'Includes Cost Calculator with ROI analysis',
    COMPLETE: 'All three tiers complete - Full case study profile',
  };
  return descriptions[tier];
}

/**
 * Calculate missing fields for next tier
 */
export function waGetMissingForNextTier(
  caseStudy: CaseStudyWithRelations,
  currentTier: FlagCalculationResult['tier']
): string[] {
  const missing: string[] = [];

  if (currentTier === 'INCOMPLETE') {
    // Check what's missing for APPLICATION tier
    if (!caseStudy.customerName) missing.push('Customer Name');
    if (!caseStudy.location) missing.push('Location');
    if (!caseStudy.industry) missing.push('Industry');
    if (!caseStudy.componentWorkpiece) missing.push('Component/Workpiece');
    if (!caseStudy.workType) missing.push('Work Type');
    if (!caseStudy.wearType || caseStudy.wearType.length === 0) missing.push('Wear Type');
    if (!caseStudy.problemDescription) missing.push('Problem Description');
    if (!caseStudy.waSolution) missing.push('WA Solution');
    if (!caseStudy.waProduct) missing.push('WA Product');
    if (!caseStudy.images || caseStudy.images.length === 0) missing.push('At least 1 photo');
  } else if (currentTier === 'APPLICATION') {
    // Check what's missing for TECH tier (WPS)
    const wps = caseStudy.weldingProcedure;
    if (!wps) {
      missing.push('WPS Details (entire section)');
    } else {
      if (!wps.baseMetalType) missing.push('Base Metal Type');
      if (!wps.weldingProcess) missing.push('Welding Process');
      if (!wps.weldingPosition) missing.push('Welding Position');
      // Temperature fields (Preheat, Interpass, Postheat) are optional
    }
  } else if (currentTier === 'TECH') {
    // Check what's missing for STAR tier (Cost Calculator)
    const cost = caseStudy.costCalculator;
    if (!cost) {
      missing.push('Cost Calculator (entire section)');
    } else {
      if (cost.materialCostBefore === undefined) missing.push('Material Cost Before');
      if (cost.materialCostAfter === undefined) missing.push('Material Cost After');
      if (cost.laborCostBefore === undefined) missing.push('Labor Cost Before');
      if (cost.laborCostAfter === undefined) missing.push('Labor Cost After');
    }
  }

  return missing;
}

/**
 * Calculate completion percentage
 */
export function waCalculateCompletionPercentage(caseStudy: CaseStudyWithRelations): number {
  const flags = waCalculateAllFlags(caseStudy);
  let score = 0;

  // Application tier fields (40% of total)
  const applicationFields = [
    caseStudy.customerName,
    caseStudy.location,
    caseStudy.industry,
    caseStudy.componentWorkpiece,
    caseStudy.workType,
    caseStudy.wearType && caseStudy.wearType.length > 0,
    caseStudy.problemDescription,
    caseStudy.waSolution,
    caseStudy.waProduct,
    caseStudy.images && caseStudy.images.length > 0,
  ];
  const applicationScore = applicationFields.filter(Boolean).length / applicationFields.length * 40;
  score += applicationScore;

  // WPS tier fields (30% of total)
  if (caseStudy.weldingProcedure) {
    const wps = caseStudy.weldingProcedure;
    const wpsFields = [
      wps.baseMetalType,
      wps.weldingProcess,
      wps.weldingPosition,
      wps.waProductName,
      wps.preheatTemperature || wps.interpassTemperature,
      wps.shieldingGas || wps.flux,
    ];
    const wpsScore = wpsFields.filter(Boolean).length / wpsFields.length * 30;
    score += wpsScore;
  }

  // Cost Calculator tier fields (30% of total)
  if (caseStudy.costCalculator) {
    const cost = caseStudy.costCalculator;
    const costFields = [
      cost.materialCostBefore !== undefined,
      cost.materialCostAfter !== undefined,
      cost.laborCostBefore !== undefined,
      cost.laborCostAfter !== undefined,
      cost.downtimeCostBefore !== undefined,
      cost.downtimeCostAfter !== undefined,
    ];
    const costScore = costFields.filter(Boolean).length / costFields.length * 30;
    score += costScore;
  }

  return Math.round(score);
}

/**
 * Full flag calculation with all metadata
 */
export function waCalculateFlagResult(caseStudy: CaseStudyWithRelations): FlagCalculationResult {
  const flags = waCalculateAllFlags(caseStudy);
  const tier = waGetCaseStudyTier(flags);

  return {
    ...flags,
    tier,
    tierLabel: waGetTierLabel(tier),
    tierDescription: waGetTierDescription(tier),
    completionPercentage: waCalculateCompletionPercentage(caseStudy),
    missingForNextTier: waGetMissingForNextTier(caseStudy, tier),
  };
}

/**
 * Get points for a tier (for gamification)
 */
export function waGetTierPoints(tier: FlagCalculationResult['tier']): number {
  const points: Record<FlagCalculationResult['tier'], number> = {
    INCOMPLETE: 0,
    APPLICATION: 1,
    TECH: 2,
    STAR: 3,
    COMPLETE: 5, // Bonus for complete profile
  };
  return points[tier];
}

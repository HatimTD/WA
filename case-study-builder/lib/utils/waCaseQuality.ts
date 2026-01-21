/**
 * Case Study Quality/Completion Calculation Utilities
 * Calculates how complete a case study is based on required and optional fields
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NumberLike = number | { toNumber?: () => number } | null | undefined;

interface CaseStudy {
  id: string;
  type: 'APPLICATION' | 'TECH' | 'STAR';

  // Required fields
  customerName: string;
  industry: string;
  location: string;
  componentWorkpiece: string;
  workType: string;
  problemDescription: string;
  waSolution: string;
  waProduct: string;

  // Optional fields (accept Prisma Decimal type)
  country?: string | null;
  previousSolution?: string | null;
  baseMetal?: string | null;
  generalDimensions?: string | null;
  technicalAdvantages?: string | null;
  solutionValueRevenue?: NumberLike;
  annualPotentialRevenue?: NumberLike;
  customerSavingsAmount?: NumberLike;
}

interface WeldingProcedure {
  id: string;
  waProductName?: string | null;
  weldingProcess?: string | null;

  // Optional but important WPS fields
  baseMetalType?: string | null;
  baseMetalGrade?: string | null;
  baseMetalThickness?: string | null;
  surfacePreparation?: string | null;
  waProductDiameter?: string | null;
  shieldingGas?: string | null;
  shieldingFlowRate?: string | null;
  currentType?: string | null;
  currentModeSynergy?: string | null;
  wireFeedSpeed?: string | null;
  intensity?: string | null;
  voltage?: string | null;
  heatInput?: string | null;
  weldingPosition?: string | null;
  preheatTemperature?: string | null;
  interpassTemperature?: string | null;
  hardness?: string | null;
}

interface CostCalculator {
  id: string;
  materialCostBefore: NumberLike;
  materialCostAfter: NumberLike;
  laborCostBefore: NumberLike;
  laborCostAfter: NumberLike;
  downtimeCostBefore: NumberLike;
  downtimeCostAfter: NumberLike;
  maintenanceFrequencyBefore: NumberLike;
  maintenanceFrequencyAfter: NumberLike;

  // Optional but important cost fields
  costOfPart?: NumberLike;
  oldSolutionLifetimeDays?: NumberLike;
  waSolutionLifetimeDays?: NumberLike;
  partsUsedPerYear?: NumberLike;
  maintenanceRepairCostBefore?: NumberLike;
  maintenanceRepairCostAfter?: NumberLike;
}

interface FieldInfo {
  name: string;
  filled: boolean;
  category: 'required' | 'optional' | 'wps' | 'cost';
}

/**
 * Check if a field value is considered "filled"
 */
function waIsFieldFilled(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true; // Even 0 is considered filled
  return true;
}

/**
 * Calculate completion percentage for a case study
 * @param caseStudy - The case study to evaluate
 * @param wps - Optional welding procedure (required for TECH and STAR types)
 * @param costCalc - Optional cost calculator (required for STAR type)
 * @returns Completion percentage (0-100)
 */
export function waCalculateCompletionPercentage(
  caseStudy: CaseStudy,
  wps?: WeldingProcedure | null,
  costCalc?: CostCalculator | null
): number {
  const fields: FieldInfo[] = [];

  // Required fields for ALL types (always count these)
  const requiredCoreFields = [
    { key: 'customerName', value: caseStudy.customerName },
    { key: 'industry', value: caseStudy.industry },
    { key: 'location', value: caseStudy.location },
    { key: 'componentWorkpiece', value: caseStudy.componentWorkpiece },
    { key: 'workType', value: caseStudy.workType },
    { key: 'problemDescription', value: caseStudy.problemDescription },
    { key: 'waSolution', value: caseStudy.waSolution },
    { key: 'waProduct', value: caseStudy.waProduct },
  ];

  requiredCoreFields.forEach(field => {
    fields.push({
      name: field.key,
      filled: waIsFieldFilled(field.value),
      category: 'required',
    });
  });

  // Optional fields that improve quality
  const optionalFields = [
    { key: 'country', value: caseStudy.country },
    { key: 'previousSolution', value: caseStudy.previousSolution },
    { key: 'baseMetal', value: caseStudy.baseMetal },
    { key: 'generalDimensions', value: caseStudy.generalDimensions },
    { key: 'technicalAdvantages', value: caseStudy.technicalAdvantages },
    { key: 'solutionValueRevenue', value: caseStudy.solutionValueRevenue },
    { key: 'annualPotentialRevenue', value: caseStudy.annualPotentialRevenue },
    { key: 'customerSavingsAmount', value: caseStudy.customerSavingsAmount },
  ];

  optionalFields.forEach(field => {
    fields.push({
      name: field.key,
      filled: waIsFieldFilled(field.value),
      category: 'optional',
    });
  });

  // For TECH and STAR types, include WPS fields
  if (caseStudy.type === 'TECH' || caseStudy.type === 'STAR') {
    if (wps) {
      const wpsFields = [
        { key: 'waProductName', value: wps.waProductName },
        { key: 'weldingProcess', value: wps.weldingProcess },
        { key: 'baseMetalType', value: wps.baseMetalType },
        { key: 'baseMetalGrade', value: wps.baseMetalGrade },
        { key: 'baseMetalThickness', value: wps.baseMetalThickness },
        { key: 'surfacePreparation', value: wps.surfacePreparation },
        { key: 'waProductDiameter', value: wps.waProductDiameter },
        { key: 'shieldingGas', value: wps.shieldingGas },
        { key: 'currentType', value: wps.currentType },
        { key: 'wireFeedSpeed', value: wps.wireFeedSpeed },
        { key: 'intensity', value: wps.intensity },
        { key: 'voltage', value: wps.voltage },
        { key: 'heatInput', value: wps.heatInput },
        { key: 'weldingPosition', value: wps.weldingPosition },
        { key: 'preheatTemperature', value: wps.preheatTemperature },
        { key: 'hardness', value: wps.hardness },
      ];

      wpsFields.forEach(field => {
        fields.push({
          name: field.key,
          filled: waIsFieldFilled(field.value),
          category: 'wps',
        });
      });
    } else {
      // WPS is missing but expected - count as unfilled fields
      const wpsFieldCount = 16; // Number of important WPS fields
      for (let i = 0; i < wpsFieldCount; i++) {
        fields.push({
          name: `wps_field_${i}`,
          filled: false,
          category: 'wps',
        });
      }
    }
  }

  // For STAR type, include Cost Calculator fields
  if (caseStudy.type === 'STAR') {
    if (costCalc) {
      const costFields = [
        { key: 'materialCostBefore', value: costCalc.materialCostBefore },
        { key: 'materialCostAfter', value: costCalc.materialCostAfter },
        { key: 'laborCostBefore', value: costCalc.laborCostBefore },
        { key: 'laborCostAfter', value: costCalc.laborCostAfter },
        { key: 'downtimeCostBefore', value: costCalc.downtimeCostBefore },
        { key: 'downtimeCostAfter', value: costCalc.downtimeCostAfter },
        { key: 'maintenanceFrequencyBefore', value: costCalc.maintenanceFrequencyBefore },
        { key: 'maintenanceFrequencyAfter', value: costCalc.maintenanceFrequencyAfter },
        { key: 'costOfPart', value: costCalc.costOfPart },
        { key: 'oldSolutionLifetimeDays', value: costCalc.oldSolutionLifetimeDays },
        { key: 'waSolutionLifetimeDays', value: costCalc.waSolutionLifetimeDays },
        { key: 'partsUsedPerYear', value: costCalc.partsUsedPerYear },
      ];

      costFields.forEach(field => {
        fields.push({
          name: field.key,
          filled: waIsFieldFilled(field.value),
          category: 'cost',
        });
      });
    } else {
      // Cost calculator is missing but expected - count as unfilled fields
      const costFieldCount = 12; // Number of important cost fields
      for (let i = 0; i < costFieldCount; i++) {
        fields.push({
          name: `cost_field_${i}`,
          filled: false,
          category: 'cost',
        });
      }
    }
  }

  // Calculate percentage
  const totalFields = fields.length;
  const filledFields = fields.filter(f => f.filled).length;

  if (totalFields === 0) return 0;

  return Math.round((filledFields / totalFields) * 100);
}

/**
 * Get quality level based on completion percentage
 */
export function waGetQualityLevel(percentage: number): 'low' | 'medium' | 'high' {
  if (percentage < 50) return 'low';
  if (percentage < 80) return 'medium';
  return 'high';
}

/**
 * Get color class for quality level
 */
export function waGetQualityColor(percentage: number): {
  bg: string;
  text: string;
  border: string;
  ring: string;
} {
  const level = waGetQualityLevel(percentage);

  switch (level) {
    case 'low':
      return {
        bg: 'bg-red-100 dark:bg-red-950/20',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-300 dark:border-red-800',
        ring: 'ring-red-500',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-950/20',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-300 dark:border-yellow-800',
        ring: 'ring-yellow-500',
      };
    case 'high':
      return {
        bg: 'bg-green-100 dark:bg-green-950/20',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-300 dark:border-green-800',
        ring: 'ring-green-500',
      };
  }
}

/**
 * Get detailed field breakdown for a case study
 */
export function waGetFieldBreakdown(
  caseStudy: CaseStudy,
  wps?: WeldingProcedure | null,
  costCalc?: CostCalculator | null
): {
  required: { total: number; filled: number };
  optional: { total: number; filled: number };
  wps: { total: number; filled: number };
  cost: { total: number; filled: number };
  missingFields: string[];
} {
  const fields: FieldInfo[] = [];

  // Same logic as calculateCompletionPercentage but collect all fields
  const requiredCoreFields = [
    { key: 'customerName', value: caseStudy.customerName, label: 'Customer Name' },
    { key: 'industry', value: caseStudy.industry, label: 'Industry' },
    { key: 'location', value: caseStudy.location, label: 'Location' },
    { key: 'componentWorkpiece', value: caseStudy.componentWorkpiece, label: 'Component/Workpiece' },
    { key: 'workType', value: caseStudy.workType, label: 'Work Type' },
    { key: 'problemDescription', value: caseStudy.problemDescription, label: 'Problem Description' },
    { key: 'waSolution', value: caseStudy.waSolution, label: 'WA Solution' },
    { key: 'waProduct', value: caseStudy.waProduct, label: 'WA Product' },
  ];

  const optionalFields = [
    { key: 'country', value: caseStudy.country, label: 'Country' },
    { key: 'previousSolution', value: caseStudy.previousSolution, label: 'Previous Solution' },
    { key: 'baseMetal', value: caseStudy.baseMetal, label: 'Base Metal' },
    { key: 'generalDimensions', value: caseStudy.generalDimensions, label: 'Dimensions' },
    { key: 'technicalAdvantages', value: caseStudy.technicalAdvantages, label: 'Technical Advantages' },
    { key: 'solutionValueRevenue', value: caseStudy.solutionValueRevenue, label: 'Solution Value Revenue' },
    { key: 'annualPotentialRevenue', value: caseStudy.annualPotentialRevenue, label: 'Annual Potential Revenue' },
    { key: 'customerSavingsAmount', value: caseStudy.customerSavingsAmount, label: 'Customer Savings' },
  ];

  const breakdown = {
    required: { total: 0, filled: 0 },
    optional: { total: 0, filled: 0 },
    wps: { total: 0, filled: 0 },
    cost: { total: 0, filled: 0 },
    missingFields: [] as string[],
  };

  // Process required fields
  requiredCoreFields.forEach(field => {
    breakdown.required.total++;
    const filled = waIsFieldFilled(field.value);
    if (filled) {
      breakdown.required.filled++;
    } else {
      breakdown.missingFields.push(field.label);
    }
  });

  // Process optional fields
  optionalFields.forEach(field => {
    breakdown.optional.total++;
    if (waIsFieldFilled(field.value)) {
      breakdown.optional.filled++;
    }
  });

  // Process WPS fields for TECH and STAR
  if (caseStudy.type === 'TECH' || caseStudy.type === 'STAR') {
    if (wps) {
      const wpsFields = [
        { key: 'baseMetalType', value: wps.baseMetalType, label: 'Base Metal Type' },
        { key: 'baseMetalGrade', value: wps.baseMetalGrade, label: 'Base Metal Grade' },
        { key: 'baseMetalThickness', value: wps.baseMetalThickness, label: 'Base Metal Thickness' },
        { key: 'surfacePreparation', value: wps.surfacePreparation, label: 'Surface Preparation' },
        { key: 'waProductDiameter', value: wps.waProductDiameter, label: 'Product Diameter' },
        { key: 'shieldingGas', value: wps.shieldingGas, label: 'Shielding Gas' },
        { key: 'currentType', value: wps.currentType, label: 'Current Type' },
        { key: 'wireFeedSpeed', value: wps.wireFeedSpeed, label: 'Wire Feed Speed' },
        { key: 'intensity', value: wps.intensity, label: 'Intensity' },
        { key: 'voltage', value: wps.voltage, label: 'Voltage' },
        { key: 'heatInput', value: wps.heatInput, label: 'Heat Input' },
        { key: 'weldingPosition', value: wps.weldingPosition, label: 'Welding Position' },
        { key: 'preheatTemperature', value: wps.preheatTemperature, label: 'Preheat Temperature' },
        { key: 'hardness', value: wps.hardness, label: 'Hardness' },
      ];

      wpsFields.forEach(field => {
        breakdown.wps.total++;
        if (waIsFieldFilled(field.value)) {
          breakdown.wps.filled++;
        } else {
          breakdown.missingFields.push(`WPS: ${field.label}`);
        }
      });
    } else {
      breakdown.wps.total = 14;
      breakdown.missingFields.push('Welding Procedure Specification (WPS)');
    }
  }

  // Process cost fields for STAR
  if (caseStudy.type === 'STAR') {
    if (costCalc) {
      const costFields = [
        { key: 'materialCostBefore', value: costCalc.materialCostBefore, label: 'Material Cost (Before)' },
        { key: 'materialCostAfter', value: costCalc.materialCostAfter, label: 'Material Cost (After)' },
        { key: 'laborCostBefore', value: costCalc.laborCostBefore, label: 'Labor Cost (Before)' },
        { key: 'laborCostAfter', value: costCalc.laborCostAfter, label: 'Labor Cost (After)' },
        { key: 'costOfPart', value: costCalc.costOfPart, label: 'Cost of Part' },
        { key: 'oldSolutionLifetimeDays', value: costCalc.oldSolutionLifetimeDays, label: 'Old Solution Lifetime' },
        { key: 'waSolutionLifetimeDays', value: costCalc.waSolutionLifetimeDays, label: 'WA Solution Lifetime' },
      ];

      costFields.forEach(field => {
        breakdown.cost.total++;
        if (waIsFieldFilled(field.value)) {
          breakdown.cost.filled++;
        } else {
          breakdown.missingFields.push(`Cost: ${field.label}`);
        }
      });
    } else {
      breakdown.cost.total = 7;
      breakdown.missingFields.push('Cost Calculator');
    }
  }

  return breakdown;
}

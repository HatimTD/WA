/**
 * Bulk Import Parser Utilities
 * Handles CSV and Excel file parsing for case study imports
 */

export interface BulkImportRow {
  rowNumber: number;
  type: string;
  customerName: string;
  industry: string;
  location: string;
  country?: string;
  componentWorkpiece: string;
  workType: string;
  wearType: string; // Comma-separated values
  baseMetal?: string;
  generalDimensions?: string;
  oem?: string;
  problemDescription: string;
  previousSolution?: string;
  previousServiceLife?: string;
  competitorName?: string;
  waSolution: string;
  waProduct: string;
  technicalAdvantages?: string;
  expectedServiceLife?: string;
  solutionValueRevenue?: string;
  annualPotentialRevenue?: string;
  customerSavingsAmount?: string;
  tags?: string; // Comma-separated values
}

export interface ValidationError {
  rowNumber: number;
  field: string;
  message: string;
  value?: string;
}

export interface ParseResult {
  success: boolean;
  rows: BulkImportRow[];
  errors: ValidationError[];
  totalRows: number;
  validRows: number;
}

// Required fields for import
const REQUIRED_FIELDS = [
  'type',
  'customerName',
  'industry',
  'location',
  'componentWorkpiece',
  'workType',
  'problemDescription',
  'waSolution',
  'waProduct',
];

// Valid enum values
const VALID_TYPES = ['APPLICATION', 'TECH', 'STAR'];
const VALID_WORK_TYPES = ['WORKSHOP', 'ON_SITE', 'BOTH'];
const VALID_WEAR_TYPES = ['ABRASION', 'IMPACT', 'CORROSION', 'TEMPERATURE', 'COMBINATION'];

// Column name mappings (support various formats)
const COLUMN_MAPPINGS: Record<string, string> = {
  // Type
  'type': 'type',
  'case type': 'type',
  'casetype': 'type',

  // Customer
  'customername': 'customerName',
  'customer name': 'customerName',
  'customer': 'customerName',

  // Industry
  'industry': 'industry',

  // Location
  'location': 'location',
  'city': 'location',

  // Country
  'country': 'country',

  // Component
  'componentworkpiece': 'componentWorkpiece',
  'component workpiece': 'componentWorkpiece',
  'component': 'componentWorkpiece',
  'workpiece': 'componentWorkpiece',

  // Work Type
  'worktype': 'workType',
  'work type': 'workType',

  // Wear Type
  'weartype': 'wearType',
  'wear type': 'wearType',
  'wear types': 'wearType',

  // Base Metal
  'basemetal': 'baseMetal',
  'base metal': 'baseMetal',

  // Dimensions
  'generaldimensions': 'generalDimensions',
  'general dimensions': 'generalDimensions',
  'dimensions': 'generalDimensions',

  // OEM
  'oem': 'oem',
  'original equipment manufacturer': 'oem',

  // Problem
  'problemdescription': 'problemDescription',
  'problem description': 'problemDescription',
  'problem': 'problemDescription',
  'challenge': 'problemDescription',

  // Previous Solution
  'previoussolution': 'previousSolution',
  'previous solution': 'previousSolution',

  // Previous Service Life
  'previousservicelife': 'previousServiceLife',
  'previous service life': 'previousServiceLife',

  // Competitor
  'competitorname': 'competitorName',
  'competitor name': 'competitorName',
  'competitor': 'competitorName',

  // WA Solution
  'wasolution': 'waSolution',
  'wa solution': 'waSolution',
  'solution': 'waSolution',

  // WA Product
  'waproduct': 'waProduct',
  'wa product': 'waProduct',
  'product': 'waProduct',

  // Technical Advantages
  'technicaladvantages': 'technicalAdvantages',
  'technical advantages': 'technicalAdvantages',
  'advantages': 'technicalAdvantages',

  // Expected Service Life
  'expectedservicelife': 'expectedServiceLife',
  'expected service life': 'expectedServiceLife',

  // Financial
  'solutionvaluerevenue': 'solutionValueRevenue',
  'solution value revenue': 'solutionValueRevenue',
  'solution value': 'solutionValueRevenue',
  'revenue': 'solutionValueRevenue',

  'annualpotentialrevenue': 'annualPotentialRevenue',
  'annual potential revenue': 'annualPotentialRevenue',
  'annual revenue': 'annualPotentialRevenue',

  'customersavingsamount': 'customerSavingsAmount',
  'customer savings amount': 'customerSavingsAmount',
  'customer savings': 'customerSavingsAmount',
  'savings': 'customerSavingsAmount',

  // Tags
  'tags': 'tags',
};

/**
 * Normalize column name to match our field names
 */
function normalizeColumnName(name: string): string {
  const normalized = name.toLowerCase().trim();
  return COLUMN_MAPPINGS[normalized] || normalized;
}

/**
 * Parse CSV content
 */
export function parseCSV(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter(line => line.trim());

  if (lines.length < 2) {
    return {
      success: false,
      rows: [],
      errors: [{ rowNumber: 0, field: 'file', message: 'CSV file must have a header row and at least one data row' }],
      totalRows: 0,
      validRows: 0,
    };
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(normalizeColumnName);

  const rows: BulkImportRow[] = [];
  const errors: ValidationError[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const rowNumber = i + 1; // 1-indexed for user display

    const row: Partial<BulkImportRow> = { rowNumber };

    // Map values to fields
    headers.forEach((header, index) => {
      const value = values[index]?.trim() || '';
      if (header && value) {
        (row as any)[header] = value;
      }
    });

    // Validate row
    const rowErrors = validateRow(row as BulkImportRow, rowNumber);

    if (rowErrors.length === 0) {
      rows.push(row as BulkImportRow);
    } else {
      errors.push(...rowErrors);
    }
  }

  return {
    success: errors.length === 0,
    rows,
    errors,
    totalRows: lines.length - 1,
    validRows: rows.length,
  };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else if (char === '"') {
        // End of quoted value
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parse Excel content (expects JSON array from xlsx library)
 */
export function parseExcelData(data: Record<string, any>[]): ParseResult {
  if (!data || data.length === 0) {
    return {
      success: false,
      rows: [],
      errors: [{ rowNumber: 0, field: 'file', message: 'Excel file is empty or invalid' }],
      totalRows: 0,
      validRows: 0,
    };
  }

  const rows: BulkImportRow[] = [];
  const errors: ValidationError[] = [];

  data.forEach((excelRow, index) => {
    const rowNumber = index + 2; // Account for header row, 1-indexed

    // Normalize column names
    const row: Partial<BulkImportRow> = { rowNumber };

    Object.entries(excelRow).forEach(([key, value]) => {
      const normalizedKey = normalizeColumnName(key);
      if (normalizedKey && value !== null && value !== undefined) {
        (row as any)[normalizedKey] = String(value).trim();
      }
    });

    // Validate row
    const rowErrors = validateRow(row as BulkImportRow, rowNumber);

    if (rowErrors.length === 0) {
      rows.push(row as BulkImportRow);
    } else {
      errors.push(...rowErrors);
    }
  });

  return {
    success: errors.length === 0,
    rows,
    errors,
    totalRows: data.length,
    validRows: rows.length,
  };
}

/**
 * Validate a single row
 */
function validateRow(row: BulkImportRow, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check required fields
  REQUIRED_FIELDS.forEach(field => {
    const value = (row as any)[field];
    if (!value || value.trim() === '') {
      errors.push({
        rowNumber,
        field,
        message: `${field} is required`,
      });
    }
  });

  // Validate type enum
  if (row.type && !VALID_TYPES.includes(row.type.toUpperCase())) {
    errors.push({
      rowNumber,
      field: 'type',
      message: `Invalid type "${row.type}". Must be one of: ${VALID_TYPES.join(', ')}`,
      value: row.type,
    });
  }

  // Validate workType enum
  if (row.workType && !VALID_WORK_TYPES.includes(row.workType.toUpperCase())) {
    errors.push({
      rowNumber,
      field: 'workType',
      message: `Invalid workType "${row.workType}". Must be one of: ${VALID_WORK_TYPES.join(', ')}`,
      value: row.workType,
    });
  }

  // Validate wearType array values
  if (row.wearType) {
    const wearTypes = row.wearType.split(',').map(t => t.trim().toUpperCase());
    const invalidTypes = wearTypes.filter(t => t && !VALID_WEAR_TYPES.includes(t));
    if (invalidTypes.length > 0) {
      errors.push({
        rowNumber,
        field: 'wearType',
        message: `Invalid wearType values: ${invalidTypes.join(', ')}. Valid values: ${VALID_WEAR_TYPES.join(', ')}`,
        value: row.wearType,
      });
    }
  }

  // Validate numerical fields
  const numericFields = ['solutionValueRevenue', 'annualPotentialRevenue', 'customerSavingsAmount'];
  numericFields.forEach(field => {
    const value = (row as any)[field];
    if (value && isNaN(parseFloat(value))) {
      errors.push({
        rowNumber,
        field,
        message: `${field} must be a valid number`,
        value,
      });
    }
  });

  return errors;
}

/**
 * Convert parsed row to case study input format
 */
export function convertToCreateInput(row: BulkImportRow): {
  type: 'APPLICATION' | 'TECH' | 'STAR';
  status: 'DRAFT' | 'SUBMITTED';
  customerName: string;
  industry: string;
  location: string;
  country: string;
  componentWorkpiece: string;
  workType: 'WORKSHOP' | 'ON_SITE' | 'BOTH';
  wearType: string[];
  baseMetal: string;
  generalDimensions: string;
  oem: string;
  problemDescription: string;
  previousSolution: string;
  previousServiceLife: string;
  competitorName: string;
  waSolution: string;
  waProduct: string;
  technicalAdvantages: string;
  expectedServiceLife: string;
  solutionValueRevenue: string;
  annualPotentialRevenue: string;
  customerSavingsAmount: string;
  images: string[];
  supportingDocs: string[];
  tags: string[];
} {
  // Parse wear types from comma-separated string
  const wearTypes = row.wearType
    ? row.wearType.split(',').map(t => t.trim().toUpperCase()).filter(Boolean)
    : ['ABRASION']; // Default

  // Parse tags from comma-separated string
  const tags = row.tags
    ? row.tags.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  return {
    type: row.type.toUpperCase() as 'APPLICATION' | 'TECH' | 'STAR',
    status: 'DRAFT',
    customerName: row.customerName,
    industry: row.industry,
    location: row.location,
    country: row.country || '',
    componentWorkpiece: row.componentWorkpiece,
    workType: row.workType.toUpperCase() as 'WORKSHOP' | 'ON_SITE' | 'BOTH',
    wearType: wearTypes,
    baseMetal: row.baseMetal || '',
    generalDimensions: row.generalDimensions || '',
    oem: row.oem || '',
    problemDescription: row.problemDescription,
    previousSolution: row.previousSolution || '',
    previousServiceLife: row.previousServiceLife || '',
    competitorName: row.competitorName || '',
    waSolution: row.waSolution,
    waProduct: row.waProduct,
    technicalAdvantages: row.technicalAdvantages || '',
    expectedServiceLife: row.expectedServiceLife || '',
    solutionValueRevenue: row.solutionValueRevenue || '',
    annualPotentialRevenue: row.annualPotentialRevenue || '',
    customerSavingsAmount: row.customerSavingsAmount || '',
    images: [],
    supportingDocs: [],
    tags,
  };
}

/**
 * Generate CSV template with headers
 */
export function generateCSVTemplate(): string {
  const headers = [
    'type',
    'customerName',
    'industry',
    'location',
    'country',
    'componentWorkpiece',
    'workType',
    'wearType',
    'baseMetal',
    'generalDimensions',
    'oem',
    'problemDescription',
    'previousSolution',
    'previousServiceLife',
    'competitorName',
    'waSolution',
    'waProduct',
    'technicalAdvantages',
    'expectedServiceLife',
    'solutionValueRevenue',
    'annualPotentialRevenue',
    'customerSavingsAmount',
    'tags',
  ];

  const exampleRow = [
    'APPLICATION',
    'Example Customer',
    'Mining',
    'Sydney',
    'Australia',
    'Crusher Hammer',
    'WORKSHOP',
    'ABRASION,IMPACT',
    'Manganese Steel',
    '500x200x100mm',
    'CAT',
    'Component suffers from severe wear due to high-impact abrasive materials',
    'Standard steel replacement every 3 months',
    '3 months',
    'Competitor Inc',
    'Applied HARDFACE overlay to extend service life',
    'HARDFACE HC-O',
    'Extended service life, reduced downtime, better wear resistance',
    '12 months',
    '50000',
    '200000',
    '30000',
    'mining,crusher,hardface',
  ];

  return [headers.join(','), exampleRow.join(',')].join('\n');
}

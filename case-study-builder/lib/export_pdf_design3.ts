/**
 * PDF Export - Professional Design v3
 * Features:
 * - New WA Logo (full horizontal logo)
 * - Professional icons for each info category
 * - Visual comparison section (before/after)
 * - Elegant WPS card-based layout
 * - Modern cost calculator design
 * - HD image annexes (one image per page)
 */

import jsPDF from 'jspdf';
import { waFormatJobType, waFormatProductCategory, waGetProductDisplay } from './waUtils';

// ============ TYPES ============

export interface CaseStudyPDFData {
  id: string;
  type: 'APPLICATION' | 'TECH' | 'STAR';
  title?: string | null;
  customerName: string;
  industry: string;
  location: string;
  country?: string;
  componentWorkpiece: string;
  workType?: string;
  wearType: string[];
  wearSeverities?: Record<string, number>;
  wearTypeOthers?: Array<{ name: string; severity: number }>;
  generalDescription?: string;
  unitSystem?: 'METRIC' | 'IMPERIAL';
  problemDescription: string;
  previousSolution?: string;
  previousServiceLife?: string;
  competitorName?: string;
  baseMetal?: string;
  generalDimensions?: string;
  waSolution: string;
  productCategory?: string;
  productCategoryOther?: string;
  waProduct: string;
  waProductDiameter?: string;
  productDescription?: string;
  technicalAdvantages?: string;
  expectedServiceLife?: string;
  solutionValueRevenue?: number;
  revenueCurrency?: string;
  annualPotentialRevenue?: number;
  customerSavingsAmount?: number;
  jobType?: string;
  jobTypeOther?: string;
  oem?: string;
  jobDurationHours?: string;
  jobDurationDays?: string;
  jobDurationWeeks?: string;
  jobDurationMonths?: string;
  jobDurationYears?: string;
  customerSegment?: string;
  subSegment?: string;
  contributor: { name: string; };
  approver?: { name: string; };
  createdAt?: Date | string;
  approvedAt?: Date | string;
  jobDate?: Date | string;
  revision?: string;
  originalLanguage?: string;
  translationAvailable?: boolean;
  translatedText?: string | null;
  wps?: WPSData;
  costCalculator?: CostCalculatorData;
  images?: string[] | { url: string; caption?: string }[];
  supportingDocs?: string[];
}

export interface WPSLayer {
  id?: string;
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
  stickOut?: string;
  currentType?: string;
  currentTypeOther?: string;
  currentModeSynergy?: string;
  currentModeSynergyOther?: string;
  wireFeedSpeed?: string;
  intensity?: string;
  voltage?: string;
  travelSpeed?: string;
  oscillationAmplitude?: string;
  oscillationPeriod?: string;
  oscillationTempos?: string;
}

export interface WPSData {
  // Base metal
  baseMetalType?: string;
  baseMetalGrade?: string;
  baseMetalThickness?: string;
  surfacePreparation?: string;
  surfacePreparationOther?: string;

  // Multi-layer structure (new)
  layers?: WPSLayer[];

  // Legacy fields (for backward compatibility)
  numberOfLayers?: string;
  process?: string;
  technique?: string;
  weldingPosition?: string;
  torchPosition?: string;
  baseMetal?: string;
  thickness?: string;
  productName?: string;
  diameter?: string;
  shieldingGas?: string;
  flowRate?: string;
  flux?: string;
  standardDesignation?: string;
  stickOut?: string;
  currentType?: string;
  wireSpeed?: string;
  intensity?: string;
  voltage?: string;
  weldingSpeed?: string;
  oscillationWidth?: string;
  oscillationSpeed?: string;
  oscillationTempo?: string;
  stepoverDistance?: string;

  // Heating procedure (new and legacy)
  preheatingTemp?: string;
  interpassTemp?: string;
  postheatingTemp?: string;
  preheatTemperature?: string;
  interpassTemperature?: string;
  postheating?: string;
  postheatTemperature?: string;

  // PWHT (new and legacy)
  pwhtRequired?: string;
  pwhtHeatingRate?: string;
  pwhtTempHoldingTime?: string;
  pwhtCoolingRate?: string;
  pwht?: string;
  heatingRate?: string;
  temperatureHoldingTime?: string;
  coolingRate?: string;

  // Additional notes
  additionalNotes?: string;
  pwhtDetails?: string;
}

export interface CostCalculatorData {
  equipmentName?: string;
  costOfPart?: number;
  costOfWaSolution?: number;
  oldSolutionLifetimeDays?: number;
  waSolutionLifetimeDays?: number;
  oldSolutionLifetimeUnit?: string;
  waSolutionLifetimeUnit?: string;
  partsUsedPerYear?: number;
  maintenanceRepairCost?: number;
  disassemblyCost?: number;
  downtimeCost?: number;
  currency?: string;
  totalCostBefore?: number;
  totalCostAfter?: number;
  annualSavings?: number;
  savingsPercentage?: number;
  extraBenefits?: string;
}

export interface PDFExportOptions {
  exportedByName?: string;
  exportedByEmail?: string;
  useTranslation?: boolean;
}

// ============ CONSTANTS ============

const COLORS = {
  waGreen: { r: 34, g: 139, b: 34 },
  darkGreen: { r: 0, g: 100, b: 50 },
  lightGreen: { r: 220, g: 252, b: 231 },
  accentGreen: { r: 16, g: 185, b: 129 },
  black: { r: 0, g: 0, b: 0 },
  white: { r: 255, g: 255, b: 255 },
  gray: { r: 128, g: 128, b: 128 },
  lightGray: { r: 245, g: 245, b: 245 },
  mediumGray: { r: 200, g: 200, b: 200 },
  darkGray: { r: 60, g: 60, b: 60 },
  red: { r: 220, g: 38, b: 38 },
  yellow: { r: 255, g: 248, b: 220 },
  blue: { r: 59, g: 130, b: 246 },
  purple: { r: 147, g: 51, b: 234 },
  starYellow: { r: 234, g: 179, b: 8 },
  orange: { r: 249, g: 115, b: 22 },
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '\u20AC', USD: '$', GBP: '\u00A3', CHF: 'CHF', AUD: 'A$', CAD: 'C$',
  JPY: '\u00A5', CNY: '\u00A5', MAD: 'MAD',
};

// ============ HELPER FUNCTIONS ============

function waGetCurrency(code?: string): string {
  return CURRENCY_SYMBOLS[code || 'EUR'] || '\u20AC';
}

// Format currency with space after symbol
function waFormatCurrency(amount: number, currencyCode?: string): string {
  const symbol = waGetCurrency(currencyCode);
  return `${symbol} ${waFormatNumber(amount)}`;
}

function waFormatDate(date?: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function waFormatNumber(num: number): string {
  // Round to 2 decimal places and add thousand separators
  const rounded = Math.round(num * 100) / 100;
  return rounded.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function waCalculateAnnualCost(
  costOfPart: number,
  partsPerYear: number,
  maintenanceCost: number,
  disassemblyCost: number,
  downtimeCost: number
): number {
  return (costOfPart * partsPerYear) + ((partsPerYear - 1) * (maintenanceCost + disassemblyCost + downtimeCost));
}

// ============ IMAGE HANDLING ============

const imageCache: Map<string, string> = new Map();
const imageDimensionsCache: Map<string, { width: number; height: number }> = new Map();

/**
 * Get image dimensions from base64 data
 */
async function waGetImageDimensions(base64: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = base64;
  });
}

async function waFetchImageAsBase64(url: string): Promise<string | null> {
  if (imageCache.has(url)) {
    return imageCache.get(url) || null;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('[PDF] Failed to fetch image:', url, response.status);
      return null;
    }

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        imageCache.set(url, base64);
        resolve(base64);
      };
      reader.onerror = () => {
        console.error('[PDF] Failed to read image blob:', url);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[PDF] Error fetching image:', url, error);
    return null;
  }
}

function waGetImageFormat(dataUrl: string): 'PNG' | 'JPEG' | 'GIF' | 'WEBP' {
  if (dataUrl.includes('image/png')) return 'PNG';
  if (dataUrl.includes('image/gif')) return 'GIF';
  if (dataUrl.includes('image/webp')) return 'WEBP';
  return 'JPEG';
}

function waNormalizeImages(images?: string[] | { url: string; caption?: string }[]): { url: string; caption?: string }[] {
  if (!images || images.length === 0) return [];
  return images.map(img => typeof img === 'string' ? { url: img } : img);
}

// ============ PROFESSIONAL ICON LOADING (SVG Icons) ============

/**
 * Icon cache for loaded and converted icons (SVG -> PNG)
 */
const iconCache: Map<string, string> = new Map();

/**
 * Convert SVG to PNG using canvas
 */
async function waSvgToPng(svgText: string, size: number = 64): Promise<string | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve(null);
      return;
    }

    const img = new Image();
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Fill with transparent background
      ctx.clearRect(0, 0, size, size);

      // Draw the SVG image
      ctx.drawImage(img, 0, 0, size, size);

      // Convert canvas to PNG data URL
      const pngDataUrl = canvas.toDataURL('image/png');

      // Clean up
      URL.revokeObjectURL(url);
      resolve(pngDataUrl);
    };

    img.onerror = () => {
      console.error('[PDF] Failed to load SVG image for conversion');
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Load an icon from /public/icons/ folder and convert to PNG
 */
async function waLoadIcon(iconName: string): Promise<string | null> {
  if (iconCache.has(iconName)) {
    return iconCache.get(iconName) || null;
  }

  try {
    const iconUrl = window?.location?.origin
      ? `${window.location.origin}/icons/${iconName}.svg`
      : `/icons/${iconName}.svg`;

    const response = await fetch(iconUrl);
    if (!response.ok) {
      console.error('[PDF] Failed to load icon:', iconName, response.status);
      return null;
    }

    const svgText = await response.text();

    // Convert SVG to PNG (256x256 for high quality)
    const pngDataUrl = await waSvgToPng(svgText, 256);

    if (pngDataUrl) {
      iconCache.set(iconName, pngDataUrl);
      return pngDataUrl;
    }

    return null;
  } catch (error) {
    console.error('[PDF] Error loading icon:', iconName, error);
    return null;
  }
}

/**
 * Draw an icon from SVG file (converted to PNG)
 */
async function waDrawIcon(
  doc: jsPDF,
  iconName: string,
  x: number,
  y: number,
  size: number = 10,
  color?: { r: number; g: number; b: number }
): Promise<void> {
  try {
    const iconData = await waLoadIcon(iconName);
    if (iconData) {
      // Icon is now PNG format (converted from SVG)
      doc.addImage(iconData, 'PNG', x, y, size, size);
    } else {
      // Fallback: draw a simple colored circle
      const fillColor = color || COLORS.waGreen;
      doc.setFillColor(fillColor.r, fillColor.g, fillColor.b);
      doc.circle(x + size / 2, y + size / 2, size * 0.4, 'F');
    }
  } catch (error) {
    console.error('[PDF] Error drawing icon:', iconName, error);
    // Fallback
    const fillColor = color || COLORS.waGreen;
    doc.setFillColor(fillColor.r, fillColor.g, fillColor.b);
    doc.circle(x + size / 2, y + size / 2, size * 0.4, 'F');
  }
}

// ============ LEGACY ICON FUNCTIONS (Kept as fallback) ============

/**
 * Draw Building2 icon (Lucide style) - for Industry
 * @deprecated Use waDrawIcon('building-2', x, y, size) instead
 */
function waDrawBuildingIcon(doc: jsPDF, x: number, y: number, size: number = 10): void {
  doc.setDrawColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setLineWidth(0.4);

  // Main building outline
  const pad = size * 0.1;
  const buildingWidth = size * 0.6;
  const buildingHeight = size * 0.75;
  const buildingX = x + (size - buildingWidth) / 2;
  const buildingY = y + size * 0.15;

  doc.rect(buildingX, buildingY, buildingWidth, buildingHeight, 'S');

  // Windows (2x3 grid)
  const windowSize = size * 0.1;
  const windowGap = size * 0.08;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const wx = buildingX + size * 0.1 + col * (windowSize + windowGap);
      const wy = buildingY + size * 0.08 + row * (windowSize + windowGap * 0.8);
      doc.rect(wx, wy, windowSize, windowSize, 'S');
    }
  }

  // Door
  doc.rect(buildingX + buildingWidth / 2 - size * 0.08, buildingY + buildingHeight - size * 0.18, size * 0.16, size * 0.18, 'S');
}

/**
 * Draw Package icon (Lucide style) - for Component/Workpiece
 */
function waDrawPackageIcon(doc: jsPDF, x: number, y: number, size: number = 10): void {
  doc.setDrawColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setLineWidth(0.4);

  const cx = x + size / 2;
  const cy = y + size / 2;
  const boxSize = size * 0.35;

  // 3D box effect
  // Front face
  doc.rect(cx - boxSize * 0.8, cy - boxSize * 0.3, boxSize * 1.2, boxSize * 1.2, 'S');

  // Top face (parallelogram)
  doc.line(cx - boxSize * 0.8, cy - boxSize * 0.3, cx - boxSize * 0.3, cy - boxSize * 0.8);
  doc.line(cx - boxSize * 0.3, cy - boxSize * 0.8, cx + boxSize * 0.9, cy - boxSize * 0.8);
  doc.line(cx + boxSize * 0.9, cy - boxSize * 0.8, cx + boxSize * 0.4, cy - boxSize * 0.3);

  // Right face
  doc.line(cx + boxSize * 0.4, cy - boxSize * 0.3, cx + boxSize * 0.9, cy - boxSize * 0.8);
  doc.line(cx + boxSize * 0.9, cy - boxSize * 0.8, cx + boxSize * 0.9, cy + boxSize * 0.4);
  doc.line(cx + boxSize * 0.4, cy + boxSize * 0.9, cx + boxSize * 0.9, cy + boxSize * 0.4);

  // Center vertical line on front
  doc.line(cx - boxSize * 0.2, cy - boxSize * 0.3, cx - boxSize * 0.2, cy + boxSize * 0.9);
}

/**
 * Draw Wrench icon (Lucide style) - for Job Type/Work Type
 */
function waDrawWrenchIcon(doc: jsPDF, x: number, y: number, size: number = 10): void {
  doc.setDrawColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setLineWidth(0.5);

  // Wrench handle (diagonal)
  doc.line(x + size * 0.2, y + size * 0.8, x + size * 0.65, y + size * 0.35);

  // Wrench head (open end)
  doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.circle(x + size * 0.75, y + size * 0.25, size * 0.18, 'S');

  // Wrench jaw opening
  doc.line(x + size * 0.65, y + size * 0.15, x + size * 0.85, y + size * 0.15);
  doc.line(x + size * 0.65, y + size * 0.35, x + size * 0.85, y + size * 0.35);
}

/**
 * Draw MapPin icon (Lucide style) - for Location
 */
function waDrawMapPinIcon(doc: jsPDF, x: number, y: number, size: number = 10): void {
  doc.setDrawColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setLineWidth(0.4);

  const cx = x + size / 2;
  const topY = y + size * 0.1;
  const pinRadius = size * 0.28;

  // Pin head (circle outline)
  doc.circle(cx, topY + pinRadius, pinRadius, 'S');

  // Pin point (triangle lines)
  doc.line(cx - pinRadius * 0.6, topY + pinRadius * 1.3, cx, y + size * 0.9);
  doc.line(cx + pinRadius * 0.6, topY + pinRadius * 1.3, cx, y + size * 0.9);

  // Inner dot
  doc.circle(cx, topY + pinRadius, pinRadius * 0.35, 'F');
}

/**
 * Draw Calendar icon (Lucide style) - for Dates
 */
function waDrawCalendarIcon(doc: jsPDF, x: number, y: number, size: number = 10): void {
  doc.setDrawColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setLineWidth(0.4);

  // Calendar body
  const pad = size * 0.12;
  const calWidth = size - pad * 2;
  const calHeight = size * 0.7;
  doc.rect(x + pad, y + size * 0.22, calWidth, calHeight, 'S');

  // Header bar
  doc.line(x + pad, y + size * 0.4, x + size - pad, y + size * 0.4);

  // Calendar rings/hooks
  doc.line(x + size * 0.3, y + size * 0.1, x + size * 0.3, y + size * 0.28);
  doc.line(x + size * 0.7, y + size * 0.1, x + size * 0.7, y + size * 0.28);

  // Date dots
  doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  const dotSize = size * 0.055;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      doc.circle(
        x + size * 0.28 + col * size * 0.22,
        y + size * 0.55 + row * size * 0.18,
        dotSize,
        'F'
      );
    }
  }
}

/**
 * Draw User icon (Lucide style) - for Contributor
 */
function waDrawUserIcon(doc: jsPDF, x: number, y: number, size: number = 10): void {
  doc.setDrawColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setLineWidth(0.4);

  const cx = x + size / 2;

  // Head
  doc.circle(cx, y + size * 0.28, size * 0.2, 'S');

  // Body (arc for shoulders)
  doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  // Simplified body shape
  doc.line(x + size * 0.2, y + size * 0.9, x + size * 0.2, y + size * 0.65);
  doc.line(x + size * 0.2, y + size * 0.65, x + size * 0.35, y + size * 0.52);
  doc.line(x + size * 0.35, y + size * 0.52, x + size * 0.65, y + size * 0.52);
  doc.line(x + size * 0.65, y + size * 0.52, x + size * 0.8, y + size * 0.65);
  doc.line(x + size * 0.8, y + size * 0.65, x + size * 0.8, y + size * 0.9);
}

/**
 * Draw Clipboard icon (Lucide style) - for Job Type
 */
function waDrawClipboardIcon(doc: jsPDF, x: number, y: number, size: number = 10): void {
  doc.setDrawColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setLineWidth(0.4);

  // Clipboard body
  const clipX = x + size * 0.15;
  const clipY = y + size * 0.2;
  const clipW = size * 0.7;
  const clipH = size * 0.75;

  doc.rect(clipX, clipY, clipW, clipH, 'S');

  // Clipboard clip at top
  const clipTopWidth = size * 0.35;
  const clipTopX = x + (size - clipTopWidth) / 2;
  doc.rect(clipTopX, y + size * 0.08, clipTopWidth, size * 0.18, 'S');

  // Checklist lines
  doc.line(clipX + size * 0.12, clipY + size * 0.25, clipX + clipW - size * 0.12, clipY + size * 0.25);
  doc.line(clipX + size * 0.12, clipY + size * 0.4, clipX + clipW - size * 0.12, clipY + size * 0.4);
  doc.line(clipX + size * 0.12, clipY + size * 0.55, clipX + clipW * 0.5, clipY + size * 0.55);
}

/**
 * Draw FileText icon (Lucide style) - for Documents/Tags
 */
function waDrawFileIcon(doc: jsPDF, x: number, y: number, size: number = 10): void {
  doc.setDrawColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setLineWidth(0.4);

  // Document outline
  const docX = x + size * 0.2;
  const docY = y + size * 0.1;
  const docW = size * 0.6;
  const docH = size * 0.8;
  const foldSize = size * 0.15;

  // Main rectangle (without top-right corner)
  doc.line(docX, docY, docX + docW - foldSize, docY);
  doc.line(docX + docW - foldSize, docY, docX + docW, docY + foldSize);
  doc.line(docX + docW, docY + foldSize, docX + docW, docY + docH);
  doc.line(docX + docW, docY + docH, docX, docY + docH);
  doc.line(docX, docY + docH, docX, docY);

  // Fold triangle
  doc.line(docX + docW - foldSize, docY, docX + docW - foldSize, docY + foldSize);
  doc.line(docX + docW - foldSize, docY + foldSize, docX + docW, docY + foldSize);

  // Text lines
  doc.line(docX + size * 0.1, docY + size * 0.3, docX + docW - size * 0.1, docY + size * 0.3);
  doc.line(docX + size * 0.1, docY + size * 0.45, docX + docW - size * 0.1, docY + size * 0.45);
  doc.line(docX + size * 0.1, docY + size * 0.6, docX + docW * 0.5, docY + size * 0.6);
}

/**
 * Draw checkmark icon
 */
function waDrawCheckIcon(doc: jsPDF, x: number, y: number, size: number = 10): void {
  doc.setDrawColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setLineWidth(size * 0.15);

  const cx = x + size / 2;
  const cy = y + size / 2;

  // Checkmark path
  doc.line(x + size * 0.2, cy, x + size * 0.4, y + size * 0.7);
  doc.line(x + size * 0.4, y + size * 0.7, x + size * 0.85, y + size * 0.25);
}

/**
 * Draw arrow up icon (improvement)
 */
function waDrawArrowUpIcon(doc: jsPDF, x: number, y: number, size: number = 10): void {
  doc.setFillColor(COLORS.accentGreen.r, COLORS.accentGreen.g, COLORS.accentGreen.b);

  const cx = x + size / 2;

  // Arrow shaft
  doc.rect(cx - size * 0.1, y + size * 0.4, size * 0.2, size * 0.5, 'F');

  // Arrow head
  doc.triangle(
    cx - size * 0.3, y + size * 0.45,
    cx + size * 0.3, y + size * 0.45,
    cx, y + size * 0.1,
    'F'
  );
}

/**
 * Draw circled number with modern style
 */
function waDrawCircledNumber(doc: jsPDF, num: number, x: number, y: number, radius: number = 5): void {
  // Gradient effect with two circles
  doc.setFillColor(COLORS.darkGreen.r, COLORS.darkGreen.g, COLORS.darkGreen.b);
  doc.circle(x, y, radius, 'F');
  doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.circle(x, y, radius * 0.9, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(radius * 1.8);
  doc.setFont('helvetica', 'bold');
  doc.text(num.toString(), x, y + 0.5, { align: 'center', baseline: 'middle' });
  doc.setTextColor(0, 0, 0);
}

/**
 * Draw modern progress bar with gradient effect
 */
function waDrawProgressBar(doc: jsPDF, x: number, y: number, width: number, height: number, segments: number, filled: number): void {
  const segmentWidth = (width - (segments - 1) * 1.5) / segments;
  const cornerRadius = height / 2;

  for (let i = 0; i < segments; i++) {
    const segX = x + i * (segmentWidth + 1.5);
    if (i < filled) {
      // Filled segment with gradient effect
      const intensity = 1 - (i * 0.08);
      doc.setFillColor(
        Math.round(COLORS.waGreen.r * intensity),
        Math.round(COLORS.waGreen.g * intensity),
        Math.round(COLORS.waGreen.b * intensity)
      );
    } else {
      doc.setFillColor(230, 230, 230);
    }
    doc.roundedRect(segX, y, segmentWidth, height, cornerRadius, cornerRadius, 'F');
  }
}

/**
 * Draw image placeholder with modern style
 */
function waDrawImagePlaceholder(doc: jsPDF, x: number, y: number, w: number, h: number): void {
  // Background
  doc.setFillColor(250, 250, 252);
  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(1);
  doc.roundedRect(x, y, w, h, 4, 4, 'FD');

  const iconSize = Math.min(w, h) * 0.3;
  const centerX = x + w / 2;
  const centerY = y + h / 2;

  // Image icon
  doc.setFillColor(200, 200, 205);
  doc.roundedRect(centerX - iconSize / 2, centerY - iconSize / 2, iconSize, iconSize, 2, 2, 'F');

  // Mountain shape
  doc.setFillColor(170, 170, 175);
  doc.triangle(
    centerX - iconSize * 0.35, centerY + iconSize * 0.3,
    centerX, centerY - iconSize * 0.1,
    centerX + iconSize * 0.35, centerY + iconSize * 0.3,
    'F'
  );

  // Sun circle
  doc.setFillColor(230, 230, 235);
  doc.circle(centerX + iconSize * 0.2, centerY - iconSize * 0.2, iconSize * 0.12, 'F');
}

/**
 * Draws a real image or placeholder
 */
async function waDrawImage(
  doc: jsPDF,
  imageUrl: string | null,
  x: number,
  y: number,
  w: number,
  h: number
): Promise<void> {
  if (!imageUrl) {
    waDrawImagePlaceholder(doc, x, y, w, h);
    return;
  }

  try {
    const base64 = await waFetchImageAsBase64(imageUrl);
    if (base64) {
      const format = waGetImageFormat(base64);
      doc.addImage(base64, format, x, y, w, h);
    } else {
      waDrawImagePlaceholder(doc, x, y, w, h);
    }
  } catch (error) {
    console.error('[PDF] Error adding image:', error);
    waDrawImagePlaceholder(doc, x, y, w, h);
  }
}

// ============ LOGO DRAWING ============

/**
 * Draw the new WA logo (horizontal full logo)
 */
async function waDrawLogo(doc: jsPDF, x: number, y: number, width: number = 45): Promise<void> {
  try {
    const logoUrl = window?.location?.origin
      ? `${window.location.origin}/wa-logo-full.png`
      : '/wa-logo-full.png';

    const base64 = await waFetchImageAsBase64(logoUrl);
    if (base64) {
      // Logo aspect ratio is approximately 2:1
      const height = width * 0.515;
      doc.addImage(base64, 'PNG', x, y, width, height);
      return;
    }
  } catch (e) {
    console.log('[PDF] Could not load logo, using fallback', e);
  }

  // Fallback: Draw WA circle logo with text
  waDrawLogoFallback(doc, x, y, width);
}

function waDrawLogoFallback(doc: jsPDF, x: number, y: number, width: number = 45): void {
  const circleSize = width * 0.35;
  const centerX = x + circleSize / 2;
  const centerY = y + circleSize / 2;

  // Green circle
  doc.setFillColor(34, 139, 34);
  doc.circle(centerX, centerY, circleSize / 2, 'F');

  // WA text inside circle
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(circleSize * 0.45);
  doc.setFont('helvetica', 'bold');
  doc.text('WA', centerX, centerY + 1, { align: 'center', baseline: 'middle' });

  // "Welding Alloys" text
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Welding', x + circleSize + 3, y + circleSize * 0.35);
  doc.text('Alloys', x + circleSize + 3, y + circleSize * 0.7);
}

// ============ SECTION CARD DRAWING ============

/**
 * Draw a modern card with shadow effect
 */
function waDrawCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  options?: {
    fill?: { r: number; g: number; b: number };
    border?: { r: number; g: number; b: number };
    shadow?: boolean;
    radius?: number;
  }
): void {
  const fill = options?.fill || { r: 255, g: 255, b: 255 };
  const border = options?.border || { r: 230, g: 230, b: 230 };
  const radius = options?.radius ?? 3;

  // Shadow effect
  if (options?.shadow !== false) {
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(x + 0.5, y + 0.5, w, h, radius, radius, 'F');
  }

  // Main card
  doc.setFillColor(fill.r, fill.g, fill.b);
  doc.setDrawColor(border.r, border.g, border.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, radius, radius, 'FD');
}

/**
 * Draw section header with icon
 */
function waDrawSectionHeader(
  doc: jsPDF,
  title: string,
  x: number,
  y: number,
  width: number,
  sectionNum?: number
): void {
  if (sectionNum !== undefined) {
    waDrawCircledNumber(doc, sectionNum, x + 5, y + 4, 4.5);
  }

  doc.setFontSize(11);
  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFont('helvetica', 'bold');
  doc.text(title, x + (sectionNum !== undefined ? 14 : 0), y + 6);
}

// ============ VISUAL COMPARISON SECTION ============

/**
 * Draw visual comparison between before and after solutions
 */
function waDrawVisualComparison(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  data: {
    previousLife?: string;
    expectedLife?: string;
    previousSolution?: string;
    problemDescription?: string;
    waSolution?: string;
    productCategory?: string;
    waProduct?: string;
    waProductDiameter?: string;
    productDescription?: string;
    competitorName?: string;
  }
): number {
  const halfWidth = (width - 15) / 2;
  const cardHeight = 40; // Slightly taller for more content

  // Title
  doc.setFontSize(9);
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFont('helvetica', 'bold');
  doc.text('SOLUTION COMPARISON', x, y + 4);
  y += 8;

  // BEFORE card (red tint)
  waDrawCard(doc, x, y, halfWidth, cardHeight, {
    fill: { r: 254, g: 242, b: 242 },
    border: { r: 252, g: 165, b: 165 },
  });

  doc.setFillColor(COLORS.red.r, COLORS.red.g, COLORS.red.b);
  doc.roundedRect(x, y, halfWidth, 7, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('BEFORE', x + halfWidth / 2, y + 5, { align: 'center' });

  // Competitor name if available
  let beforeTextY = y + 12;
  if (data.competitorName) {
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'italic');
    doc.text(`OEM: ${data.competitorName}`, x + 3, beforeTextY);
    beforeTextY += 5;
  }

  // Previous solution text - use problemDescription as fallback
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');

  const prevSolutionText = data.previousSolution || data.problemDescription || 'Not specified';
  const beforeText = doc.splitTextToSize(prevSolutionText, halfWidth - 6).slice(0, 2);
  doc.text(beforeText, x + 3, beforeTextY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.red.r, COLORS.red.g, COLORS.red.b);
  doc.text(`Service Life: ${data.previousLife || 'N/A'}`, x + 3, y + cardHeight - 4);

  // Arrow in middle
  const arrowX = x + halfWidth + 7.5;
  const arrowY = y + cardHeight / 2;
  doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.triangle(
    arrowX - 4, arrowY - 3,
    arrowX - 4, arrowY + 3,
    arrowX + 4, arrowY,
    'F'
  );

  // AFTER card (green tint)
  const afterX = x + halfWidth + 15;
  waDrawCard(doc, afterX, y, halfWidth, cardHeight, {
    fill: { r: 240, g: 253, b: 244 },
    border: { r: 134, g: 239, b: 172 },
  });

  doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.roundedRect(afterX, y, halfWidth, 7, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('AFTER (WA SOLUTION)', afterX + halfWidth / 2, y + 5, { align: 'center' });

  // WA Solution text
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');

  const waSolutionText = data.waSolution || 'WA Solution';
  const afterText = doc.splitTextToSize(waSolutionText, halfWidth - 6).slice(0, 2);
  doc.text(afterText, afterX + 3, y + 12);

  // Service life
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.text(`Service Life: ${data.expectedLife || 'Improved'}`, afterX + 3, y + cardHeight - 4);

  // Product badge - centered in card
  const productDisplay = waGetProductDisplay({
    productCategory: data.productCategory,
    waProduct: data.waProduct,
    waProductDiameter: data.waProductDiameter,
    productDescription: data.productDescription,
  });
  if (productDisplay) {
    doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    const productText = productDisplay;
    doc.setFontSize(6);
    const badgeWidth = doc.getTextWidth(productText) + 8;
    const badgeX = afterX + (halfWidth - badgeWidth) / 2; // Center badge in card
    doc.roundedRect(badgeX, y + cardHeight - 12, badgeWidth, 6, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(productText, afterX + halfWidth / 2, y + cardHeight - 8, { align: 'center' });
  }

  return y + cardHeight + 5;
}

// ============ FOOTER ============

function waDrawConfidentialFooter(doc: jsPDF, pageNum: number, totalPages: number, options?: PDFExportOptions): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const userName = options?.exportedByName || '[User Name]';
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Footer line
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);

  doc.setFontSize(7);
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.setFont('helvetica', 'normal');

  // Left: Internal use
  doc.text('Internal use only.', 10, pageHeight - 7);

  // Center: Confidential notice
  const footerText = `Confidential \u2013 Printed by ${userName} on ${dateStr}`;
  doc.text(footerText, pageWidth / 2, pageHeight - 7, { align: 'center' });

  // Right: Page number
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 10, pageHeight - 7, { align: 'right' });
}

// ============ PAGE 1: MAIN CASE STUDY ============

// Helper function to check if we need a new page and add it
// Footer starts at pageHeight - 10, so we need at least 20mm clearance from page bottom
async function waCheckAndAddPage(doc: jsPDF, currentY: number, margin: number, requiredSpace: number = 40): Promise<{ y: number; addedPage: boolean }> {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Footer clearance: minimum 20mm from page bottom
  const footerClearance = 20;
  const maxSafeY = pageHeight - footerClearance;

  // Check if rendering content with requiredSpace would exceed safe zone
  if (currentY + requiredSpace > maxSafeY) {
    doc.addPage();

    // Add header on new page
    doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    doc.rect(0, 0, pageWidth, 3, 'F');

    // Add logo
    await waDrawLogo(doc, pageWidth - 55, 5, 45);

    return { y: 28, addedPage: true };  // Start lower to avoid logo collision
  }

  return { y: currentY, addedPage: false };
}

async function waGeneratePage1(
  doc: jsPDF,
  data: CaseStudyPDFData,
  options?: PDFExportOptions,
  totalPages: number = 1
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  let y = 8;
  let pagesCreated = 1; // Start with 1 page

  // ===== HEADER =====
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 22, 'F');

  // Green accent bar at top
  doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.rect(0, 0, pageWidth, 3, 'F');

  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INDUSTRIAL CHALLENGE REPORT', margin, 16);

  // WA Logo on right
  await waDrawLogo(doc, pageWidth - 55, 5, 45);

  y = 26;

  // ===== TRANSLATION NOTICE =====
  if (data.originalLanguage && data.originalLanguage !== 'en') {
    doc.setFillColor(COLORS.yellow.r, COLORS.yellow.g, COLORS.yellow.b);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100, 80, 0);
    doc.text(
      `This ICA was originally written in ${data.originalLanguage.toUpperCase()}. You are viewing the translated version.`,
      margin + 3, y + 5
    );
    y += 10;
  }

  // ===== CASE TYPE TABS =====
  doc.setFontSize(9);
  const types = [
    { label: 'Application ICA', type: 'APPLICATION', color: COLORS.waGreen },
    { label: 'Tech ICA', type: 'TECH', color: COLORS.purple },
    { label: 'Star ICA', type: 'STAR', color: COLORS.starYellow },
  ];

  const hasWpsData = data.wps?.process || data.wps?.weldingPosition || data.wps?.shieldingGas;
  const highlightedTypes: string[] = ['APPLICATION'];

  if (data.type === 'TECH') {
    highlightedTypes.push('TECH');
  } else if (data.type === 'STAR') {
    if (hasWpsData) {
      highlightedTypes.push('TECH', 'STAR');
    } else {
      highlightedTypes.push('STAR');
    }
  }

  let tabX = margin;
  types.forEach(({ label, type, color }, idx) => {
    const isActive = highlightedTypes.includes(type);
    const textWidth = doc.getTextWidth(label);

    if (isActive) {
      doc.setTextColor(color.r, color.g, color.b);
      doc.setFont('helvetica', 'bold');
      doc.setDrawColor(color.r, color.g, color.b);
      doc.setLineWidth(1.5);
      doc.line(tabX, y + 7, tabX + textWidth, y + 7);
    } else {
      doc.setTextColor(180, 180, 180);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(label, tabX, y + 4);

    if (idx < types.length - 1) {
      tabX += textWidth + 6;
      doc.setTextColor(200, 200, 200);
      doc.text('|', tabX, y + 4);
      tabX += 8;
    }
  });

  y += 14;

  // ===== METADATA CARD =====
  waDrawCard(doc, margin, y, pageWidth - margin * 2, 18, {
    fill: { r: 250, g: 250, b: 252 },
  });

  doc.setFontSize(7);
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.setFont('helvetica', 'normal');

  // Row 1
  await waDrawIcon(doc, 'user', margin + 3, y + 2, 6);
  doc.text('Written by:', margin + 10, y + 6);
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFont('helvetica', 'bold');
  doc.text(data.contributor.name, margin + 28, y + 6);

  await waDrawIcon(doc, 'calendar', margin + 85, y + 2, 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.text('Approved:', margin + 92, y + 6);
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFont('helvetica', 'bold');
  const approvalText = data.approvedAt
    ? `${waFormatDate(data.approvedAt)}${data.approver ? ' by ' + data.approver.name : ''}`
    : 'Pending';
  doc.text(approvalText, margin + 108, y + 6);

  // Row 2
  await waDrawIcon(doc, 'calendar', margin + 3, y + 10, 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.text('Job Date:', margin + 10, y + 14);
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFont('helvetica', 'bold');
  doc.text(waFormatDate(data.jobDate || data.createdAt) || 'N/A', margin + 28, y + 14);

  await waDrawIcon(doc, 'file-text', margin + 85, y + 10, 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.text('Revision:', margin + 92, y + 14);
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFont('helvetica', 'bold');
  doc.text(data.revision || 'V1', margin + 108, y + 14);

  y += 22;

  // ===== SECTION 1: BASIC INFORMATION =====
  waDrawSectionHeader(doc, 'BASIC INFORMATION', margin, y, pageWidth - margin * 2, 1);
  y += 10;

  // Overview (General Description) - if available
  if (data.generalDescription) {
    doc.setFontSize(7);
    const overviewLines = doc.splitTextToSize(data.generalDescription, pageWidth - margin * 2 - 8);
    const numLines = Math.min(overviewLines.length, 6);
    const cardHeight = numLines * 3.5 + 12;

    waDrawCard(doc, margin, y, pageWidth - margin * 2, cardHeight);

    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFont('helvetica', 'bold');
    doc.text('Overview', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.text(overviewLines.slice(0, 6), margin + 4, y + 9);

    y += cardHeight + 4;
  }

  // Two-column grid for basic info fields
  const colWidth = (pageWidth - margin * 2 - 4) / 2;
  let leftY = y;
  let rightY = y;

  // Helper function to draw a field with icon
  const waDrawField = async (xPos: number, yPos: number, label: string, value: string, iconName?: string) => {
    if (iconName) {
      await waDrawIcon(doc, iconName, xPos, yPos, 4);
      xPos += 6;
    }

    doc.setFontSize(6);
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFont('helvetica', 'normal');
    doc.text(label, xPos, yPos + 2);

    doc.setFontSize(7);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'bold');
    const valueLines = doc.splitTextToSize(value, colWidth - 10);
    doc.text(valueLines.slice(0, 2), xPos, yPos + 6);

    return yPos + (valueLines.length > 1 ? 10 : 8);
  };

  // Left column
  leftY = await waDrawField(margin, leftY, 'Industry', data.industry || 'N/A', 'building-2');
  leftY = await waDrawField(margin, leftY, 'Component/Workpiece', data.componentWorkpiece || 'N/A', 'package');
  if (data.jobType) {
    const jobTypeDisplay = waFormatJobType(data.jobType, data.jobTypeOther);
    leftY = await waDrawField(margin, leftY, 'Job Type', jobTypeDisplay, 'clipboard');
  }
  if (data.baseMetal) {
    leftY = await waDrawField(margin, leftY, 'Base Metal', data.baseMetal);
  }

  // Right column
  const rightX = margin + colWidth + 4;
  rightY = await waDrawField(rightX, rightY, 'Location', `${data.location}${data.country ? ', ' + data.country : ''}`, 'map-pin');
  rightY = await waDrawField(rightX, rightY, 'Work Type', data.workType || 'N/A', 'wrench');
  if (data.oem) {
    rightY = await waDrawField(rightX, rightY, 'OEM', data.oem, 'package');
  }
  if (data.generalDimensions) {
    const unitLabel = data.unitSystem === 'IMPERIAL' ? 'inches' : 'mm';
    rightY = await waDrawField(rightX, rightY, `General Dimensions (${unitLabel})`, data.generalDimensions);
  }

  y = Math.max(leftY, rightY) + 4;

  // Check if we need a new page before Wear Type Analysis
  const pageCheckWearType = await waCheckAndAddPage(doc, y, margin, 30);
  y = pageCheckWearType.y;
  if (pageCheckWearType.addedPage) pagesCreated++;

  // ===== WEAR TYPE ANALYSIS (part of Basic Information) =====
  doc.setFontSize(7);
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.setFont('helvetica', 'bold');
  doc.text('Type of Wear', margin, y + 2);
  y += 6;

  // Standard wear types (matches FALLBACK_WEAR_TYPES in wear-type-progress-bar.tsx)
  const standardWearTypes = [
    { name: 'Abrasion', key: 'ABRASION' },
    { name: 'Impact', key: 'IMPACT' },
    { name: 'Metal-metal', key: 'METAL_METAL' },
    { name: 'Temperature', key: 'TEMPERATURE' },
    { name: 'Corrosion', key: 'CORROSION' },
  ];

  // DEBUG: Log wear type data
  console.log('=== PDF EXPORT WEAR TYPE DEBUG ===');
  console.log('wearType array from data:', data.wearType);
  console.log('wearSeverities from data:', data.wearSeverities);
  console.log('wearTypeOthers from data:', data.wearTypeOthers);
  console.log('Full data object keys:', Object.keys(data));

  doc.setFontSize(7);

  // Define width for wear type progress bars
  const wearColWidth = (pageWidth - margin * 2) * 0.6;

  // Filter to show only selected standard wear types
  const selectedStandardTypes = standardWearTypes.filter(wt =>
    data.wearType.some(w => w.toUpperCase() === wt.key)
  );

  // Render selected standard wear types
  selectedStandardTypes.forEach((wt, idx) => {
    const rowY = y + idx * 5.5;
    const severity = data.wearSeverities?.[wt.key] || 4;

    // DEBUG: Log each wear type processing
    console.log(`${wt.name} (${wt.key}):`, {
      severity,
      inArray: data.wearType.filter(w => w.toUpperCase() === wt.key),
    });

    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'bold');
    doc.text(wt.name, margin, rowY + 3);
    waDrawProgressBar(doc, margin + 25, rowY, wearColWidth - 30, 4, 5, severity);
  });

  // Render custom "Other" wear types from wearTypeOthers array
  if (data.wearTypeOthers && data.wearTypeOthers.length > 0) {
    data.wearTypeOthers.forEach((other, idx) => {
      const rowY = y + (selectedStandardTypes.length + idx) * 5.5;
      console.log(`Custom wear type: ${other.name}`, { severity: other.severity });

      doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
      doc.setFont('helvetica', 'bold');
      doc.text(other.name, margin, rowY + 3);
      waDrawProgressBar(doc, margin + 25, rowY, wearColWidth - 30, 4, 5, other.severity);
    });
  }

  // Calculate total wear types count for spacing
  const totalWearTypes = selectedStandardTypes.length + (data.wearTypeOthers?.length || 0);
  y += totalWearTypes * 5.5 + 10;

  // Check if we need a new page before Section 2
  const pageCheckSec2 = await waCheckAndAddPage(doc, y, margin, 50);
  y = pageCheckSec2.y;
  if (pageCheckSec2.addedPage) pagesCreated++;

  // ===== SECTION 2: PROBLEM DESCRIPTION =====
  waDrawSectionHeader(doc, 'PROBLEM DESCRIPTION', margin, y, pageWidth - margin * 2, 2);
  y += 10;

  // Main problem description - render all text, no truncation
  const problemLines = doc.splitTextToSize(data.problemDescription, pageWidth - margin * 2 - 8);
  const problemHeight = problemLines.length * 3.5 + 12;

  waDrawCard(doc, margin, y, pageWidth - margin * 2, problemHeight);

  doc.setFontSize(7);
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFont('helvetica', 'normal');
  doc.text(problemLines, margin + 4, y + 5);

  y += problemHeight + 6;

  // Check if we need a new page after problem description
  const pageCheckAfterProb = await waCheckAndAddPage(doc, y, margin);
  y = pageCheckAfterProb.y;
  if (pageCheckAfterProb.addedPage) pagesCreated++;

  // Two-column layout for additional problem details
  const probColWidth = (pageWidth - margin * 2 - 4) / 2;
  let probLeftY = y;
  let probRightY = y;

  // Left column - Previous Solution
  if (data.previousSolution) {
    doc.setFontSize(6);
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFont('helvetica', 'bold');
    doc.text('Previous Solution', margin, probLeftY);

    doc.setFontSize(7);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'normal');
    const prevSolLines = doc.splitTextToSize(data.previousSolution, probColWidth - 4);
    doc.text(prevSolLines, margin, probLeftY + 4);
    probLeftY += prevSolLines.length * 3.5 + 6;
  }

  // Left column - Previous Service Life
  if (data.previousServiceLife) {
    doc.setFontSize(6);
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFont('helvetica', 'bold');
    doc.text('Previous Service Life', margin, probLeftY);

    doc.setFontSize(7);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'bold');
    doc.text(data.previousServiceLife, margin, probLeftY + 4);
    probLeftY += 8;
  }

  // Right column - Competitor
  if (data.competitorName) {
    const probRightX = margin + probColWidth + 4;
    doc.setFontSize(6);
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFont('helvetica', 'bold');
    doc.text('Competitor', probRightX, probRightY);

    doc.setFontSize(7);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'bold');
    doc.text(data.competitorName, probRightX, probRightY + 4);
    probRightY += 8;
  }

  y = Math.max(probLeftY, probRightY) + 4;

  // Check if we need a new page before Section 3
  const pageCheckSec3 = await waCheckAndAddPage(doc, y, margin, 50);
  y = pageCheckSec3.y;
  if (pageCheckSec3.addedPage) pagesCreated++;

  // ===== SECTION 3: WELDING ALLOYS SOLUTION =====
  waDrawSectionHeader(doc, 'WELDING ALLOYS SOLUTION', margin, y, pageWidth - margin * 2, 3);
  y += 10;

  // Main solution description - render all text, no truncation
  const solutionLines = doc.splitTextToSize(data.waSolution, pageWidth - margin * 2 - 8);
  const solutionHeight = solutionLines.length * 3.5 + 12;

  waDrawCard(doc, margin, y, pageWidth - margin * 2, solutionHeight);

  doc.setFontSize(7);
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFont('helvetica', 'normal');
  doc.text(solutionLines, margin + 4, y + 5);

  y += solutionHeight + 6;

  // Check if we need a new page after solution description
  const pageCheckAfterSol = await waCheckAndAddPage(doc, y, margin);
  y = pageCheckAfterSol.y;
  if (pageCheckAfterSol.addedPage) pagesCreated++;

  // Two-column layout for solution details
  const solColWidth = (pageWidth - margin * 2 - 4) / 2;
  let solLeftY = y;
  let solRightY = y;

  // Left column - Product Category (if available)
  if (data.productCategory) {
    doc.setFontSize(6);
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFont('helvetica', 'normal');
    doc.text('Product Category', margin, solLeftY);

    doc.setFontSize(7);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'bold');
    const productCategory = waFormatProductCategory(data.productCategory, data.productCategoryOther);
    doc.text(productCategory, margin, solLeftY + 4);
    solLeftY += 8;
  }

  // Left column - WA Product Used (prominent display)
  const productDisplay = waGetProductDisplay({
    productCategory: data.productCategory,
    waProduct: data.waProduct,
    waProductDiameter: data.waProductDiameter,
    productDescription: data.productDescription,
  });

  doc.setFontSize(6);
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.setFont('helvetica', 'normal');
  doc.text('WA Product Used', margin, solLeftY);

  doc.setFontSize(8);
  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFont('helvetica', 'bold');
  const productLines = doc.splitTextToSize(productDisplay, solColWidth - 4);
  doc.text(productLines, margin, solLeftY + 5);
  solLeftY += productLines.length * 4 + 6;

  // Left column - Job Duration (if available)
  const duration = [
    data.jobDurationYears && `${data.jobDurationYears}y`,
    data.jobDurationMonths && `${data.jobDurationMonths}mo`,
    data.jobDurationWeeks && `${data.jobDurationWeeks}w`,
    data.jobDurationDays && `${data.jobDurationDays}d`,
    data.jobDurationHours && `${data.jobDurationHours}h`,
  ].filter(Boolean).join(' ');

  if (duration) {
    doc.setFontSize(6);
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFont('helvetica', 'normal');
    doc.text('Job Duration', margin, solLeftY);

    doc.setFontSize(7);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'bold');
    doc.text(duration, margin, solLeftY + 4);
    solLeftY += 8;
  }

  // Right column - Technical Advantages (if available)
  const solRightX = margin + solColWidth + 4;
  if (data.technicalAdvantages) {
    doc.setFontSize(6);
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFont('helvetica', 'normal');
    doc.text('Technical Advantages', solRightX, solRightY);

    doc.setFontSize(7);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'normal');
    const techAdvLines = doc.splitTextToSize(data.technicalAdvantages, solColWidth - 4);
    doc.text(techAdvLines, solRightX, solRightY + 4);
    solRightY += techAdvLines.length * 3.5 + 6;
  }

  // Right column - Expected/Achieved Service Life (if available)
  if (data.expectedServiceLife) {
    doc.setFontSize(6);
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFont('helvetica', 'normal');
    doc.text('Expected/Achieved Service Life', solRightX, solRightY);

    doc.setFontSize(7);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'bold');
    doc.text(data.expectedServiceLife, solRightX, solRightY + 4);
    solRightY += 8;
  }

  y = Math.max(solLeftY, solRightY) + 4;

  // ===== SECTION 4: FINANCIAL IMPACT (APPLICATION & TECH only) =====
  if ((data.type === 'APPLICATION' || data.type === 'TECH') &&
      (data.solutionValueRevenue || data.annualPotentialRevenue || data.customerSavingsAmount)) {
    // Check if we need a new page before financial section
    const pageCheck1 = await waCheckAndAddPage(doc, y, margin);
    y = pageCheck1.y;
    if (pageCheck1.addedPage) pagesCreated++;

    waDrawSectionHeader(doc, 'FINANCIAL IMPACT', margin, y, pageWidth - margin * 2, 4);
    y += 10;

    // Three-column layout for financial metrics
    const finColWidth = (pageWidth - margin * 2 - 8) / 3;
    let finX = margin;

    // Solution Value/Revenue
    if (data.solutionValueRevenue) {
      doc.setFontSize(6);
      doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
      doc.setFont('helvetica', 'normal');
      doc.text('Solution Value/Revenue', finX, y);

      doc.setFontSize(11);
      doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
      doc.setFont('helvetica', 'bold');
      doc.text(
        waFormatCurrency(data.solutionValueRevenue, data.revenueCurrency),
        finX, y + 7
      );
      finX += finColWidth + 4;
    }

    // Annual Potential Revenue
    if (data.annualPotentialRevenue) {
      doc.setFontSize(6);
      doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
      doc.setFont('helvetica', 'normal');
      doc.text('Annual Potential Revenue', finX, y);

      doc.setFontSize(11);
      doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
      doc.setFont('helvetica', 'bold');
      doc.text(
        waFormatCurrency(data.annualPotentialRevenue, data.revenueCurrency),
        finX, y + 7
      );
      finX += finColWidth + 4;
    }

    // Customer Savings
    if (data.customerSavingsAmount) {
      doc.setFontSize(6);
      doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
      doc.setFont('helvetica', 'normal');
      doc.text('Customer Savings', finX, y);

      doc.setFontSize(11);
      doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
      doc.setFont('helvetica', 'bold');
      doc.text(
        waFormatCurrency(data.customerSavingsAmount, data.revenueCurrency),
        finX, y + 7
      );
    }

    y += 14;
  }

  // ===== SECTION 5: SUPPORTING DOCUMENTS (if available) =====
  if (data.supportingDocs && data.supportingDocs.length > 0) {
    // Check if we need a new page before supporting documents section
    const pageCheck2 = await waCheckAndAddPage(doc, y, margin);
    y = pageCheck2.y;
    if (pageCheck2.addedPage) pagesCreated++;

    waDrawSectionHeader(doc, `SUPPORTING DOCUMENTS (${data.supportingDocs.length})`, margin, y, pageWidth - margin * 2, 5);
    y += 8;

    doc.setFontSize(6);
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFont('helvetica', 'normal');
    doc.text('Technical documents and files attached to this ICA', margin, y);
    y += 6;

    // List documents
    data.supportingDocs.forEach((docUrl, index) => {
      const fileName = decodeURIComponent(docUrl.split('/').pop()?.split('?')[0] || 'Document');

      doc.setFontSize(7);
      doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
      doc.setFont('helvetica', 'normal');
      doc.text(`${index + 1}. ${fileName}`, margin + 2, y);
      y += 4;
    });

    y += 4;
  }

  // ===== COST REDUCTION ANALYSIS (STAR only) =====
  if (data.type === 'STAR' && data.costCalculator) {
    // Check if we need a new page before cost calculator
    const pageCheckCost = await waCheckAndAddPage(doc, y, margin, 100);
    y = pageCheckCost.y;
    if (pageCheckCost.addedPage) pagesCreated++;

    const cc = data.costCalculator;
    const displayCostBefore = cc.totalCostBefore || 0;
    const displayCostAfter = cc.totalCostAfter || 0;
    const displaySavings = cc.annualSavings || 0;
    const displaySavingsPercent = cc.savingsPercentage || 0;

    waDrawSectionHeader(doc, 'COST REDUCTION ANALYSIS', margin, y, pageWidth - margin * 2, 4);
    y += 10;

    // 3 Summary Cards Layout - Subtle styling
    const cardWidth = (pageWidth - margin * 2 - 8) / 3;
    const cardHeight = 22;

    // Card 1: Annual Cost Before
    waDrawCard(doc, margin, y, cardWidth, cardHeight, {
      fill: { r: 249, g: 250, b: 251 }, // Subtle gray
    });
    doc.setFontSize(7);
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFont('helvetica', 'bold');
    doc.text('Annual Cost Before', margin + cardWidth / 2, y + 5, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38); // red-600 for amount only
    doc.setFont('helvetica', 'bold');
    doc.text(waFormatCurrency(displayCostBefore, cc.currency), margin + cardWidth / 2, y + 14, { align: 'center' });

    // Card 2: Annual Cost After
    const card2X = margin + cardWidth + 4;
    waDrawCard(doc, card2X, y, cardWidth, cardHeight, {
      fill: { r: 249, g: 250, b: 251 }, // Subtle gray
    });
    doc.setFontSize(7);
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFont('helvetica', 'bold');
    doc.text('Annual Cost After', card2X + cardWidth / 2, y + 5, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(22, 163, 74); // green-600 for amount only
    doc.setFont('helvetica', 'bold');
    doc.text(waFormatCurrency(displayCostAfter, cc.currency), card2X + cardWidth / 2, y + 14, { align: 'center' });

    // Card 3: Annual Savings (highlighted)
    const card3X = margin + (cardWidth + 4) * 2;
    waDrawCard(doc, card3X, y, cardWidth, cardHeight, {
      fill: { r: 240, g: 253, b: 244 }, // Light green for emphasis
      border: { r: COLORS.waGreen.r, g: COLORS.waGreen.g, b: COLORS.waGreen.b },
    });
    doc.setFontSize(7);
    doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    doc.setFont('helvetica', 'bold');
    doc.text('Annual Savings', card3X + cardWidth / 2, y + 5, { align: 'center' });
    doc.setFontSize(13);
    doc.text(waFormatCurrency(displaySavings, cc.currency), card3X + cardWidth / 2, y + 14, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`${displaySavingsPercent.toFixed(1)}% reduction`, card3X + cardWidth / 2, y + 20, { align: 'center' });

    y += cardHeight + 6;

    // Visual Cost Comparison Bars
    const barSectionHeight = 30;
    waDrawCard(doc, margin, y, pageWidth - margin * 2, barSectionHeight, {
      fill: { r: 249, g: 250, b: 251 },
    });

    doc.setFontSize(8);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'bold');
    doc.text('Annual Cost Comparison', margin + 4, y + 5);

    // Calculate bar widths - leave space for labels
    const maxCost = Math.max(displayCostBefore, displayCostAfter);
    const oldWidth = maxCost > 0 ? (displayCostBefore / maxCost) * 100 : 50;
    const waWidth = maxCost > 0 ? (displayCostAfter / maxCost) * 100 : 50;
    const labelWidth = 35; // Space for "Old Solution" / "WA Solution"
    const valueWidth = 45; // Space for currency values on right
    const barStartX = margin + 4 + labelWidth;
    const barMaxWidth = pageWidth - margin * 2 - labelWidth - valueWidth - 12;

    // Old Solution Bar
    doc.setFontSize(6.5);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'normal');
    doc.text('Old Solution', margin + 4, y + 13);

    // Background bar
    doc.setFillColor(229, 231, 235); // gray-200
    doc.roundedRect(barStartX, y + 10, barMaxWidth, 5, 2, 2, 'F');
    // Actual bar
    doc.setFillColor(239, 68, 68); // red-500
    doc.roundedRect(barStartX, y + 10, (barMaxWidth * oldWidth) / 100, 5, 2, 2, 'F');

    // Value on right
    doc.setFontSize(6.5);
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text(waFormatCurrency(displayCostBefore, cc.currency), pageWidth - margin - 4, y + 13, { align: 'right' });

    // WA Solution Bar
    doc.setFontSize(6.5);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'normal');
    doc.text('WA Solution', margin + 4, y + 24);

    // Background bar
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(barStartX, y + 21, barMaxWidth, 5, 2, 2, 'F');
    // Actual bar
    doc.setFillColor(34, 197, 94); // green-500
    doc.roundedRect(barStartX, y + 21, (barMaxWidth * waWidth) / 100, 5, 2, 2, 'F');

    // Value on right
    doc.setTextColor(22, 163, 74);
    doc.setFont('helvetica', 'bold');
    doc.text(waFormatCurrency(displayCostAfter, cc.currency), pageWidth - margin - 4, y + 24, { align: 'right' });

    y += barSectionHeight + 6;

    // Check page break before detailed breakdown
    const pageCheckDetail = await waCheckAndAddPage(doc, y, margin, 60);
    y = pageCheckDetail.y;
    if (pageCheckDetail.addedPage) pagesCreated++;

    // Detailed Breakdown - 2 columns
    const detailCardWidth = (pageWidth - margin * 2 - 4) / 2;
    const detailCardHeight = 45;

    // Left: Part Information & Lifetime
    waDrawCard(doc, margin, y, detailCardWidth, detailCardHeight, {
      fill: { r: 249, g: 250, b: 251 },
    });

    doc.setFontSize(8);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'bold');
    doc.text('Part Information', margin + 4, y + 5);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    let detailY = y + 10;

    const partInfo = [
      { label: 'Cost of Part (A):', value: waFormatCurrency(cc.costOfPart || 0, cc.currency) },
      { label: 'Cost of WA Solution (B):', value: waFormatCurrency(cc.costOfWaSolution || 0, cc.currency) },
      { label: 'Parts Used/Year (E):', value: cc.partsUsedPerYear ? String(cc.partsUsedPerYear) : '-' },
    ];

    partInfo.forEach((item) => {
      doc.setTextColor(107, 114, 128); // gray-500
      doc.text(item.label, margin + 4, detailY);
      doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, margin + detailCardWidth - 4, detailY, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      detailY += 5;
    });

    // Lifetime comparison in same card
    detailY += 3;
    doc.setFontSize(8);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'bold');
    doc.text('Solution Lifetime', margin + 4, detailY);
    detailY += 5;

    doc.setFontSize(6.5);
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'normal');
    doc.text('Old Solution:', margin + 4, detailY);
    doc.setFont('helvetica', 'bold');
    const oldDays = cc.oldSolutionLifetimeDays || 0;
    const oldLifetimeStr = oldDays >= 365 ? `${(oldDays / 365).toFixed(1)}y` : `${oldDays}d`;
    doc.text(oldLifetimeStr, margin + detailCardWidth - 4, detailY, { align: 'right' });
    detailY += 4;

    doc.setTextColor(22, 163, 74);
    doc.setFont('helvetica', 'normal');
    doc.text('WA Solution:', margin + 4, detailY);
    doc.setFont('helvetica', 'bold');
    const waDays = cc.waSolutionLifetimeDays || 0;
    const waLifetimeStr = waDays >= 365 ? `${(waDays / 365).toFixed(1)}y` : `${waDays}d`;
    doc.text(waLifetimeStr, margin + detailCardWidth - 4, detailY, { align: 'right' });

    // Right: Event Costs (Before & After)
    const rightCardX = margin + detailCardWidth + 4;
    waDrawCard(doc, rightCardX, y, detailCardWidth, detailCardHeight, {
      fill: { r: 249, g: 250, b: 251 },
    });

    doc.setFontSize(8);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'bold');
    doc.text('Event Costs', rightCardX + 4, y + 5);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    let eventY = y + 10;

    const eventCosts = [
      { label: 'Maintenance/Repair (F):', before: cc.maintenanceRepairCost, after: (cc.maintenanceRepairCost || 0) * 0.5 },
      { label: 'Disassembly Cost (G):', before: cc.disassemblyCost, after: (cc.disassemblyCost || 0) * 0.5 },
      { label: 'Downtime/Event (H):', before: cc.downtimeCost, after: (cc.downtimeCost || 0) * 0.5 },
    ];

    eventCosts.forEach((item) => {
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      doc.text(item.label, rightCardX + 4, eventY);
      eventY += 4;

      // Before / After side by side to save space
      doc.setFontSize(6);
      doc.setTextColor(220, 38, 38);
      doc.text('Before:', rightCardX + 6, eventY);
      doc.setFont('helvetica', 'bold');
      const beforeValue = waFormatCurrency(item.before || 0, cc.currency);
      // Limit value width to prevent overflow
      const maxValueWidth = detailCardWidth / 2 - 10;
      doc.text(beforeValue, rightCardX + 20, eventY, { maxWidth: maxValueWidth });

      doc.setTextColor(22, 163, 74);
      doc.setFont('helvetica', 'normal');
      doc.text('After:', rightCardX + detailCardWidth / 2 + 2, eventY);
      doc.setFont('helvetica', 'bold');
      const afterValue = waFormatCurrency(item.after, cc.currency);
      doc.text(afterValue, rightCardX + detailCardWidth / 2 + 16, eventY, { maxWidth: maxValueWidth });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      eventY += 5;
    });

    y += detailCardHeight + 6;

    // Extra Benefits
    if (cc.extraBenefits) {
      const benefitLines = doc.splitTextToSize(cc.extraBenefits, pageWidth - margin * 2 - 8);
      const benefitHeight = benefitLines.length * 3.5 + 10;

      waDrawCard(doc, margin, y, pageWidth - margin * 2, benefitHeight, {
        fill: { r: 249, g: 250, b: 251 }, // Subtle gray background
        border: { r: 229, g: 231, b: 235 }, // Subtle gray border
      });
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128); // gray-500
      doc.setFont('helvetica', 'bold');
      doc.text('ADDITIONAL BENEFITS', margin + 4, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81); // gray-700 for content
      doc.text(benefitLines, margin + 4, y + 11);
      y += benefitHeight + 4;
    }
  }

  // ===== WELDING PROCEDURE SPECIFICATION =====
  if ((data.type === 'TECH' || data.type === 'STAR') && data.wps) {
    // Check if we need a new page before WPS
    const pageCheckWPS = await waCheckAndAddPage(doc, y, margin, 70);
    y = pageCheckWPS.y;
    if (pageCheckWPS.addedPage) pagesCreated++;

    const sectionNum = data.type === 'STAR' && data.costCalculator ? 5 : 4;
    const wps = data.wps;

    waDrawSectionHeader(doc, 'WELDING PROCEDURE SPECIFICATION', margin, y, pageWidth - margin * 2, sectionNum);
    y += 12;

    // Base Metal Section
    waDrawCard(doc, margin, y, pageWidth - margin * 2, 20, {
      fill: { r: 249, g: 250, b: 251 },
    });
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81); // gray-700
    doc.setFont('helvetica', 'bold');
    doc.text('Base Metal', margin + 4, y + 6);

    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.setFont('helvetica', 'normal');

    const baseMetalItems = [
      `Type: ${wps.baseMetalType || '-'}`,
      `Surface Prep: ${wps.surfacePreparation || '-'}`,
    ];
    baseMetalItems.forEach((item, idx) => {
      doc.text(item, margin + 4, y + 12 + idx * 5);
    });

    y += 24;

    // Welding Layers Section
    const layers = wps.layers || [];
    const hasLayers = layers && layers.length > 0;

    if (hasLayers) {
      // Title for layers
      doc.setFontSize(8);
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'bold');
      doc.text(`Welding Layers (${layers.length})`, margin, y);
      y += 6;

      // Render each layer
      for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
        const layer = layers[layerIndex];

        // Calculate actual layer card height based on content
        const hasOscillation = layer.oscillationAmplitude || layer.oscillationPeriod || layer.oscillationTempos;
        const layerCardHeight = hasOscillation ? 65 : 55;

        // Check if we need a new page with correct required space
        const layerCheck = await waCheckAndAddPage(doc, y, margin, layerCardHeight + 5);
        y = layerCheck.y;
        if (layerCheck.addedPage) pagesCreated++;

        waDrawCard(doc, margin, y, pageWidth - margin * 2, layerCardHeight, {
          fill: { r: 249, g: 250, b: 251 },
          border: { r: 209, g: 213, b: 219 },
        });

        // Layer header
        doc.setFontSize(7.5);
        doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
        doc.setFont('helvetica', 'bold');
        const layerTitle = `Layer ${layerIndex + 1}${layer.waProductName ? ` - ${layer.waProductName}` : ''}`;
        doc.text(layerTitle, margin + 4, y + 6);

        // WA Consumables subsection
        doc.setFontSize(6.5);
        doc.setTextColor(75, 85, 99); // gray-600
        doc.setFont('helvetica', 'bold');
        doc.text('WA Consumables', margin + 4, y + 12);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128); // gray-500
        const consumables = [
          `Product: ${layer.waProductName || '-'}`,
          `Diameter: ${layer.waProductDiameter ? layer.waProductDiameter + ' mm' : '-'}`,
          `Process: ${layer.weldingProcess || '-'}`,
          `Technique: ${layer.technique || '-'}`,
          `Position: ${layer.weldingPosition || '-'}`,
          `Torch: ${layer.torchAngle || '-'}`,
        ];

        // Display in 3 columns
        const colWidth = (pageWidth - margin * 2 - 8) / 3;
        consumables.forEach((item, idx) => {
          const col = idx % 3;
          const row = Math.floor(idx / 3);
          doc.text(item, margin + 4 + col * colWidth, y + 17 + row * 4, { maxWidth: colWidth - 2 });
        });

        // WA Parameters subsection
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(75, 85, 99);
        doc.text('WA Parameters', margin + 4, y + 28);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        const parameters = [
          `Stick-out: ${layer.stickOut ? layer.stickOut + ' mm' : '-'}`,
          `Current: ${layer.currentType || '-'}`,
          `Mode: ${layer.currentModeSynergy || '-'}`,
          `Wire Speed: ${layer.wireFeedSpeed ? layer.wireFeedSpeed + ' m/min' : '-'}`,
          `Intensity: ${layer.intensity ? layer.intensity + ' A' : '-'}`,
          `Voltage: ${layer.voltage ? layer.voltage + ' V' : '-'}`,
          `Welding Speed: ${layer.travelSpeed ? layer.travelSpeed + ' cm/min' : '-'}`,
        ];

        // Display in 4 columns
        const paramColWidth = (pageWidth - margin * 2 - 8) / 4;
        parameters.forEach((item, idx) => {
          const col = idx % 4;
          const row = Math.floor(idx / 4);
          doc.text(item, margin + 4 + col * paramColWidth, y + 33 + row * 4, { maxWidth: paramColWidth - 2 });
        });

        // Oscillation Details (if present)
        if (layer.oscillationAmplitude || layer.oscillationPeriod || layer.oscillationTempos) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(75, 85, 99);
          doc.text('Oscillation', margin + 4, y + 44);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(107, 114, 128);
          const oscillation = [
            layer.oscillationAmplitude ? `Amplitude: ${layer.oscillationAmplitude} mm` : '',
            layer.oscillationPeriod ? `Period: ${layer.oscillationPeriod} s` : '',
            layer.oscillationTempos ? `Tempos: ${layer.oscillationTempos} s` : '',
          ].filter(Boolean);

          oscillation.forEach((item, idx) => {
            doc.text(item, margin + 4 + idx * 60, y + 49);
          });
        }

        y += layerCardHeight + 4;
      }
    } else {
      // Legacy single-layer display (if no layers array exists)
      const legacyHeight = 25;
      waDrawCard(doc, margin, y, pageWidth - margin * 2, legacyHeight, {
        fill: { r: 249, g: 250, b: 251 },
      });

      doc.setFontSize(7);
      doc.setTextColor(75, 85, 99);
      doc.setFont('helvetica', 'bold');
      doc.text('WA Product & Parameters', margin + 4, y + 6);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);

      const legacyData = [
        `Product: ${wps.productName || '-'}`,
        `Process: ${wps.process || '-'}`,
        `Current: ${wps.currentType || '-'}`,
        `Intensity: ${wps.intensity || '-'}`,
        `Voltage: ${wps.voltage || '-'}`,
        `Position: ${wps.weldingPosition || '-'}`,
      ];

      const legacyColWidth = (pageWidth - margin * 2 - 8) / 3;
      legacyData.forEach((item, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        doc.text(item, margin + 4 + col * legacyColWidth, y + 12 + row * 5);
      });

      y += legacyHeight + 4;
    }

    // Heating Procedure Section
    if (wps.preheatingTemp || wps.interpassTemp || wps.postheatingTemp ||
        wps.preheatTemperature || wps.interpassTemperature || wps.postheatTemperature) {
      // Check if we need a new page before Heating Procedure
      const heatingCheck = await waCheckAndAddPage(doc, y, margin, 25);
      y = heatingCheck.y;
      if (heatingCheck.addedPage) pagesCreated++;

      waDrawCard(doc, margin, y, pageWidth - margin * 2, 18, {
        fill: { r: 249, g: 250, b: 251 },
      });

      doc.setFontSize(7.5);
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'bold');
      doc.text('Heating Procedure', margin + 4, y + 6);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);

      const heatingItems = [
        `Preheat: ${wps.preheatingTemp || wps.preheatTemperature ? (wps.preheatingTemp || wps.preheatTemperature) + ' °C' : '-'}`,
        `Interpass: ${wps.interpassTemp || wps.interpassTemperature ? (wps.interpassTemp || wps.interpassTemperature) + ' °C' : '-'}`,
        `Postheat: ${wps.postheatingTemp || wps.postheatTemperature ? (wps.postheatingTemp || wps.postheatTemperature) + ' °C' : '-'}`,
      ];

      heatingItems.forEach((item, idx) => {
        doc.text(item, margin + 4 + idx * 60, y + 12);
      });

      y += 22;
    }

    // PWHT Section
    if (wps.pwhtRequired === 'Y' || wps.pwht) {
      // Check if we need a new page before PWHT
      const pwhtCheck = await waCheckAndAddPage(doc, y, margin, 25);
      y = pwhtCheck.y;
      if (pwhtCheck.addedPage) pagesCreated++;

      waDrawCard(doc, margin, y, pageWidth - margin * 2, 18, {
        fill: { r: 249, g: 250, b: 251 },
      });

      doc.setFontSize(7.5);
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'bold');
      doc.text('Post Weld Heat Treatment (PWHT)', margin + 4, y + 6);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);

      if (wps.pwhtRequired === 'Y') {
        const pwhtItems = [
          `Heating Rate: ${wps.pwhtHeatingRate ? wps.pwhtHeatingRate + ' °C/h' : '-'}`,
          `Temp & Time: ${wps.pwhtTempHoldingTime || '-'}`,
          `Cooling Rate: ${wps.pwhtCoolingRate ? wps.pwhtCoolingRate + ' °C/h' : '-'}`,
        ];
        pwhtItems.forEach((item, idx) => {
          doc.text(item, margin + 4 + idx * 60, y + 12);
        });
      } else {
        doc.text(wps.pwht || 'Not required', margin + 4, y + 12);
      }

      y += 22;
    }

    // Additional Notes
    if (wps.additionalNotes) {
      const notesLines = doc.splitTextToSize(wps.additionalNotes, pageWidth - margin * 2 - 8);
      const notesHeight = notesLines.length * 3.5 + 10;

      // Check if we need a new page before Additional Notes
      const notesCheck = await waCheckAndAddPage(doc, y, margin, notesHeight + 5);
      y = notesCheck.y;
      if (notesCheck.addedPage) pagesCreated++;

      waDrawCard(doc, margin, y, pageWidth - margin * 2, notesHeight, {
        fill: { r: 249, g: 250, b: 251 },
      });

      doc.setFontSize(7);
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'bold');
      doc.text('Additional Notes', margin + 4, y + 6);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(notesLines, margin + 4, y + 11);

      y += notesHeight + 4;
    }
  }

  // Return the number of pages created
  return pagesCreated;
}

// ============ HD IMAGE ANNEXES (One per page) ============

async function waGenerateImageAnnexes(
  doc: jsPDF,
  imageUrls: { url: string; caption?: string }[],
  startPageNum: number,
  totalPages: number,
  options?: PDFExportOptions
): Promise<void> {
  // All images go to annexe (one HD image per page)
  const annexImages = imageUrls;

  for (let i = 0; i < annexImages.length; i++) {
    const image = annexImages[i];

    // Fetch image first to determine its orientation
    let base64: string | null = null;
    let imageDimensions: { width: number; height: number } | null = null;
    let isLandscape = false;

    if (image.url) {
      try {
        base64 = await waFetchImageAsBase64(image.url);
        if (base64) {
          imageDimensions = await waGetImageDimensions(base64);
          // Determine if image is landscape (width > height) or portrait
          isLandscape = imageDimensions.width > imageDimensions.height;
          console.log(`[PDF] Image ${i + 1}: ${imageDimensions.width}x${imageDimensions.height} - ${isLandscape ? 'Landscape' : 'Portrait'}`);
        }
      } catch (error) {
        console.error('[PDF] Error fetching/analyzing image:', error);
      }
    }

    // Add page with appropriate orientation
    if (i === 0) {
      // First image page - add with specific orientation
      doc.addPage('a4', isLandscape ? 'landscape' : 'portrait');
    } else {
      doc.addPage('a4', isLandscape ? 'landscape' : 'portrait');
    }

    // Get page dimensions (will be different for portrait vs landscape)
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const pageNum = startPageNum + i;

    // Header
    doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    doc.rect(0, 0, pageWidth, 3, 'F');

    await waDrawLogo(doc, pageWidth - 55, 8, 40);

    doc.setFontSize(14);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'bold');
    doc.text(`ANNEX ${i + 1} - IMAGE DOCUMENTATION`, margin, 18);

    // Image area - HD full page with optimal space usage
    const headerHeight = 28;
    const footerHeight = 25;
    const imgY = headerHeight;
    const availableHeight = pageHeight - headerHeight - footerHeight;
    const availableWidth = pageWidth - margin * 2;

    // Draw image border
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(1);
    doc.roundedRect(margin, imgY, availableWidth, availableHeight, 4, 4, 'S');

    // Draw the image at maximum quality
    if (base64 && imageDimensions) {
      try {
        const format = waGetImageFormat(base64);

        // Calculate scaling to fit within available space while maintaining aspect ratio
        const imageAspectRatio = imageDimensions.width / imageDimensions.height;
        const availableAspectRatio = availableWidth / availableHeight;

        let finalWidth, finalHeight, offsetX, offsetY;

        if (imageAspectRatio > availableAspectRatio) {
          // Image is wider relative to available space - fit to width
          finalWidth = availableWidth - 4;
          finalHeight = finalWidth / imageAspectRatio;
          offsetX = margin + 2;
          offsetY = imgY + (availableHeight - finalHeight) / 2;
        } else {
          // Image is taller relative to available space - fit to height
          finalHeight = availableHeight - 4;
          finalWidth = finalHeight * imageAspectRatio;
          offsetX = margin + (availableWidth - finalWidth) / 2;
          offsetY = imgY + 2;
        }

        // Add image at highest quality with NO compression
        // 'NONE' preserves original image quality
        doc.addImage(
          base64,
          format,
          offsetX,
          offsetY,
          finalWidth,
          finalHeight,
          undefined, // alias
          'NONE' // NO compression for maximum quality
        );
      } catch (error) {
        console.error('[PDF] Error adding image to PDF:', error);
        waDrawImagePlaceholder(doc, margin, imgY, availableWidth, availableHeight);
      }
    } else {
      waDrawImagePlaceholder(doc, margin, imgY, availableWidth, availableHeight);
    }

    // Caption if available
    if (image.caption) {
      const captionY = imgY + availableHeight + 8;
      doc.setFontSize(9);
      doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
      doc.setFont('helvetica', 'italic');
      const captionLines = doc.splitTextToSize(image.caption, availableWidth - 10);
      doc.text(captionLines.slice(0, 2), margin + 5, captionY);
    }

    waDrawConfidentialFooter(doc, pageNum, totalPages, options);
  }
}

// ============ MAIN EXPORT FUNCTIONS ============

export async function waGenerateCaseStudyPDFAsync(
  data: CaseStudyPDFData,
  options?: PDFExportOptions
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const imageUrls = waNormalizeImages(data.images);

  // Generate all content pages (Page 1 + Cost Calc + WPS - may span multiple pages)
  const contentPageCount = await waGeneratePage1(doc, data, options, 1);

  // Add annex pages for all images (one HD image per page)
  const annexImageCount = imageUrls.length;
  const totalPages = contentPageCount + annexImageCount;

  // Now add footers to all content pages with correct page numbers
  for (let i = 1; i <= contentPageCount; i++) {
    doc.setPage(i);
    waDrawConfidentialFooter(doc, i, totalPages, options);
  }

  // HD Image Annexes (one image per page) - all images go here
  // These will add their own footers
  if (imageUrls.length > 0) {
    const startPageNum = contentPageCount + 1;
    await waGenerateImageAnnexes(doc, imageUrls, startPageNum, totalPages, options);
  }

  return doc;
}

export function generateCaseStudyPDF(data: CaseStudyPDFData, options?: PDFExportOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;

  // Simplified sync page 1
  doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.rect(0, 0, pageWidth, 3, 'F');
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INDUSTRIAL CHALLENGE REPORT', margin, 20);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text('PDF generation in progress...', margin, 40);
  doc.text(`ICA Type: ${data.type}`, margin, 50);
  doc.text(`Industry: ${data.industry}`, margin, 60);

  waDrawConfidentialFooter(doc, 1, 1, options);

  return doc;
}

export async function downloadCaseStudyPDF(
  data: CaseStudyPDFData,
  options?: PDFExportOptions
): Promise<void> {
  try {
    const doc = await waGenerateCaseStudyPDFAsync(data, options);
    // Generate filename without customer name for confidentiality
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `WA_${data.type}_ICA_${timestamp}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('[PDF] Error generating PDF:', error);
    const doc = generateCaseStudyPDF(data, options);
    // Generate filename without customer name for confidentiality
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `WA_${data.type}_ICA_${timestamp}.pdf`;
    doc.save(fileName);
  }
}

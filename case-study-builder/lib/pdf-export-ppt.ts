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
  wearTypeOthers?: string[];
  problemDescription: string;
  previousSolution?: string;
  previousServiceLife?: string;
  competitorName?: string;
  baseMetal?: string;
  generalDimensions?: string;
  waSolution: string;
  waProduct: string;
  waProductDiameter?: string;
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
}

export interface WPSData {
  numberOfLayers?: string;
  process?: string;
  technique?: string;
  weldingPosition?: string;
  torchPosition?: string;
  baseMetal?: string;
  thickness?: string;
  surfacePreparation?: string;
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
  preheatTemperature?: string;
  interpassTemperature?: string;
  postheating?: string;
  pwht?: string;
  heatingRate?: string;
  temperatureHoldingTime?: string;
  coolingRate?: string;
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
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

// ============ PROFESSIONAL ICON DRAWING (Matching Lucide Icons) ============

/**
 * Draw Building2 icon (Lucide style) - for Industry
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
    waProduct?: string;
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
  if (data.waProduct) {
    doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    const productText = data.waProduct;
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

async function waGeneratePage1(
  doc: jsPDF,
  data: CaseStudyPDFData,
  options?: PDFExportOptions,
  totalPages: number = 1
): Promise<void> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  let y = 8;

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
      `This case study was originally written in ${data.originalLanguage.toUpperCase()}. You are viewing the translated version.`,
      margin + 3, y + 5
    );
    y += 10;
  }

  // ===== CASE TYPE TABS =====
  doc.setFontSize(9);
  const types = [
    { label: 'Application Case Study', type: 'APPLICATION', color: COLORS.waGreen },
    { label: 'Tech Case Study', type: 'TECH', color: COLORS.purple },
    { label: 'Star Case Study', type: 'STAR', color: COLORS.starYellow },
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
  waDrawUserIcon(doc, margin + 3, y + 2, 6);
  doc.text('Written by:', margin + 10, y + 6);
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFont('helvetica', 'bold');
  doc.text(data.contributor.name, margin + 28, y + 6);

  waDrawCalendarIcon(doc, margin + 85, y + 2, 6);
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
  waDrawCalendarIcon(doc, margin + 3, y + 10, 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.text('Job Date:', margin + 10, y + 14);
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFont('helvetica', 'bold');
  doc.text(waFormatDate(data.jobDate || data.createdAt) || 'N/A', margin + 28, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.text('Revision:', margin + 92, y + 14);
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFont('helvetica', 'bold');
  doc.text(data.revision || 'V1', margin + 108, y + 14);

  y += 22;

  // ===== HORIZONTAL INFO ROW (Matching details page) =====
  // Show: Industry, Component/Workpiece, Job Type, Work Type, Location
  const jobTypeDisplay = data.jobType === 'OTHER' ? (data.jobTypeOther || 'Other') : (data.jobType || 'N/A');

  const infoItems = [
    { icon: 'building', label: 'Industry', value: data.industry || 'N/A' },
    { icon: 'package', label: 'Component', value: data.componentWorkpiece || 'N/A' },
    { icon: 'clipboard', label: 'Job Type', value: jobTypeDisplay },
    { icon: 'wrench', label: 'Work Type', value: data.workType || 'N/A' },
    { icon: 'mappin', label: 'Location', value: data.country || data.location || 'N/A' },
  ];

  const itemWidth = (pageWidth - margin * 2) / infoItems.length;

  // Background strip
  doc.setFillColor(250, 250, 252);
  doc.rect(margin, y, pageWidth - margin * 2, 18, 'F');

  infoItems.forEach((item, idx) => {
    const itemX = margin + idx * itemWidth;

    // Draw icon based on type (using Lucide-style icons)
    switch (item.icon) {
      case 'building': waDrawBuildingIcon(doc, itemX + 2, y + 1, 8); break;
      case 'package': waDrawPackageIcon(doc, itemX + 2, y + 1, 8); break;
      case 'clipboard': waDrawClipboardIcon(doc, itemX + 2, y + 1, 8); break;
      case 'wrench': waDrawWrenchIcon(doc, itemX + 2, y + 1, 8); break;
      case 'mappin': waDrawMapPinIcon(doc, itemX + 2, y + 1, 8); break;
    }

    // Label
    doc.setFontSize(6);
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, itemX + 12, y + 5);

    // Value
    doc.setFontSize(7);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'bold');
    const valueText = item.value.length > 14 ? item.value.substring(0, 14) + '...' : item.value;
    doc.text(valueText, itemX + 12, y + 11);
  });

  // Customer name below
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.setFont('helvetica', 'italic');
  doc.text(data.customerName, margin + 2, y + 17);

  y += 22;

  // ===== SECTION 1: APPLICATION DETAILS =====
  waDrawSectionHeader(doc, 'APPLICATION DETAILS', margin, y, pageWidth - margin * 2, 1);
  y += 10;

  // General Description card
  waDrawCard(doc, margin, y, pageWidth - margin * 2, 22);

  doc.setFontSize(8);
  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFont('helvetica', 'bold');
  doc.text('GENERAL DESCRIPTION', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFontSize(7);
  const descLines = doc.splitTextToSize(data.problemDescription, pageWidth - margin * 2 - 8);
  doc.text(descLines.slice(0, 3), margin + 4, y + 11);

  y += 26;

  // ===== WEAR TYPES + PREVIOUS SOLUTION =====
  const wearColWidth = (pageWidth - margin * 2) * 0.45;
  const prevColStart = margin + wearColWidth + 8;
  const prevColWidth = pageWidth - margin - prevColStart;

  // Wear types with progress bars
  doc.setFontSize(8);
  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFont('helvetica', 'bold');
  doc.text('WEAR TYPE ANALYSIS', margin, y + 4);
  y += 8;

  const wearTypes = [
    { name: 'Abrasion', key: 'abrasion' },
    { name: 'Impact', key: 'impact' },
    { name: 'Metal-Metal', key: 'metal' },
    { name: 'Temperature', key: 'temp' },
    { name: 'Corrosion', key: 'corrosion' },
  ];

  doc.setFontSize(7);
  wearTypes.forEach((wt, idx) => {
    const rowY = y + idx * 5.5;
    const isActive = data.wearType.some(w => w.toLowerCase().includes(wt.key));
    const severity = data.wearSeverities?.[wt.key.toUpperCase()] || (isActive ? 4 : 0);

    doc.setTextColor(isActive ? COLORS.darkGray.r : COLORS.gray.r, isActive ? COLORS.darkGray.g : COLORS.gray.g, isActive ? COLORS.darkGray.b : COLORS.gray.b);
    doc.setFont('helvetica', isActive ? 'bold' : 'normal');
    doc.text(wt.name, margin, rowY + 3);
    waDrawProgressBar(doc, margin + 25, rowY, wearColWidth - 30, 4, 6, severity);
  });

  // Previous Solution card
  waDrawCard(doc, prevColStart, y - 8, prevColWidth, 36, {
    fill: { r: 254, g: 252, b: 248 },
    border: { r: 230, g: 220, b: 200 },
  });

  doc.setFontSize(8);
  doc.setTextColor(COLORS.orange.r, COLORS.orange.g, COLORS.orange.b);
  doc.setFont('helvetica', 'bold');
  doc.text('PREVIOUS SOLUTION', prevColStart + 4, y - 4);

  // Competitor/OEM name if available
  if (data.competitorName) {
    doc.setFontSize(7);
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFont('helvetica', 'italic');
    doc.text(`OEM: ${data.competitorName}`, prevColStart + 4, y + 2);
  }

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFontSize(7);

  // Previous solution text - use problemDescription as fallback since form collects both in one field
  const prevSolText = data.previousSolution || data.problemDescription || 'Not specified';
  const prevLines = doc.splitTextToSize(prevSolText, prevColWidth - 8);
  const prevTextY = data.competitorName ? y + 8 : y + 3;
  doc.text(prevLines.slice(0, 2), prevColStart + 4, prevTextY);

  if (data.previousServiceLife) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.red.r, COLORS.red.g, COLORS.red.b);
    doc.text(`Service Life: ${data.previousServiceLife}`, prevColStart + 4, y + 22);
  }

  y += 32;

  // ===== SECTION 2: SOLUTION PROVIDED =====
  waDrawSectionHeader(doc, 'SOLUTION PROVIDED', margin, y, pageWidth - margin * 2, 2);
  y += 10;

  // Technical Details + WA Solution cards side by side
  const cardWidth = (pageWidth - margin * 2 - 6) / 2;

  // Technical Details card
  waDrawCard(doc, margin, y, cardWidth, 24);

  doc.setFontSize(8);
  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFont('helvetica', 'bold');
  doc.text('TECHNICAL DETAILS', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFontSize(7);

  const techDetails = [
    { label: 'Base Metal:', value: data.baseMetal || 'N/A' },
    { label: 'Dimensions:', value: data.generalDimensions || 'N/A' },
    { label: 'Product:', value: `${data.waProduct}${data.waProductDiameter ? ' ' + data.waProductDiameter : ''}` },
  ];

  techDetails.forEach((detail, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.text(detail.label, margin + 4, y + 10 + idx * 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    const valueText = detail.value.length > 25 ? detail.value.substring(0, 25) + '...' : detail.value;
    doc.text(valueText, margin + 28, y + 10 + idx * 4.5);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  });

  // WA Solution card
  const solCardX = margin + cardWidth + 6;
  waDrawCard(doc, solCardX, y, cardWidth, 24, {
    fill: COLORS.lightGreen,
    border: { r: 134, g: 239, b: 172 },
  });

  doc.setFontSize(8);
  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFont('helvetica', 'bold');
  doc.text('WA SOLUTION', solCardX + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFontSize(7);
  const solLines = doc.splitTextToSize(data.waSolution, cardWidth - 8);
  doc.text(solLines.slice(0, 3), solCardX + 4, y + 11);

  const duration = [
    data.jobDurationYears && `${data.jobDurationYears}y`,
    data.jobDurationMonths && `${data.jobDurationMonths}mo`,
    data.jobDurationWeeks && `${data.jobDurationWeeks}w`,
    data.jobDurationDays && `${data.jobDurationDays}d`,
    data.jobDurationHours && `${data.jobDurationHours}h`,
  ].filter(Boolean).join(' ') || '';

  if (duration) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Duration: ${duration}`, solCardX + 4, y + 21);
  }

  y += 28;

  // ===== SECTION 3: BUSINESS IMPACT =====
  waDrawSectionHeader(doc, 'BUSINESS IMPACT', margin, y, pageWidth - margin * 2, 3);
  y += 10;

  // Financial metrics row
  const metricWidth = (pageWidth - margin * 2 - 12) / 3;

  // Revenue card
  waDrawCard(doc, margin, y, metricWidth, 16);
  doc.setFontSize(6);
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.text('Solution Value', margin + 4, y + 5);
  doc.setFontSize(10);
  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFont('helvetica', 'bold');
  doc.text(
    data.solutionValueRevenue ? waFormatCurrency(data.solutionValueRevenue, data.costCalculator?.currency || data.revenueCurrency) : '-',
    margin + 4, y + 12
  );

  // Annual Revenue card
  waDrawCard(doc, margin + metricWidth + 6, y, metricWidth, 16);
  doc.setFontSize(6);
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.setFont('helvetica', 'normal');
  doc.text('Annual Potential', margin + metricWidth + 10, y + 5);
  doc.setFontSize(10);
  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFont('helvetica', 'bold');
  doc.text(
    data.annualPotentialRevenue ? waFormatCurrency(data.annualPotentialRevenue, data.costCalculator?.currency || data.revenueCurrency) : '-',
    margin + metricWidth + 10, y + 12
  );

  // Service Life card
  waDrawCard(doc, margin + (metricWidth + 6) * 2, y, metricWidth, 16, {
    fill: COLORS.lightGreen,
    border: { r: 134, g: 239, b: 172 },
  });
  doc.setFontSize(6);
  doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
  doc.setFont('helvetica', 'normal');
  doc.text('Expected Service Life', margin + (metricWidth + 6) * 2 + 4, y + 5);
  doc.setFontSize(10);
  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFont('helvetica', 'bold');
  doc.text(data.expectedServiceLife || '-', margin + (metricWidth + 6) * 2 + 4, y + 12);

  y += 20;

  // Technical Advantages card
  waDrawCard(doc, margin, y, pageWidth - margin * 2, 18);

  doc.setFontSize(8);
  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFont('helvetica', 'bold');
  doc.text('TECHNICAL ADVANTAGES', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
  doc.setFontSize(7);
  if (data.technicalAdvantages) {
    const advLines = doc.splitTextToSize(data.technicalAdvantages, pageWidth - margin * 2 - 8);
    doc.text(advLines.slice(0, 2), margin + 4, y + 11);
  }

  waDrawConfidentialFooter(doc, 1, totalPages, options);
}

// ============ PAGE 2: COST CALCULATOR + WPS ============

async function waGeneratePage2(doc: jsPDF, data: CaseStudyPDFData, options?: PDFExportOptions, totalPages: number = 2): Promise<void> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  let y = 8;

  // Header
  doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.rect(0, 0, pageWidth, 3, 'F');

  await waDrawLogo(doc, pageWidth - 55, 5, 45);

  y = 22;

  // ===== VISUAL COMPARISON =====
  y = waDrawVisualComparison(doc, margin, y, pageWidth - margin * 2, {
    previousLife: data.previousServiceLife,
    expectedLife: data.expectedServiceLife,
    previousSolution: data.previousSolution,
    problemDescription: data.problemDescription,
    waSolution: data.waSolution,
    waProduct: data.waProduct,
    competitorName: data.competitorName,
  });

  y += 5;

  // ===== COST REDUCTION CALCULATOR (STAR only) =====
  if (data.type === 'STAR' && data.costCalculator) {
    const cc = data.costCalculator;

    const A = cc.costOfPart || 0;
    const E = cc.partsUsedPerYear || 0;
    const F = cc.maintenanceRepairCost || 0;
    const G = cc.disassemblyCost || 0;
    const H = cc.downtimeCost || 0;

    const calculatedCostBefore = E > 0 ? waCalculateAnnualCost(A, E, F, G, H) : (cc.totalCostBefore || 0);
    const waCost = cc.costOfWaSolution || A;
    const calculatedCostAfter = E > 0 ? waCalculateAnnualCost(waCost, E, F * 0.5, G * 0.5, H * 0.5) : (cc.totalCostAfter || 0);
    const savings = calculatedCostBefore - calculatedCostAfter;
    const savingsPercent = calculatedCostBefore > 0
      ? Math.round((savings / calculatedCostBefore) * 100)
      : (cc.savingsPercentage || 0);

    waDrawSectionHeader(doc, 'COST REDUCTION CALCULATOR', margin, y, pageWidth - margin * 2, 4);
    y += 12;

    // Modern calculator layout
    const inputWidth = (pageWidth - margin * 2) * 0.58;
    const outputWidth = (pageWidth - margin * 2) * 0.38;
    const calcHeight = 65;

    // INPUT Section Card
    waDrawCard(doc, margin, y, inputWidth, calcHeight, {
      fill: { r: 250, g: 250, b: 255 },
      border: { r: 200, g: 200, b: 220 },
    });

    doc.setFillColor(COLORS.blue.r, COLORS.blue.g, COLORS.blue.b);
    doc.roundedRect(margin, y, inputWidth, 8, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('INPUT PARAMETERS', margin + inputWidth / 2, y + 5.5, { align: 'center' });

    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');

    const inputY = y + 12;
    const labelX = margin + 4;
    const valueX = margin + inputWidth - 35;

    const inputs = [
      { label: 'Equipment/Part', value: cc.equipmentName || data.componentWorkpiece || '-' },
      { label: `Cost of Current Part`, value: A ? waFormatCurrency(A, cc.currency) : '-', highlight: true },
      { label: `Cost of WA Solution`, value: waCost ? waFormatCurrency(waCost, cc.currency) : '-' },
      { label: 'Old Solution Lifetime', value: cc.oldSolutionLifetimeDays ? `${cc.oldSolutionLifetimeDays} days` : '-' },
      { label: 'WA Solution Lifetime', value: cc.waSolutionLifetimeDays ? `${cc.waSolutionLifetimeDays} days` : '-' },
      { label: 'Parts Used Per Year (E)', value: E ? `${E}` : '-', highlight: true },
      { label: 'Maintenance Cost (F)', value: F ? waFormatCurrency(F, cc.currency) : '-' },
      { label: 'Disassembly Cost (G)', value: G ? waFormatCurrency(G, cc.currency) : '-' },
      { label: 'Downtime Cost (H)', value: H ? waFormatCurrency(H, cc.currency) : '-' },
    ];

    inputs.forEach((input, idx) => {
      const rowY = inputY + idx * 5.5;
      if (input.highlight) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      doc.text(input.label, labelX, rowY + 3);
      doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
      doc.text(input.value, valueX, rowY + 3, { align: 'right' });
      doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    });

    // OUTPUT Section Card
    const outputX = margin + inputWidth + 8;
    waDrawCard(doc, outputX, y, outputWidth, calcHeight, {
      fill: { r: 240, g: 253, b: 244 },
      border: { r: 134, g: 239, b: 172 },
    });

    doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    doc.roundedRect(outputX, y, outputWidth, 8, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('RESULTS', outputX + outputWidth / 2, y + 5.5, { align: 'center' });

    const displayCostBefore = cc.totalCostBefore || calculatedCostBefore;
    const displayCostAfter = cc.totalCostAfter || calculatedCostAfter;
    const displaySavings = cc.annualSavings || savings;
    const displaySavingsPercent = cc.savingsPercentage || savingsPercent;

    // Current Cost
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Annual Cost (Current)', outputX + 4, y + 15);
    doc.setTextColor(COLORS.red.r, COLORS.red.g, COLORS.red.b);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(displayCostBefore ? waFormatCurrency(Math.round(displayCostBefore), cc.currency) : '-', outputX + 4, y + 22);

    // WA Cost
    doc.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Annual Cost (WA Solution)', outputX + 4, y + 30);
    doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(displayCostAfter ? waFormatCurrency(Math.round(displayCostAfter), cc.currency) : '-', outputX + 4, y + 37);

    // Savings box
    doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    doc.roundedRect(outputX + 4, y + 43, outputWidth - 8, 18, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('ANNUAL SAVINGS', outputX + outputWidth / 2, y + 49, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const savingsText = displaySavings ? waFormatCurrency(Math.round(displaySavings), cc.currency) : '-';
    doc.text(savingsText, outputX + outputWidth / 2, y + 57, { align: 'center' });

    // Savings percentage badge
    if (displaySavingsPercent > 0) {
      doc.setFillColor(COLORS.starYellow.r, COLORS.starYellow.g, COLORS.starYellow.b);
      doc.circle(outputX + outputWidth - 12, y + 20, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`+${displaySavingsPercent}%`, outputX + outputWidth - 12, y + 21, { align: 'center' });
    }

    y += calcHeight + 8;

    // Extra Benefits
    if (cc.extraBenefits) {
      waDrawCard(doc, margin, y, pageWidth - margin * 2, 14);
      doc.setFontSize(7);
      doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
      doc.setFont('helvetica', 'bold');
      doc.text('ADDITIONAL BENEFITS', margin + 4, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
      const benefitLines = doc.splitTextToSize(cc.extraBenefits, pageWidth - margin * 2 - 8);
      doc.text(benefitLines.slice(0, 1), margin + 4, y + 11);
      y += 18;
    }
  }

  // ===== WELDING PROCEDURE SPECIFICATION =====
  if ((data.type === 'TECH' || data.type === 'STAR') && data.wps) {
    const sectionNum = data.type === 'STAR' ? 5 : 4;
    const wps = data.wps;

    waDrawSectionHeader(doc, 'WELDING PROCEDURE SPECIFICATION', margin, y, pageWidth - margin * 2, sectionNum);
    y += 12;

    // Elegant WPS card layout - 4 columns
    const cardWidth = (pageWidth - margin * 2 - 9) / 4;
    const cardHeight = 55;

    // Card 1: Process Info
    waDrawCard(doc, margin, y, cardWidth, cardHeight, {
      fill: { r: 248, g: 250, b: 252 },
    });
    doc.setFillColor(COLORS.blue.r, COLORS.blue.g, COLORS.blue.b);
    doc.roundedRect(margin, y, cardWidth, 7, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('PROCESS', margin + cardWidth / 2, y + 5, { align: 'center' });

    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFontSize(6.5);
    const processData = [
      { label: 'Layers', value: wps.numberOfLayers || '-' },
      { label: 'Process', value: wps.process || '-' },
      { label: 'Technique', value: wps.technique || '-' },
      { label: 'Position', value: wps.weldingPosition || '-' },
      { label: 'Torch', value: wps.torchPosition || '-' },
    ];
    processData.forEach((item, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.text(item.label + ':', margin + 3, y + 13 + idx * 8);
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, margin + 3, y + 17 + idx * 8);
    });

    // Card 2: Base Metal
    const card2X = margin + cardWidth + 3;
    waDrawCard(doc, card2X, y, cardWidth, cardHeight, {
      fill: { r: 248, g: 250, b: 252 },
    });
    doc.setFillColor(COLORS.orange.r, COLORS.orange.g, COLORS.orange.b);
    doc.roundedRect(card2X, y, cardWidth, 7, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('BASE METAL', card2X + cardWidth / 2, y + 5, { align: 'center' });

    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFontSize(6.5);
    const metalData = [
      { label: 'Material', value: wps.baseMetal || '-' },
      { label: 'Thickness', value: wps.thickness || '-' },
      { label: 'Surface Prep', value: wps.surfacePreparation || '-' },
    ];
    metalData.forEach((item, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.text(item.label + ':', card2X + 3, y + 13 + idx * 12);
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, card2X + 3, y + 18 + idx * 12);
    });

    // Card 3: Product Info
    const card3X = margin + (cardWidth + 3) * 2;
    waDrawCard(doc, card3X, y, cardWidth, cardHeight, {
      fill: { r: 240, g: 253, b: 244 },
      border: { r: 134, g: 239, b: 172 },
    });
    doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    doc.roundedRect(card3X, y, cardWidth, 7, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('WA PRODUCT', card3X + cardWidth / 2, y + 5, { align: 'center' });

    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFontSize(6.5);
    const productData = [
      { label: 'Product', value: wps.productName || data.waProduct || '-', green: true },
      { label: 'Diameter', value: wps.diameter || '-' },
      { label: 'Shielding', value: wps.shieldingGas || '-' },
      { label: 'Flow Rate', value: wps.flowRate || '-' },
      { label: 'Stick-out', value: wps.stickOut || '-' },
    ];
    productData.forEach((item, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.text(item.label + ':', card3X + 3, y + 13 + idx * 8);
      doc.setFont('helvetica', 'bold');
      if (item.green) {
        doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
      }
      doc.text(item.value, card3X + 3, y + 17 + idx * 8);
      doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    });

    // Card 4: Parameters
    const card4X = margin + (cardWidth + 3) * 3;
    waDrawCard(doc, card4X, y, cardWidth, cardHeight, {
      fill: { r: 248, g: 250, b: 252 },
    });
    doc.setFillColor(COLORS.purple.r, COLORS.purple.g, COLORS.purple.b);
    doc.roundedRect(card4X, y, cardWidth, 7, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('PARAMETERS', card4X + cardWidth / 2, y + 5, { align: 'center' });

    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFontSize(6.5);
    const paramData = [
      { label: 'Current', value: wps.currentType || '-' },
      { label: 'Intensity', value: wps.intensity || '-' },
      { label: 'Voltage', value: wps.voltage || '-' },
      { label: 'Wire Speed', value: wps.wireSpeed || '-' },
      { label: 'Weld Speed', value: wps.weldingSpeed || '-' },
    ];
    paramData.forEach((item, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.text(item.label + ':', card4X + 3, y + 13 + idx * 8);
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, card4X + 3, y + 17 + idx * 8);
    });

    y += cardHeight + 8;

    // Temperature & Heat Treatment row
    if (wps.preheatTemperature || wps.interpassTemperature || wps.pwht) {
      waDrawCard(doc, margin, y, pageWidth - margin * 2, 14);

      doc.setFontSize(7);
      doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
      doc.setFont('helvetica', 'bold');
      doc.text('TEMPERATURE & HEAT TREATMENT', margin + 4, y + 5);

      doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
      doc.setFontSize(6.5);
      const tempX = margin + 4;
      const tempItems = [
        `Preheat: ${wps.preheatTemperature || '-'}`,
        `Interpass: ${wps.interpassTemperature || '-'}`,
        `PWHT: ${wps.pwht || 'Not required'}`,
      ];

      doc.setFont('helvetica', 'normal');
      tempItems.forEach((item, idx) => {
        doc.text(item, tempX + idx * 60, y + 11);
      });
    }
  }

  waDrawConfidentialFooter(doc, 2, totalPages, options);
}

// ============ HD IMAGE ANNEXES (One per page) ============

async function waGenerateImageAnnexes(
  doc: jsPDF,
  imageUrls: { url: string; caption?: string }[],
  startPageNum: number,
  totalPages: number,
  options?: PDFExportOptions
): Promise<void> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // All images go to annexe (one HD image per page)
  const annexImages = imageUrls;

  for (let i = 0; i < annexImages.length; i++) {
    doc.addPage();

    const image = annexImages[i];
    const pageNum = startPageNum + i;

    // Header
    doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    doc.rect(0, 0, pageWidth, 3, 'F');

    await waDrawLogo(doc, pageWidth - 55, 8, 40);

    doc.setFontSize(14);
    doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
    doc.setFont('helvetica', 'bold');
    doc.text(`ANNEX ${i + 1} - IMAGE DOCUMENTATION`, margin, 18);

    // Image area - HD full page
    const imgY = 28;
    const imgHeight = pageHeight - imgY - 35; // Leave room for footer and caption
    const imgWidth = pageWidth - margin * 2;

    // Draw image border
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(1);
    doc.roundedRect(margin, imgY, imgWidth, imgHeight, 4, 4, 'S');

    // Draw the image
    if (image.url) {
      try {
        const base64 = await waFetchImageAsBase64(image.url);
        if (base64) {
          const format = waGetImageFormat(base64);
          // Fit image within the area while maintaining aspect ratio
          doc.addImage(base64, format, margin + 2, imgY + 2, imgWidth - 4, imgHeight - 4);
        } else {
          waDrawImagePlaceholder(doc, margin, imgY, imgWidth, imgHeight);
        }
      } catch {
        waDrawImagePlaceholder(doc, margin, imgY, imgWidth, imgHeight);
      }
    } else {
      waDrawImagePlaceholder(doc, margin, imgY, imgWidth, imgHeight);
    }

    // Caption if available
    if (image.caption) {
      doc.setFontSize(9);
      doc.setTextColor(COLORS.darkGray.r, COLORS.darkGray.g, COLORS.darkGray.b);
      doc.setFont('helvetica', 'italic');
      const captionLines = doc.splitTextToSize(image.caption, imgWidth - 10);
      doc.text(captionLines.slice(0, 2), margin + 5, imgY + imgHeight + 8);
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

  // Calculate total pages
  let totalPages = 1; // Page 1 always

  if (data.type === 'TECH' || data.type === 'STAR') {
    if (data.costCalculator || data.wps) {
      totalPages++; // Page 2: Calculator + WPS
    }
  }

  // Add annex pages for all images (one HD image per page)
  const annexImageCount = imageUrls.length;
  totalPages += annexImageCount;

  // Page 1: Main Case Study
  await waGeneratePage1(doc, data, options, totalPages);

  // Page 2: Cost Calculator + WPS (TECH and STAR)
  if (data.type === 'TECH' || data.type === 'STAR') {
    if (data.costCalculator || data.wps) {
      doc.addPage();
      await waGeneratePage2(doc, data, options, totalPages);
    }
  }

  // HD Image Annexes (one image per page) - all images go here
  if (imageUrls.length > 0) {
    const startPageNum = totalPages - imageUrls.length + 1;
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
  doc.text(`Case Study: ${data.customerName}`, margin, 50);
  doc.text(`Type: ${data.type}`, margin, 60);

  waDrawConfidentialFooter(doc, 1, 1, options);

  return doc;
}

export async function downloadCaseStudyPDF(
  data: CaseStudyPDFData,
  options?: PDFExportOptions
): Promise<void> {
  try {
    const doc = await waGenerateCaseStudyPDFAsync(data, options);
    const fileName = `${data.customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.type}_CaseStudy.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('[PDF] Error generating PDF:', error);
    const doc = generateCaseStudyPDF(data, options);
    const fileName = `${data.customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.type}_CaseStudy.pdf`;
    doc.save(fileName);
  }
}

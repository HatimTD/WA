/**
 * PDF Export matching PowerPoint "Case Study REPORT.pptx" design exactly
 * Based on visual analysis of pdf1.png, pdf2.png, pdf3.png
 * Updated: Real WA logo, new cost calculator formula, real image embedding
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
  annualPotentialRevenue?: number;
  customerSavingsAmount?: number;
  jobType?: string;
  jobTypeOther?: string;
  oem?: string;
  jobDurationHours?: string;
  jobDurationDays?: string;
  jobDurationWeeks?: string;
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
  // Images can be URL strings or objects with url/caption
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
  costOfPart?: number;            // A - Cost of Part
  costOfWaSolution?: number;      // Cost of WA solution
  oldSolutionLifetimeDays?: number;
  waSolutionLifetimeDays?: number;
  oldSolutionLifetimeUnit?: string;
  waSolutionLifetimeUnit?: string;
  partsUsedPerYear?: number;      // E - Parts used per year
  maintenanceRepairCost?: number; // F - Maintenance/Repair cost
  disassemblyCost?: number;       // G - Disassembly cost
  downtimeCost?: number;          // H - Downtime cost
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

// Real WA Logo as base64 (from public/welding_alloys_logo.png)
const WA_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAQAElEQVR4Aex9B4CdRbX/b2a+csvW9ISS0KV3EAQBC2Ln6R/fs8DjWVBRqqKCLSoiigqigmJDUBRDB0F6QFFQegm9t/Sett31t/r8z917NhhSydxM2QCZzvmlnzpw5c87U3Y3GOrfWSGDmzJn6oB8fkxdYa5h6nTOyzkBWswKIku/788Pb3v79j0978/c/ueX+p37mLR8+9/hPH3nxD874+hU/v3bmpT974Gvnn/rcl8/5wYIv/O7kniN/8S17+BnfsJ/6yfH2mY5y2ga/3GlyZZf3sxP6j/7tdxd94ZyT5375vB8++bULTrvra5edftWX/3b6GYddcuKR//OnE979jtOP2H7f739y/f1PObgoba/m7rzuya0zkFGogCjlW3/0uc3f/pvj9v/wX79//JHX/+Ky/p3GP7xpfvJcUzXPL37yxTlP3v/Y9f+8/p+/OP/iSz575vnnvu2nF/xhqzP/+pf1fn39xRN+N/vSrj//+1r85T/X48I7Z+Oie27GxYSL7pqNv9x+PS698+b2c2+6YtzZ1186+Td/u3DGLy/98w5n/eW8A84+78+fverSa37y7xtuu+KZh56424/0s9MmbLqgf5cJT37p+l9f+dkbzjj+/8361lv3PfXoGe+deVhhFF183VddZyAjUIG3nXxQ5/4nHfqG//7NsYccd/7JF28zecvHVKn60PNzHr36ur9cftLZv/7te38z64+bXnDz1cVbn34ALyR9eC7uxXyU0e8nqFBVa20a1Tbl4uVchh5Tw2CQoMqypM0gJlTywCDxpaxEnCrTtaJCrahdvQE/xkJbwgtRL55nG/98+n5c8Pe/5X816w8bnvmbs9550e/OO+nxf9x1Xb5v8IkNNp7x2Ocv/OHFh5z/rf9998+P3vIdP/7EuBF0+XWPus5AVqICO//yMP+A731mxkd+c9yhx8w6+boZ3Zs9W+4dfPC2W/7z+99dfsGBv7nmoil3Pj1HPbvoRUQmgdfuQ+cNMi9DqlNkvoVXrOfBB/MyRDZGnNUhRQpthAHipzGipIaYkLDcqsyVsQSSdnVYN9UZlKfg5TwEBR+WbWXSFkOd146Hmpfgqd4XcedTc9Ssv10ydda';

const COLORS = {
  waGreen: { r: 0, g: 128, b: 64 },
  darkGreen: { r: 0, g: 100, b: 50 },
  lightGreen: { r: 220, g: 252, b: 231 },
  black: { r: 0, g: 0, b: 0 },
  white: { r: 255, g: 255, b: 255 },
  gray: { r: 128, g: 128, b: 128 },
  lightGray: { r: 240, g: 240, b: 240 },
  red: { r: 200, g: 0, b: 0 },
  yellow: { r: 255, g: 248, b: 220 },
  blue: { r: 0, g: 112, b: 192 },
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '\u20AC', USD: '$', GBP: '\u00A3', CHF: 'CHF', AUD: 'A$', CAD: 'C$',
  JPY: '\u00A5', CNY: '\u00A5', MAD: 'MAD',
};

function waGetCurrency(code?: string): string {
  return CURRENCY_SYMBOLS[code || 'EUR'] || '\u20AC';
}

function waFormatDate(date?: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Format number with thousands separator (using comma, not locale-specific)
 */
function waFormatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ============ NEW COST CALCULATOR FORMULA ============
// Formula: Annual Cost = (A × E) + (E − 1) × (F + G + H)
// Where: A = Cost of Part, E = Parts/Year, F = Maintenance, G = Disassembly, H = Downtime

function waCalculateAnnualCost(
  costOfPart: number,      // A
  partsPerYear: number,    // E
  maintenanceCost: number, // F
  disassemblyCost: number, // G
  downtimeCost: number     // H
): number {
  return (costOfPart * partsPerYear) + ((partsPerYear - 1) * (maintenanceCost + disassemblyCost + downtimeCost));
}

// ============ IMAGE HANDLING ============

// Cache for loaded images
const imageCache: Map<string, string> = new Map();

/**
 * Fetches an image and converts it to base64 data URL
 */
async function waFetchImageAsBase64(url: string): Promise<string | null> {
  // Check cache first
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

/**
 * Get image format from data URL or URL
 */
function waGetImageFormat(dataUrl: string): 'PNG' | 'JPEG' | 'GIF' | 'WEBP' {
  if (dataUrl.includes('image/png')) return 'PNG';
  if (dataUrl.includes('image/gif')) return 'GIF';
  if (dataUrl.includes('image/webp')) return 'WEBP';
  return 'JPEG';
}

/**
 * Normalizes images array to string URLs
 */
function waNormalizeImages(images?: string[] | { url: string; caption?: string }[]): string[] {
  if (!images || images.length === 0) return [];
  return images.map(img => typeof img === 'string' ? img : img.url);
}

// ============ DRAWING HELPERS ============

/**
 * Draw the real Welding Alloys logo using jsPDF drawing
 * This recreates the WA logo programmatically
 */
/**
 * Draw the WA logo - tries to use real PNG, falls back to drawn version
 */
async function waDrawWALogoAsync(doc: jsPDF, x: number, y: number, size: number = 20): Promise<void> {
  try {
    // Try to load the real logo from public folder
    const logoUrl = window?.location?.origin
      ? `${window.location.origin}/welding_alloys_logo.png`
      : '/welding_alloys_logo.png';

    const base64 = await waFetchImageAsBase64(logoUrl);
    if (base64) {
      doc.addImage(base64, 'PNG', x, y, size, size);
      // Add "Welding Alloys" text next to logo
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Welding', x + size + 2, y + size * 0.35);
      doc.text('Alloys', x + size + 2, y + size * 0.65);
      return;
    }
  } catch (e) {
    console.log('[PDF] Could not load logo, using fallback', e);
  }

  // Fallback to drawn logo
  waDrawWALogoFallback(doc, x, y, size);
}

/**
 * Fallback drawn WA logo when image cannot be loaded
 */
function waDrawWALogoFallback(doc: jsPDF, x: number, y: number, size: number = 20): void {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const radius = size / 2;

  // Green circle background - WA brand green
  doc.setFillColor(34, 139, 34);
  doc.circle(centerX, centerY, radius, 'F');

  // White WA text inside
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(size * 0.5);
  doc.setFont('helvetica', 'bold');
  doc.text('WA', centerX, centerY + 1, { align: 'center', baseline: 'middle' });

  // "Welding Alloys" text next to logo
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Welding', x + size + 2, y + size * 0.35);
  doc.text('Alloys', x + size + 2, y + size * 0.65);
}

/**
 * Sync version for non-async contexts
 */
function waDrawWALogo(doc: jsPDF, x: number, y: number, size: number = 20): void {
  waDrawWALogoFallback(doc, x, y, size);
}

/**
 * Adds the real WA logo from local file or URL
 */
async function waAddRealLogo(doc: jsPDF, x: number, y: number, size: number = 25): Promise<void> {
  try {
    // Try to load the PNG logo from public folder
    const logoUrl = '/welding_alloys_logo.png';
    const base64 = await waFetchImageAsBase64(logoUrl);

    if (base64) {
      doc.addImage(base64, 'PNG', x, y, size, size);
      // Add "Welding Alloys" text next to logo
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Welding', x + size + 3, y + 7);
      doc.text('Alloys', x + size + 3, y + 13);
    } else {
      // Fallback to drawn logo
      waDrawWALogo(doc, x, y, size);
    }
  } catch {
    // Fallback to drawn logo
    waDrawWALogo(doc, x, y, size);
  }
}

function waDrawCircledNumber(doc: jsPDF, num: number, x: number, y: number, radius: number = 5): void {
  doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.circle(x, y, radius, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(radius * 1.8);
  doc.setFont('helvetica', 'bold');
  doc.text(num.toString(), x, y + 0.5, { align: 'center', baseline: 'middle' });
  doc.setTextColor(0, 0, 0);
}

function waDrawProgressBar(doc: jsPDF, x: number, y: number, width: number, height: number, segments: number, filled: number): void {
  const segmentWidth = (width - (segments - 1) * 1) / segments;

  for (let i = 0; i < segments; i++) {
    const segX = x + i * (segmentWidth + 1);
    if (i < filled) {
      doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    } else {
      doc.setFillColor(220, 220, 220);
    }
    doc.rect(segX, y, segmentWidth, height, 'F');
  }
}

function waDrawImagePlaceholder(doc: jsPDF, x: number, y: number, w: number, h: number): void {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, w, h, 3, 3, 'S');

  const iconSize = Math.min(w, h) * 0.4;
  const centerX = x + w / 2;
  const centerY = y + h / 2;

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(1);

  // Mountains
  doc.line(centerX - iconSize / 2, centerY + iconSize / 4, centerX - iconSize / 6, centerY - iconSize / 4);
  doc.line(centerX - iconSize / 6, centerY - iconSize / 4, centerX + iconSize / 6, centerY + iconSize / 4);
  doc.line(centerX, centerY, centerX + iconSize / 3, centerY - iconSize / 3);
  doc.line(centerX + iconSize / 3, centerY - iconSize / 3, centerX + iconSize / 2, centerY + iconSize / 4);

  // Sun circle
  doc.circle(centerX - iconSize / 3, centerY - iconSize / 4, iconSize / 8, 'S');

  // Plus circle at bottom right
  const plusX = x + w - 8;
  const plusY = y + h - 8;
  doc.setFillColor(255, 255, 255);
  doc.circle(plusX, plusY, 5, 'FD');
  doc.setLineWidth(1.5);
  doc.line(plusX - 2.5, plusY, plusX + 2.5, plusY);
  doc.line(plusX, plusY - 2.5, plusX, plusY + 2.5);
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

function waDrawIcon(doc: jsPDF, type: string, x: number, y: number, size: number = 8): void {
  doc.setDrawColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setLineWidth(0.5);

  switch (type) {
    case 'industry':
      doc.rect(x, y + size * 0.3, size * 0.6, size * 0.7, 'S');
      doc.rect(x + size * 0.7, y + size * 0.5, size * 0.3, size * 0.5, 'S');
      doc.line(x + size * 0.15, y, x + size * 0.15, y + size * 0.3);
      doc.line(x + size * 0.45, y + size * 0.1, x + size * 0.45, y + size * 0.3);
      break;
    case 'segment':
      doc.circle(x + size / 2, y + size / 2, size / 3, 'F');
      break;
    case 'workshop':
      doc.circle(x + size / 2, y + size / 2, size / 3, 'S');
      break;
    case 'worktype':
      doc.line(x, y + size, x + size, y);
      doc.circle(x + size * 0.8, y + size * 0.2, size * 0.15, 'S');
      break;
    case 'location':
      doc.circle(x + size / 2, y + size * 0.35, size * 0.25, 'S');
      doc.line(x + size * 0.25, y + size * 0.5, x + size / 2, y + size);
      doc.line(x + size * 0.75, y + size * 0.5, x + size / 2, y + size);
      break;
    default:
      doc.circle(x + size / 2, y + size / 2, size / 3, 'S');
  }
}

function waDrawConfidentialFooter(doc: jsPDF, options?: PDFExportOptions): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const userName = options?.exportedByName || '[User Name]';
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  doc.setFontSize(7);
  doc.setTextColor(COLORS.red.r, COLORS.red.g, COLORS.red.b);
  doc.setFont('helvetica', 'normal');

  const footerText = `Internal use only. Confidential \u2013 Printed by ${userName} on ${dateStr}. Personal copy, external distribution prohibited.`;
  doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: 'center' });
}

// ============ PAGE 1: MAIN CASE STUDY ============

async function waGeneratePage1(
  doc: jsPDF,
  data: CaseStudyPDFData,
  imageUrls: string[],
  options?: PDFExportOptions
): Promise<void> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  let y = 8;

  // ===== HEADER =====
  // White background header with green text
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 18, 'F');

  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INDUSTRIAL CHALLENGE REPORT', margin, 12);

  // WA Logo on right - try to load real logo (positioned same as page 2)
  await waDrawWALogoAsync(doc, pageWidth - 42, 5, 16);

  y = 22;

  // ===== TRANSLATION NOTICE =====
  if (data.originalLanguage && data.originalLanguage !== 'en') {
    doc.setFillColor(COLORS.yellow.r, COLORS.yellow.g, COLORS.yellow.b);
    doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
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
    { label: 'Application Case study', type: 'APPLICATION' },
    { label: 'Tech Case study', type: 'TECH' },
    { label: 'Star case study', type: 'STAR' },
  ];

  let tabX = margin;
  types.forEach(({ label, type }, idx) => {
    const isActive = data.type === type;
    const textWidth = doc.getTextWidth(label);

    if (isActive) {
      doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
      doc.setFont('helvetica', 'bold');
      doc.setDrawColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
      doc.setLineWidth(1);
      doc.line(tabX, y + 6, tabX + textWidth, y + 6);
    } else {
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(label, tabX, y + 4);

    if (idx < types.length - 1) {
      tabX += textWidth + 5;
      doc.setTextColor(150, 150, 150);
      doc.text('|', tabX, y + 4);
      tabX += 8;
    }
  });

  y += 12;

  // ===== METADATA BOX =====
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(230, 230, 230);
  doc.rect(margin, y, pageWidth - margin * 2, 14, 'FD');

  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');

  const metaCol1 = margin + 3;
  const metaCol2 = margin + 25;
  const metaCol3 = margin + 80;
  const metaCol4 = margin + 105;

  doc.text('Written by:', metaCol1, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(data.contributor.name, metaCol2, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.text('Date of approval:', metaCol3, y + 5);
  doc.setFont('helvetica', 'bold');
  const approvalText = data.approvedAt
    ? `${waFormatDate(data.approvedAt)}${data.approver ? ' - by ' + data.approver.name : ''}`
    : 'Pending';
  doc.text(approvalText, metaCol4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.text('Date of job:', metaCol1, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.text(waFormatDate(data.jobDate || data.createdAt) || 'N/A', metaCol2, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.text('Revision N\u00B0:', metaCol3, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.text(data.revision || 'V1', metaCol4, y + 10);

  y += 18;

  // ===== HORIZONTAL INFO ROW =====
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 3;

  const infoItems = [
    { icon: 'industry', label: data.industry.toUpperCase() },
    { icon: 'segment', label: data.customerSegment || data.customerName.split(' ')[0].toUpperCase() },
    { icon: 'workshop', label: data.subSegment || 'WORKSHOP' },
    { icon: 'worktype', label: data.workType?.toUpperCase() || 'PREVENTIVE' },
    { icon: 'location', label: data.country?.toUpperCase() || data.location.toUpperCase() },
  ];

  const itemWidth = (pageWidth - margin * 2) / infoItems.length;
  infoItems.forEach((item, idx) => {
    const itemX = margin + idx * itemWidth;
    waDrawIcon(doc, item.icon, itemX + 2, y, 8);
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, itemX + 12, y + 6);
  });

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customerName, margin + 14, y + 12);

  y += 18;

  // ===== ① APPLICATION DETAILS =====
  waDrawCircledNumber(doc, 1, margin + 4, y + 3, 4);
  doc.setFontSize(10);
  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFont('helvetica', 'bold');
  doc.text('APPLICATION DETAILS', margin + 12, y + 5);
  y += 10;

  // General Description box
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(230, 230, 230);
  doc.rect(margin, y, pageWidth - margin * 2, 25, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('* GENERAL DESCRIPTION *', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const descLines = doc.splitTextToSize(data.problemDescription, pageWidth - margin * 2 - 6);
  doc.text(descLines.slice(0, 4), margin + 3, y + 11);

  y += 28;

  // ===== WEAR TYPES + PREVIOUS SOLUTION =====
  const wearColWidth = (pageWidth - margin * 2) * 0.45;
  const prevColStart = margin + wearColWidth + 5;
  const prevColWidth = pageWidth - margin - prevColStart;

  const wearTypes = [
    { name: 'Abrasion', filled: data.wearType.some(w => w.toLowerCase().includes('abrasion')) ? 5 : 0 },
    { name: 'Impact', filled: data.wearType.some(w => w.toLowerCase().includes('impact')) ? 4 : 0 },
    { name: 'Metal-metal', filled: data.wearType.some(w => w.toLowerCase().includes('metal')) ? 3 : 0 },
    { name: 'Temperature', filled: data.wearType.some(w => w.toLowerCase().includes('temp')) ? 4 : 0 },
    { name: 'Corrosion', filled: data.wearType.some(w => w.toLowerCase().includes('corrosion')) ? 5 : 0 },
    { name: 'Other (*)', filled: data.wearType.some(w => !['abrasion', 'impact', 'metal', 'temp', 'corrosion'].some(t => w.toLowerCase().includes(t))) ? 2 : 0 },
  ];

  doc.setFontSize(7);
  wearTypes.forEach((wt, idx) => {
    const rowY = y + idx * 6;
    doc.setTextColor(80, 80, 80);
    doc.text(wt.name, margin, rowY + 3);
    waDrawProgressBar(doc, margin + 25, rowY, wearColWidth - 30, 4, 6, wt.filled);
  });

  // Previous Solution box
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(230, 230, 230);
  doc.rect(prevColStart, y, prevColWidth, 30, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('* PREVIOUS SOLUTION *', prevColStart + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  if (data.previousSolution) {
    const prevLines = doc.splitTextToSize(data.previousSolution, prevColWidth - 6);
    doc.text(prevLines.slice(0, 2), prevColStart + 3, y + 11);
  } else {
    doc.text('Include previous service life and ideally', prevColStart + 3, y + 11);
    doc.text('the name of the competitor who did it', prevColStart + 3, y + 15);
  }

  if (data.previousServiceLife) {
    doc.setFontSize(7);
    doc.text(`Previous service life = ${data.previousServiceLife}`, prevColStart + 10, y + 25);
  }

  y += 38;

  // ===== ② SOLUTION PROVIDED =====
  waDrawCircledNumber(doc, 2, margin + 4, y + 3, 4);
  doc.setFontSize(10);
  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFont('helvetica', 'bold');
  doc.text('SOLUTION PROVIDED', margin + 12, y + 5);
  y += 10;

  // Image row - use real images if available
  const imgCount = 3;
  const imgGap = 8;
  const totalImgWidth = pageWidth - margin * 2;
  const imgWidth = (totalImgWidth - (imgCount - 1) * imgGap) / imgCount;
  const imgHeight = 28;

  for (let i = 0; i < imgCount; i++) {
    const imgX = margin + i * (imgWidth + imgGap);
    const imageUrl = imageUrls[i] || null;
    await waDrawImage(doc, imageUrl, imgX, y, imgWidth, imgHeight);
  }

  y += imgHeight + 5;

  // Technical Details box
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(230, 230, 230);
  doc.rect(margin, y, (pageWidth - margin * 2) * 0.48, 22, 'FD');

  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('* TECHNICAL DETAILS *', margin + 3, y + 4);

  doc.setFont('helvetica', 'normal');
  const techDetails = [
    { label: 'Base metal', value: data.baseMetal || 'S235 low alloyed steel' },
    { label: 'General dimension', value: data.generalDimensions || '' },
    { label: 'Product(s) used', value: `${data.waProduct}${data.waProductDiameter ? ' ' + data.waProductDiameter : ''}` },
  ];

  techDetails.forEach((detail, idx) => {
    doc.text(detail.label, margin + 3, y + 8 + idx * 4);
    doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    doc.text(detail.value, margin + 35, y + 8 + idx * 4);
    doc.setTextColor(0, 0, 0);
  });

  // WA Solution box
  const solBoxX = margin + (pageWidth - margin * 2) * 0.5;
  const solBoxW = (pageWidth - margin * 2) * 0.48;

  doc.setFillColor(250, 250, 250);
  doc.rect(solBoxX, y, solBoxW, 22, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('* WA SOLUTION PROVIDED *', solBoxX + 3, y + 4);

  doc.setFont('helvetica', 'normal');
  const solLines = doc.splitTextToSize(data.waSolution, solBoxW - 6);
  doc.text(solLines.slice(0, 3), solBoxX + 3, y + 9);

  const duration = [
    data.jobDurationDays && `${data.jobDurationDays} days`,
    data.jobDurationHours && `${data.jobDurationHours}h`,
    data.jobDurationWeeks && `${data.jobDurationWeeks}w`,
  ].filter(Boolean).join(' ') || 'xx days';

  doc.text(`Job duration: ${duration}`, solBoxX + 3, y + 20);

  y += 26;

  // ===== ③ BUSINESS IMPACT =====
  waDrawCircledNumber(doc, 3, margin + 4, y + 3, 4);
  doc.setFontSize(10);
  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFont('helvetica', 'bold');
  doc.text('BUSINESS IMPACT', margin + 12, y + 5);
  y += 10;

  const currency = waGetCurrency(data.costCalculator?.currency);
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  doc.text('Solution value / revenue:', margin, y + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(
    data.solutionValueRevenue ? `${currency}${data.solutionValueRevenue.toLocaleString()}` : `XXXX ${currency}`,
    margin + 45, y + 4
  );

  doc.setFont('helvetica', 'normal');
  doc.text('Annual potential revenue:', margin, y + 9);
  doc.setFont('helvetica', 'bold');
  doc.text(
    data.annualPotentialRevenue ? `${currency}${data.annualPotentialRevenue.toLocaleString()}` : `XXXXX ${currency}`,
    margin + 45, y + 9
  );

  // Technical Advantages box
  const advBoxX = margin + (pageWidth - margin * 2) * 0.5;
  const advBoxW = (pageWidth - margin * 2) * 0.48;

  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(230, 230, 230);
  doc.rect(advBoxX, y - 2, advBoxW, 22, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('* TECHNICAL ADVANTAGES *', advBoxX + 3, y + 3);

  doc.setFont('helvetica', 'normal');
  if (data.technicalAdvantages) {
    const advLines = doc.splitTextToSize(data.technicalAdvantages, advBoxW - 6);
    doc.text(advLines.slice(0, 3), advBoxX + 3, y + 8);
  } else {
    doc.setFontSize(6);
    doc.text('Describe the technical benefits of the WA solution compared to the previous', advBoxX + 3, y + 8);
    doc.text('one. For example: longer service life, improved performance, reduced wear.', advBoxX + 3, y + 12);
  }

  y += 24;

  // Expected service life
  doc.setFillColor(COLORS.lightGreen.r, COLORS.lightGreen.g, COLORS.lightGreen.b);
  doc.roundedRect(margin, y, 80, 8, 2, 2, 'F');

  doc.setFontSize(7);
  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Expected or new calculated service life = ${data.expectedServiceLife || 'xxx h'}`,
    margin + 3, y + 5
  );

  waDrawConfidentialFooter(doc, options);
}

// ============ PAGE 2: COST CALCULATOR + WPS ============

async function waGeneratePage2(doc: jsPDF, data: CaseStudyPDFData, options?: PDFExportOptions): Promise<void> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  let y = 10;

  // Use async logo loading
  await waDrawWALogoAsync(doc, pageWidth - 42, 5, 16);

  // ===== ④ COST REDUCTION CALCULATOR (STAR only) =====
  if (data.type === 'STAR' && data.costCalculator) {
    const cc = data.costCalculator;
    const currency = waGetCurrency(cc.currency);

    // Calculate using new formula if we have the values
    const A = cc.costOfPart || 0;      // Cost of Part
    const E = cc.partsUsedPerYear || 0; // Parts per Year
    const F = cc.maintenanceRepairCost || 0; // Maintenance
    const G = cc.disassemblyCost || 0;       // Disassembly
    const H = cc.downtimeCost || 0;          // Downtime

    // Calculate annual costs using new formula
    const calculatedCostBefore = E > 0 ? waCalculateAnnualCost(A, E, F, G, H) : (cc.totalCostBefore || 0);

    // For WA solution, we use the WA solution cost instead of old part cost
    const waCost = cc.costOfWaSolution || A;
    const calculatedCostAfter = E > 0 ? waCalculateAnnualCost(waCost, E, F * 0.5, G * 0.5, H * 0.5) : (cc.totalCostAfter || 0);

    const savings = calculatedCostBefore - calculatedCostAfter;
    const savingsPercent = calculatedCostBefore > 0
      ? Math.round((savings / calculatedCostBefore) * 100)
      : (cc.savingsPercentage || 0);

    waDrawCircledNumber(doc, 4, margin + 4, y + 3, 4);
    doc.setFontSize(11);
    doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    doc.setFont('helvetica', 'bold');
    doc.text('COST REDUCTION CALCULATOR', margin + 12, y + 5);
    y += 12;

    // INPUT Section
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(230, 230, 230);
    doc.rect(margin, y, (pageWidth - margin * 2) * 0.65, 55, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('* INPUT *', margin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    const inputY = y + 10;
    const labelX = margin + 3;
    const valueX = margin + 75;

    const inputs = [
      { label: 'Equipment/part name:', value: cc.equipmentName || data.componentWorkpiece },
      { label: `A - Cost of the current (old) part (${currency})`, value: A ? `${currency}${waFormatNumber(A)}` : `XXXX ${currency}` },
      { label: `Cost of the WA solution (${currency})`, value: waCost ? `${currency}${waFormatNumber(waCost)}` : `XXXX ${currency}` },
      { label: 'Old solution lifetime', value: cc.oldSolutionLifetimeDays ? `${cc.oldSolutionLifetimeDays} days` : '(hours, days, weeks)' },
      { label: 'WA solution lifetime', value: cc.waSolutionLifetimeDays ? `${cc.waSolutionLifetimeDays} days` : '(hours, days, weeks)' },
      { label: 'E - Number of parts used per year', value: E ? `> ${E}` : '> 20' },
      { label: `F - Maintenance/repair cost (${currency})`, value: F ? `> ${currency}${waFormatNumber(F)}` : '>' },
      { label: `G - Disassembly/assembly cost (${currency})`, value: G ? `> ${currency}${waFormatNumber(G)}` : '>' },
      { label: `H - Downtime cost (${currency})`, value: H ? `> ${currency}${waFormatNumber(H)}` : '>' },
    ];

    inputs.forEach((input, idx) => {
      doc.text(input.label, labelX, inputY + idx * 5);
      doc.text(input.value, valueX, inputY + idx * 5);
    });

    // Formula explanation removed per user request

    // Savings percentage badge
    if (savingsPercent > 0) {
      doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
      doc.circle(margin + 105, inputY + 17, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`+${savingsPercent}%`, margin + 105, inputY + 18, { align: 'center' });
    }

    // OUTPUT Section
    const outputX = margin + (pageWidth - margin * 2) * 0.67;
    const outputW = (pageWidth - margin * 2) * 0.33;

    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(230, 230, 230);
    doc.rect(outputX, y, outputW, 35, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('* OUTPUT *', outputX + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);

    const displayCostBefore = cc.totalCostBefore || calculatedCostBefore;
    const displayCostAfter = cc.totalCostAfter || calculatedCostAfter;
    const displaySavings = cc.annualSavings || savings;
    const displaySavingsPercent = cc.savingsPercentage || savingsPercent;

    doc.text('Annual cost of current solution', outputX + 3, y + 11);
    const costBeforeText = displayCostBefore ? `${currency}${waFormatNumber(Math.round(displayCostBefore))}` : `xxxx ${currency}`;
    doc.text(costBeforeText, outputX + 3, y + 15);

    doc.text('Annual cost with WA solution', outputX + 3, y + 20);
    doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    const costAfterText = displayCostAfter ? `${currency}${waFormatNumber(Math.round(displayCostAfter))}` : `xxx ${currency}`;
    doc.text(costAfterText, outputX + 3, y + 24);

    // Annual cost reduction box
    doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    doc.roundedRect(outputX + 3, y + 27, outputW - 6, 7, 1, 1, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    // Savings is already a positive value representing the amount saved
    const savingsText = displaySavings
      ? `${currency}${waFormatNumber(Math.round(displaySavings))} (${displaySavingsPercent}%)`
      : `XXX (XX%)`;
    doc.text(savingsText, outputX + outputW / 2, y + 31.5, { align: 'center' });

    // EXTRA BENEFITS Section
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(230, 230, 230);
    doc.rect(outputX, y + 36, outputW, 19, 'FD');

    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('* EXTRA BENEFITS *', outputX + 3, y + 41);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    if (cc.extraBenefits) {
      const benefitLines = doc.splitTextToSize(cc.extraBenefits, outputW - 6);
      doc.text(benefitLines.slice(0, 2), outputX + 3, y + 46);
    } else {
      doc.text('e.g. fewer stoppages, reduced', outputX + 3, y + 46);
      doc.text('stock levels, spare equipment', outputX + 3, y + 50);
    }

    y += 58;
  }

  // ===== ⑤ WELDING PROCEDURE SPECIFICATION =====
  if ((data.type === 'TECH' || data.type === 'STAR') && data.wps) {
    const sectionNum = data.type === 'STAR' ? 5 : 4;

    waDrawCircledNumber(doc, sectionNum, margin + 4, y + 3, 4);
    doc.setFontSize(11);
    doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
    doc.setFont('helvetica', 'bold');
    doc.text('WELDING PROCEDURE SPECIFICATION', margin + 12, y + 5);
    y += 12;

    const wps = data.wps;
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);

    const col1X = margin;
    const col2X = margin + 45;
    const col3X = margin + 100;
    const col4X = margin + 145;

    const wpsData = [
      [
        { label: 'Number of layers:', value: wps.numberOfLayers || '3' },
        { label: 'Process:', value: wps.process || 'FCAW-S' },
        { label: 'Technique:', value: wps.technique || 'Automatic' },
        { label: 'Welding position:', value: wps.weldingPosition || 'PA (flat)' },
        { label: 'Torch position:', value: wps.torchPosition || 'Pull' },
        { label: '', value: '' },
        { label: 'Base metal:', value: wps.baseMetal || 'S235' },
        { label: 'Thickness:', value: wps.thickness || '150mm' },
        { label: 'Surface preparation:', value: wps.surfacePreparation || 'Grinding' },
      ],
      [
        { label: 'Product name:', value: wps.productName || '', isGreen: true },
        { label: 'Diameter:', value: wps.diameter || '2.8 mm' },
        { label: '', value: '' },
        { label: 'Shielding gas:', value: wps.shieldingGas || 'Not required' },
        { label: 'Flow rate:', value: wps.flowRate || '\u2013' },
        { label: 'Flux:', value: wps.flux || '\u2013' },
        { label: '', value: '' },
        { label: 'Stick-out:', value: wps.stickOut || '20\u201325 mm' },
        { label: 'Type of current:', value: wps.currentType || 'DC' },
        { label: 'Wire speed:', value: wps.wireSpeed || '2.5\u20135.0 m/min' },
        { label: 'Intensity:', value: wps.intensity || '180\u2013280 A' },
        { label: 'Voltage:', value: wps.voltage || '24\u201330 V' },
        { label: 'Welding speed:', value: wps.weldingSpeed || '100\u2013250 mm/min' },
        { label: '', value: '' },
        { label: 'Oscillation width:', value: wps.oscillationWidth || '10\u201320 mm' },
        { label: 'Oscillation speed:', value: wps.oscillationSpeed || '20\u201340 mm/min' },
        { label: '', value: '' },
        { label: 'Preheat temp:', value: wps.preheatTemperature || '150\u2013200 \u00B0C' },
        { label: 'Interpass temp:', value: wps.interpassTemperature || '\u2264250 \u00B0C' },
        { label: 'PWHT:', value: wps.pwht || 'Not required' },
      ],
    ];

    wpsData[0].forEach((item, idx) => {
      if (item.label) {
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, col1X, y + idx * 4.5);
        doc.setFont('helvetica', 'bold');
        doc.text(item.value, col2X, y + idx * 4.5);
      }
    });

    wpsData[1].forEach((item, idx) => {
      if (item.label) {
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, col3X, y + idx * 4.5);
        doc.setFont('helvetica', 'bold');
        if (item.label.includes('Product')) {
          doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
        }
        doc.text(item.value, col4X, y + idx * 4.5);
        doc.setTextColor(0, 0, 0);
      }
    });
  }

  waDrawConfidentialFooter(doc, options);
}

// ============ PAGE 3: IMAGES ============

async function waGeneratePage3(
  doc: jsPDF,
  data: CaseStudyPDFData,
  imageUrls: string[],
  options?: PDFExportOptions
): Promise<void> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  let y = 10;

  // Use async logo loading
  await waDrawWALogoAsync(doc, pageWidth - 42, 5, 16);

  waDrawCircledNumber(doc, data.type === 'STAR' ? 6 : 5, margin + 4, y + 3, 4);
  doc.setFontSize(11);
  doc.setTextColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.setFont('helvetica', 'bold');
  doc.text('CASE STUDY IMAGES', margin + 12, y + 5);
  y += 15;

  // Image grid (3x2)
  const imgCols = 3;
  const imgRows = 2;
  const imgGap = 10;
  const totalWidth = pageWidth - margin * 2;
  const imgWidth = (totalWidth - (imgCols - 1) * imgGap) / imgCols;
  const imgHeight = 55;

  let imgIndex = 3; // Start from index 3 (first 3 shown on page 1)

  for (let row = 0; row < imgRows; row++) {
    for (let col = 0; col < imgCols; col++) {
      const imgX = margin + col * (imgWidth + imgGap);
      const imgY = y + row * (imgHeight + imgGap);
      const imageUrl = imageUrls[imgIndex] || null;
      await waDrawImage(doc, imageUrl, imgX, imgY, imgWidth, imgHeight);
      imgIndex++;
    }
  }

  waDrawConfidentialFooter(doc, options);
}

// ============ MAIN EXPORT FUNCTIONS ============

/**
 * Generates PDF asynchronously (supports real image embedding)
 */
export async function waGenerateCaseStudyPDFAsync(
  data: CaseStudyPDFData,
  options?: PDFExportOptions
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Normalize images to URL strings
  const imageUrls = waNormalizeImages(data.images);

  // Page 1: Main Case Study (all types)
  await waGeneratePage1(doc, data, imageUrls, options);

  // Page 2: Cost Calculator + WPS (TECH and STAR)
  if (data.type === 'TECH' || data.type === 'STAR') {
    if (data.costCalculator || data.wps) {
      doc.addPage();
      await waGeneratePage2(doc, data, options);
    }
  }

  // Page 3: Images (TECH and STAR with more than 3 images)
  if ((data.type === 'TECH' || data.type === 'STAR') && imageUrls.length > 3) {
    doc.addPage();
    await waGeneratePage3(doc, data, imageUrls, options);
  }

  return doc;
}

/**
 * Synchronous PDF generation (falls back to placeholders for images)
 */
export function generateCaseStudyPDF(data: CaseStudyPDFData, options?: PDFExportOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // For sync version, we'll use placeholders
  // The async version should be preferred for real images
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;

  // Simplified sync page 1
  doc.setFillColor(COLORS.waGreen.r, COLORS.waGreen.g, COLORS.waGreen.b);
  doc.rect(0, 0, pageWidth, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INDUSTRIAL CHALLENGE REPORT', margin, 12);
  waDrawWALogo(doc, pageWidth - 42, 20, 16);

  // Add note to use async version
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text('PDF generation in progress...', margin, 40);
  doc.text(`Case Study: ${data.customerName}`, margin, 50);
  doc.text(`Type: ${data.type}`, margin, 60);

  waDrawConfidentialFooter(doc, options);

  return doc;
}

/**
 * Downloads the PDF asynchronously with real images
 */
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
    // Fallback to sync version
    const doc = generateCaseStudyPDF(data, options);
    const fileName = `${data.customerName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.type}_CaseStudy.pdf`;
    doc.save(fileName);
  }
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  waHasPrivilegedAccess,
  waObfuscateCustomerName,
  waObfuscateLocation,
  type CaseStudyWithUser,
} from '@/lib/utils/waDataObfuscation';
import type { Role } from '@prisma/client';
import { waFormatJobType, waGetProductDisplay } from './waUtils';

// WA Brand Colors (from PowerPoint theme)
const COLORS = {
  primary: [0, 128, 0] as [number, number, number],      // WA Green
  secondary: [68, 84, 106] as [number, number, number],  // Dark blue-gray
  accent: [112, 173, 71] as [number, number, number],    // Light green
  warning: [237, 125, 49] as [number, number, number],   // Orange
  star: [255, 192, 0] as [number, number, number],       // Gold for STAR
  tech: [147, 51, 234] as [number, number, number],      // Purple for TECH
  application: [91, 155, 213] as [number, number, number], // Blue for APPLICATION
  text: [0, 0, 0] as [number, number, number],
  textLight: [100, 100, 100] as [number, number, number],
  background: [245, 245, 245] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  red: [220, 53, 69] as [number, number, number],
};

// Language names for translation notice
export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  pt: 'Portuguese', it: 'Italian', zh: 'Chinese', ja: 'Japanese',
  ko: 'Korean', ru: 'Russian', ar: 'Arabic', hi: 'Hindi',
  nl: 'Dutch', pl: 'Polish', tr: 'Turkish',
};

// Extended PDF data interface matching PowerPoint structure
export interface CaseStudyPDFDataV2 {
  id: string;
  type: 'APPLICATION' | 'TECH' | 'STAR';
  title?: string | null;
  customerName: string;
  industry: string;
  location: string;
  country?: string;
  componentWorkpiece: string;
  workType: string;
  wearType: string[];
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
  annualPotentialRevenue?: number;
  customerSavingsAmount?: number;
  // New fields from PPT
  jobType?: string;
  jobTypeOther?: string;
  oem?: string;
  jobDurationHours?: string;
  jobDurationDays?: string;
  jobDurationWeeks?: string;
  // Contributor info
  contributor: {
    name: string;
    email?: string;
  };
  approver?: {
    name: string;
  };
  createdAt: Date;
  approvedAt?: Date;
  jobDate?: Date;
  revision?: string;
  // Translation
  originalLanguage?: string;
  translationAvailable?: boolean;
  translatedText?: string | null;
  // WPS data
  wps?: {
    baseMetalType?: string;
    baseMetalThickness?: string;
    surfacePreparation?: string;
    waProductName?: string;
    waProductDiameter?: string;
    weldingProcess?: string;
    technique?: string;
    weldingPosition?: string;
    torchPosition?: string;
    shieldingGas?: string;
    shieldingFlowRate?: string;
    flux?: string;
    standardDesignation?: string;
    stickOut?: string;
    currentType?: string;
    wireFeedSpeed?: string;
    intensity?: string;
    voltage?: string;
    travelSpeed?: string;
    oscillationWidth?: string;
    oscillationSpeed?: string;
    oscillationTempo?: string;
    oscillationStepOver?: string;
    preheatTemperature?: string;
    interpassTemperature?: string;
    postheatTemperature?: string;
    pwhtDetails?: string;
    layerNumbers?: string;
    hardness?: string;
  };
  // Cost Calculator data
  costCalculator?: {
    equipmentName?: string;
    costOfPart?: number;
    costOfWaSolution?: number;
    oldSolutionLifetimeDays?: number;
    waSolutionLifetimeDays?: number;
    partsUsedPerYear?: number;
    maintenanceRepairCostBefore?: number;
    maintenanceRepairCostAfter?: number;
    disassemblyCostBefore?: number;
    disassemblyCostAfter?: number;
    downtimeCostPerEvent?: number;
    currency?: string;
    totalCostBefore?: number;
    totalCostAfter?: number;
    annualSavings?: number;
    savingsPercentage?: number;
    extraBenefits?: string;
  };
  // Images
  images?: string[];
}

export interface PDFExportOptionsV2 {
  exportedByName?: string;
  exportedByEmail?: string;
  obfuscate?: boolean;
  exportingUserId?: string;
  exportingUserRole?: Role;
  caseStudyForObfuscation?: CaseStudyWithUser;
  useTranslation?: boolean;
  targetLanguage?: string;
  includeWPS?: boolean;
  includeCostCalculator?: boolean;
}

// Currency symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '\u20AC', USD: '$', GBP: '\u00A3', AUD: 'A$', CAD: 'C$',
  CHF: 'CHF', JPY: '\u00A5', CNY: '\u00A5', MAD: 'MAD',
};

function getCurrencySymbol(currency?: string): string {
  return CURRENCY_SYMBOLS[currency || 'EUR'] || '\u20AC';
}

// Helper to get translated content
function getTranslatedContent(
  caseStudy: CaseStudyPDFDataV2,
  options?: PDFExportOptionsV2
) {
  const originalLanguage = caseStudy.originalLanguage || 'en';
  const shouldUseTranslation = options?.useTranslation !== false;

  if (shouldUseTranslation && caseStudy.translationAvailable && caseStudy.translatedText) {
    try {
      const translation = JSON.parse(caseStudy.translatedText);
      const fields = translation.fields || {};
      return {
        problemDescription: fields.problemDescription || caseStudy.problemDescription,
        previousSolution: fields.previousSolution || caseStudy.previousSolution,
        technicalAdvantages: fields.technicalAdvantages || caseStudy.technicalAdvantages,
        waSolution: fields.waSolution || caseStudy.waSolution,
        isTranslated: true,
        originalLanguage,
        translatedToLanguage: translation.language,
      };
    } catch {
      // Fall through
    }
  }

  return {
    problemDescription: caseStudy.problemDescription,
    previousSolution: caseStudy.previousSolution,
    technicalAdvantages: caseStudy.technicalAdvantages,
    waSolution: caseStudy.waSolution,
    isTranslated: false,
    originalLanguage,
  };
}

// Add confidential footer to page
function addFooter(doc: jsPDF, options?: PDFExportOptionsV2): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Footer background
  doc.setFillColor(245, 245, 245);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');

  // Footer text
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);

  const userName = options?.exportedByName || '[User Name]';
  const dateStr = new Date().toLocaleDateString();

  doc.text('Internal use only.', 10, pageHeight - 9);
  doc.text(
    `Confidential - Printed by ${userName} on ${dateStr}. Personal copy, external distribution prohibited.`,
    10,
    pageHeight - 5
  );

  // Page number
  const pageCount = doc.getNumberOfPages();
  const currentPage = doc.getCurrentPageInfo().pageNumber;
  doc.text(`Page ${currentPage} of ${pageCount}`, pageWidth - 25, pageHeight - 5);
}

// Draw wear type checkboxes (matching PPT style)
function drawWearTypeCheckboxes(
  doc: jsPDF,
  wearTypes: string[],
  x: number,
  y: number
): number {
  const allTypes = ['Abrasion', 'Impact', 'Metal-metal', 'Temperature', 'Corrosion', 'Other'];
  const boxSize = 4;
  const lineHeight = 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('APPLICATION DETAILS', x, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  allTypes.forEach((type, idx) => {
    const isChecked = wearTypes.some(w =>
      w.toLowerCase().includes(type.toLowerCase()) ||
      type.toLowerCase().includes(w.toLowerCase())
    );

    // Draw checkbox
    doc.setDrawColor(100, 100, 100);
    doc.rect(x, y + (idx * lineHeight), boxSize, boxSize);

    if (isChecked) {
      // Draw checkmark
      doc.setFillColor(0, 128, 0);
      doc.rect(x + 0.5, y + (idx * lineHeight) + 0.5, boxSize - 1, boxSize - 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.text('\u2713', x + 1, y + (idx * lineHeight) + 3.5);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(7);
    }

    // Draw label
    doc.text(type, x + boxSize + 2, y + (idx * lineHeight) + 3);
  });

  return y + (allTypes.length * lineHeight) + 5;
}

// Main PDF generation function matching PPT layout
export function generateCaseStudyPDFV2(
  caseStudy: CaseStudyPDFDataV2,
  options?: PDFExportOptionsV2
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const translatedContent = getTranslatedContent(caseStudy, options);

  // Determine obfuscation
  let shouldObfuscate = options?.obfuscate ?? false;
  if (options?.caseStudyForObfuscation && options?.exportingUserId && options?.exportingUserRole) {
    shouldObfuscate = !waHasPrivilegedAccess(
      options.caseStudyForObfuscation,
      options.exportingUserId,
      options.exportingUserRole
    );
  }

  const displayCustomerName = shouldObfuscate && options?.caseStudyForObfuscation
    ? waObfuscateCustomerName(options.caseStudyForObfuscation, false)
    : caseStudy.customerName;

  const displayLocation = shouldObfuscate && options?.caseStudyForObfuscation
    ? waObfuscateLocation(options.caseStudyForObfuscation, false)
    : caseStudy.location;

  // ============ PAGE 1: MAIN CASE STUDY ============

  // Header bar with gradient effect
  doc.setFillColor(0, 100, 0); // Dark green
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setFillColor(0, 128, 0); // Lighter green overlay
  doc.rect(0, 0, pageWidth, 20, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INDUSTRIAL CHALLENGE REPORT', 10, 12);

  // Case type badges
  doc.setFontSize(8);
  const types = ['Application Case study', 'Tech Case study', 'Star case study'];
  const typeColors = [COLORS.application, COLORS.tech, COLORS.star];
  let badgeX = 10;

  types.forEach((type, idx) => {
    const isActive =
      (idx === 0 && caseStudy.type === 'APPLICATION') ||
      (idx === 1 && caseStudy.type === 'TECH') ||
      (idx === 2 && caseStudy.type === 'STAR');

    if (isActive) {
      doc.setFillColor(typeColors[idx][0], typeColors[idx][1], typeColors[idx][2]);
      doc.roundedRect(badgeX, 15, 35, 6, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(200, 200, 200);
    }
    doc.text(type.split(' ')[0], badgeX + 2, 19.5);
    badgeX += 38;
  });

  doc.setTextColor(0, 0, 0);
  let yPos = 30;

  // Left column - Industry & Location info
  const leftColWidth = 55;
  const rightColStart = leftColWidth + 5;

  // Industry box
  doc.setFillColor(0, 128, 0);
  doc.rect(5, yPos, leftColWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(caseStudy.industry.toUpperCase(), 8, yPos + 8);
  yPos += 15;

  // Customer name
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text(displayCustomerName, 8, yPos + 5);
  yPos += 10;

  // Location
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const locationText = caseStudy.country
    ? `${displayLocation}, ${caseStudy.country}`
    : displayLocation;
  doc.text(locationText, 8, yPos + 3);
  yPos += 10;

  // Wear type checkboxes
  yPos = drawWearTypeCheckboxes(doc, caseStudy.wearType, 8, yPos);

  // Metadata box
  doc.setFillColor(240, 240, 240);
  doc.rect(5, yPos, leftColWidth, 30, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(5, yPos, leftColWidth, 30, 'S');

  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  const metaY = yPos + 5;
  doc.text(`Written by: ${caseStudy.contributor.name}`, 8, metaY);
  doc.text(`Date of job: ${caseStudy.createdAt ? new Date(caseStudy.createdAt).toLocaleDateString() : 'N/A'}`, 8, metaY + 6);
  doc.text(`Date of approval: ${caseStudy.approvedAt ? new Date(caseStudy.approvedAt).toLocaleDateString() : 'Pending'}${caseStudy.approver ? ' - by ' + caseStudy.approver.name : ''}`, 8, metaY + 12);
  doc.text(`Revision: ${caseStudy.revision || 'V1'}`, 8, metaY + 18);

  // Right column content
  let rightY = 30;
  const contentWidth = pageWidth - rightColStart - 10;

  // Title/Component
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const titleText = caseStudy.title || caseStudy.componentWorkpiece;
  doc.text(titleText, rightColStart, rightY + 5);
  rightY += 12;

  // Work Type badge
  if (caseStudy.workType) {
    doc.setFillColor(0, 128, 0);
    doc.roundedRect(rightColStart, rightY, 25, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(caseStudy.workType.toUpperCase(), rightColStart + 2, rightY + 4.5);
    rightY += 10;
  }

  doc.setTextColor(0, 0, 0);

  // Previous Solution section
  if (translatedContent.previousSolution) {
    doc.setFillColor(255, 240, 240);
    doc.rect(rightColStart, rightY, contentWidth, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 0, 0);
    doc.text('PREVIOUS SOLUTION', rightColStart + 2, rightY + 5.5);
    rightY += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const prevLines = doc.splitTextToSize(translatedContent.previousSolution, contentWidth - 4);
    doc.text(prevLines.slice(0, 3), rightColStart + 2, rightY + 3);
    rightY += Math.min(prevLines.length, 3) * 4 + 5;

    if (caseStudy.previousServiceLife) {
      doc.setFontSize(7);
      doc.text(`Previous service life: ${caseStudy.previousServiceLife}`, rightColStart + 2, rightY);
      rightY += 5;
    }
  }

  // General Description / Problem section
  doc.setFillColor(240, 248, 255);
  doc.rect(rightColStart, rightY, contentWidth, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 80, 150);
  doc.text('GENERAL DESCRIPTION', rightColStart + 2, rightY + 5.5);
  rightY += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const problemLines = doc.splitTextToSize(translatedContent.problemDescription, contentWidth - 4);
  doc.text(problemLines.slice(0, 5), rightColStart + 2, rightY + 3);
  rightY += Math.min(problemLines.length, 5) * 4 + 8;

  // Technical Details section
  doc.setFillColor(245, 245, 245);
  doc.rect(rightColStart, rightY, contentWidth, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('TECHNICAL DETAILS', rightColStart + 2, rightY + 5.5);
  rightY += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  const techDetails = [
    ['Base metal', caseStudy.baseMetal],
    ['General dimensions', caseStudy.generalDimensions],
    ['Product(s) used', waGetProductDisplay({
      productCategory: caseStudy.productCategory,
      waProduct: caseStudy.waProduct,
      waProductDiameter: caseStudy.waProductDiameter,
      productDescription: caseStudy.productDescription,
    })],
    ['Job Type', waFormatJobType(caseStudy.jobType, caseStudy.jobTypeOther)],
    ['OEM', caseStudy.oem],
  ].filter(([, val]) => val);

  techDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, rightColStart + 2, rightY + 3);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), rightColStart + 35, rightY + 3);
    rightY += 5;
  });
  rightY += 5;

  // WA Solution section
  doc.setFillColor(220, 252, 231);
  doc.rect(rightColStart, rightY, contentWidth, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 100, 0);
  doc.text('WA SOLUTION PROVIDED', rightColStart + 2, rightY + 5.5);
  rightY += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const solutionLines = doc.splitTextToSize(translatedContent.waSolution, contentWidth - 4);
  doc.text(solutionLines.slice(0, 4), rightColStart + 2, rightY + 3);
  rightY += Math.min(solutionLines.length, 4) * 4 + 5;

  // Job duration if available
  const jobDuration = [
    caseStudy.jobDurationHours && `${caseStudy.jobDurationHours}h`,
    caseStudy.jobDurationDays && `${caseStudy.jobDurationDays}d`,
    caseStudy.jobDurationWeeks && `${caseStudy.jobDurationWeeks}w`,
  ].filter(Boolean).join(' ');

  if (jobDuration) {
    doc.text(`Job duration: ${jobDuration}`, rightColStart + 2, rightY + 3);
    rightY += 5;
  }

  // Service life comparison
  if (caseStudy.previousServiceLife || caseStudy.expectedServiceLife) {
    doc.setFontSize(8);
    if (caseStudy.previousServiceLife) {
      doc.text(`Previous service life = ${caseStudy.previousServiceLife}`, rightColStart + 2, rightY + 3);
      rightY += 5;
    }
    if (caseStudy.expectedServiceLife) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 128, 0);
      doc.text(`Expected/new service life = ${caseStudy.expectedServiceLife}`, rightColStart + 2, rightY + 3);
      doc.setTextColor(0, 0, 0);
      rightY += 8;
    }
  }

  // Technical Advantages section
  if (translatedContent.technicalAdvantages) {
    doc.setFillColor(240, 248, 255);
    doc.rect(rightColStart, rightY, contentWidth, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 80, 150);
    doc.text('TECHNICAL ADVANTAGES', rightColStart + 2, rightY + 5.5);
    rightY += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const advLines = doc.splitTextToSize(translatedContent.technicalAdvantages, contentWidth - 4);
    doc.text(advLines.slice(0, 4), rightColStart + 2, rightY + 3);
    rightY += Math.min(advLines.length, 4) * 4 + 8;
  }

  // Business Impact section
  if (caseStudy.solutionValueRevenue || caseStudy.annualPotentialRevenue || caseStudy.customerSavingsAmount) {
    doc.setFillColor(255, 250, 220);
    doc.rect(rightColStart, rightY, contentWidth, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(150, 100, 0);
    doc.text('BUSINESS IMPACT', rightColStart + 2, rightY + 5.5);
    rightY += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const currency = getCurrencySymbol(caseStudy.costCalculator?.currency);

    if (caseStudy.solutionValueRevenue) {
      doc.text(`Solution value / revenue: ${currency}${caseStudy.solutionValueRevenue.toLocaleString()}`, rightColStart + 2, rightY + 3);
      rightY += 5;
    }
    if (caseStudy.annualPotentialRevenue) {
      doc.text(`Annual potential revenue: ${currency}${caseStudy.annualPotentialRevenue.toLocaleString()}`, rightColStart + 2, rightY + 3);
      rightY += 5;
    }
    if (caseStudy.customerSavingsAmount) {
      doc.setTextColor(0, 128, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`Customer savings: ${currency}${caseStudy.customerSavingsAmount.toLocaleString()}`, rightColStart + 2, rightY + 3);
      rightY += 5;
    }
  }

  // Translation notice
  if (translatedContent.isTranslated && translatedContent.originalLanguage !== 'en') {
    const origLang = LANGUAGE_NAMES[translatedContent.originalLanguage] || translatedContent.originalLanguage;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.text(`This case study was originally written in ${origLang}. You are viewing the translated version.`, 10, pageHeight - 20);
  }

  // Add footer
  addFooter(doc, options);

  // ============ PAGE 2: WPS + COST CALCULATOR ============
  const includeWPS = options?.includeWPS !== false && caseStudy.wps;
  const includeCost = options?.includeCostCalculator !== false && caseStudy.costCalculator;

  if (includeWPS || includeCost) {
    doc.addPage();
    let y = 15;

    // Header
    doc.setFillColor(0, 128, 0);
    doc.rect(0, 0, pageWidth, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('WELDING PROCEDURE SPECIFICATION', 10, 8);

    if (includeWPS && caseStudy.wps) {
      y = 20;
      const wps = caseStudy.wps;
      const colWidth = (pageWidth - 20) / 2;

      // WPS data in two columns
      const leftCol = [
        ['Number of layers', wps.layerNumbers],
        ['Process', wps.weldingProcess],
        ['Technique', wps.technique],
        ['Welding position', wps.weldingPosition],
        ['Torch position', wps.torchPosition],
        ['Base metal', wps.baseMetalType],
        ['Thickness', wps.baseMetalThickness],
        ['Surface preparation', wps.surfacePreparation],
      ].filter(([, v]) => v);

      const rightCol = [
        ['Product name', wps.waProductName],
        ['Diameter', wps.waProductDiameter],
        ['Shielding gas', wps.shieldingGas],
        ['Flow rate', wps.shieldingFlowRate],
        ['Flux', wps.flux],
        ['Standard designation', wps.standardDesignation],
        ['Stick-out', wps.stickOut],
        ['Type of current', wps.currentType],
        ['Wire speed', wps.wireFeedSpeed],
        ['Intensity', wps.intensity],
        ['Voltage', wps.voltage],
        ['Welding speed', wps.travelSpeed],
        ['Oscillation width', wps.oscillationWidth],
        ['Oscillation speed', wps.oscillationSpeed],
        ['Oscillation tempo', wps.oscillationTempo],
        ['Stepover distance', wps.oscillationStepOver],
        ['Preheating temp', wps.preheatTemperature],
        ['Interpass temp', wps.interpassTemperature],
        ['PWHT', wps.pwhtDetails],
      ].filter(([, v]) => v);

      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);

      // Left column
      leftCol.forEach(([label, value], idx) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 12, y + (idx * 5));
        doc.setFont('helvetica', 'normal');
        doc.text(String(value), 45, y + (idx * 5));
      });

      // Right column
      rightCol.slice(0, 15).forEach(([label, value], idx) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, colWidth + 12, y + (idx * 5));
        doc.setFont('helvetica', 'normal');
        doc.text(String(value), colWidth + 50, y + (idx * 5));
      });

      y += Math.max(leftCol.length, Math.min(rightCol.length, 15)) * 5 + 10;
    }

    // Cost Calculator section
    if (includeCost && caseStudy.costCalculator) {
      const cc = caseStudy.costCalculator;
      const currency = getCurrencySymbol(cc.currency);

      // Section header
      doc.setFillColor(255, 250, 220);
      doc.rect(5, y, pageWidth - 10, 10, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(150, 100, 0);
      doc.text('COST REDUCTION CALCULATOR', 10, y + 7);
      y += 15;

      // INPUT section
      doc.setFillColor(240, 240, 240);
      doc.rect(5, y, (pageWidth - 15) / 2, 8, 'F');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('INPUT', 10, y + 5.5);
      y += 10;

      const inputData = [
        ['Equipment/part name', cc.equipmentName || caseStudy.componentWorkpiece],
        ['Cost of old solution', cc.costOfPart ? `${currency}${cc.costOfPart.toLocaleString()}` : '-'],
        ['Cost of WA solution', cc.costOfWaSolution ? `${currency}${cc.costOfWaSolution.toLocaleString()}` : '-'],
        ['Old solution lifetime', cc.oldSolutionLifetimeDays ? `${cc.oldSolutionLifetimeDays} days` : '-'],
        ['WA solution lifetime', cc.waSolutionLifetimeDays ? `${cc.waSolutionLifetimeDays} days` : '-'],
        ['Parts used per year', cc.partsUsedPerYear?.toString() || '-'],
        ['Maintenance cost (before)', cc.maintenanceRepairCostBefore ? `${currency}${cc.maintenanceRepairCostBefore.toLocaleString()}` : '-'],
        ['Disassembly cost', cc.disassemblyCostBefore ? `${currency}${cc.disassemblyCostBefore.toLocaleString()}` : '-'],
        ['Downtime cost', cc.downtimeCostPerEvent ? `${currency}${cc.downtimeCostPerEvent.toLocaleString()}` : '-'],
      ];

      doc.setFontSize(8);
      inputData.forEach(([label, value], idx) => {
        doc.setFont('helvetica', 'normal');
        doc.text(`${label}:`, 10, y + (idx * 5));
        doc.text(String(value), 55, y + (idx * 5));
      });

      // OUTPUT section - positioned to the right
      const outputX = (pageWidth + 5) / 2;
      let outputY = y - 10;

      doc.setFillColor(220, 252, 231);
      doc.rect(outputX, outputY, (pageWidth - 15) / 2, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 100, 0);
      doc.text('OUTPUT', outputX + 5, outputY + 5.5);
      outputY += 12;

      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      if (cc.totalCostBefore) {
        doc.setFont('helvetica', 'normal');
        doc.text('Annual cost (old):', outputX + 5, outputY);
        doc.text(`${currency}${cc.totalCostBefore.toLocaleString()}`, outputX + 50, outputY);
        outputY += 6;
      }

      if (cc.totalCostAfter) {
        doc.text('Annual cost (WA):', outputX + 5, outputY);
        doc.setTextColor(0, 128, 0);
        doc.text(`${currency}${cc.totalCostAfter.toLocaleString()}`, outputX + 50, outputY);
        outputY += 8;
      }

      if (cc.annualSavings && cc.savingsPercentage) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 128, 0);
        doc.text('ANNUAL SAVINGS:', outputX + 5, outputY);
        outputY += 7;
        doc.setFontSize(14);
        doc.text(`${currency}${cc.annualSavings.toLocaleString()} (${cc.savingsPercentage}%)`, outputX + 5, outputY);
      }

      y += inputData.length * 5 + 10;

      // Extra Benefits
      if (cc.extraBenefits) {
        doc.setFillColor(240, 248, 255);
        doc.rect(5, y, pageWidth - 10, 8, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 80, 150);
        doc.text('EXTRA BENEFITS', 10, y + 5.5);
        y += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        const benefitLines = doc.splitTextToSize(cc.extraBenefits, pageWidth - 20);
        doc.text(benefitLines.slice(0, 4), 10, y + 3);
      }
    }

    addFooter(doc, options);
  }

  return doc;
}

export function downloadCaseStudyPDFV2(
  caseStudy: CaseStudyPDFDataV2,
  options?: PDFExportOptionsV2
): void {
  const doc = generateCaseStudyPDFV2(caseStudy, options);
  const fileName = `${caseStudy.customerName.replace(/\s+/g, '_')}_CaseStudy_Report.pdf`;
  doc.save(fileName);
}

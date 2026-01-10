import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  waHasPrivilegedAccess,
  waObfuscateCustomerName,
  waObfuscateLocation,
  type CaseStudyWithUser,
} from '@/lib/utils/waDataObfuscation';
import type { Role } from '@prisma/client';

export interface CaseStudyPDFData {
  id: string;
  type: string;
  customerName: string;
  industry: string;
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
  waProduct: string;
  technicalAdvantages?: string;
  expectedServiceLife?: string;
  solutionValueRevenue?: number;
  annualPotentialRevenue?: number;
  customerSavingsAmount?: number;
  location: string;
  country?: string;
  contributor: {
    name: string;
    email: string;
  };
  approver?: {
    name: string;
  };
  createdAt: Date;
  approvedAt?: Date;
  // Translation fields
  originalLanguage?: string;
  translationAvailable?: boolean;
  translatedText?: string | null;
}

// Language code to full name mapping
export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  it: 'Italian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ru: 'Russian',
  ar: 'Arabic',
  hi: 'Hindi',
  nl: 'Dutch',
  pl: 'Polish',
  tr: 'Turkish',
};

// BRD 5.4.3 - PDF export options with personalized watermark
// BRD 6.2 - Privacy & Data Security - Obfuscation support
export interface PDFExportOptions {
  /** Name of the user downloading the PDF (for watermark) */
  exportedByName?: string;
  /** Email of the user downloading the PDF (for watermark) */
  exportedByEmail?: string;
  /** BRD 6.2 - Force obfuscation of customer data */
  obfuscate?: boolean;
  /** BRD 6.2 - Exporting user's ID for access check */
  exportingUserId?: string;
  /** BRD 6.2 - Exporting user's role for access check */
  exportingUserRole?: Role;
  /** BRD 6.2 - Original case study data for obfuscation context */
  caseStudyForObfuscation?: CaseStudyWithUser;
  /** Use translated content if available */
  useTranslation?: boolean;
  /** Target language for PDF content (e.g., 'en', 'es', 'fr') */
  targetLanguage?: string;
}

// Helper to parse translation data and get translated fields
// BRD: "System automatically translates content into Corporate English for the final PDF"
// By default, PDF uses English translation when available
function getTranslatedContent(
  caseStudy: CaseStudyPDFData,
  options?: PDFExportOptions
): {
  problemDescription: string;
  previousSolution?: string;
  technicalAdvantages?: string;
  waSolution: string;
  isTranslated: boolean;
  originalLanguage: string;
  translatedToLanguage?: string;
} {
  const originalLanguage = caseStudy.originalLanguage || 'en';

  // BRD: PDF defaults to English translation when available
  // useTranslation: false explicitly requests original content
  const shouldUseTranslation = options?.useTranslation !== false;

  // If translation is available and we should use it, return translated content
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
      // If parsing fails, fall through to return original content
    }
  }

  // Return original content
  return {
    problemDescription: caseStudy.problemDescription,
    previousSolution: caseStudy.previousSolution,
    technicalAdvantages: caseStudy.technicalAdvantages,
    waSolution: caseStudy.waSolution,
    isTranslated: false,
    originalLanguage,
  };
}

// BRD 5.4.3 - Helper to add watermark with personalization and "Internal Use Only"
function addWatermark(doc: jsPDF, options?: PDFExportOptions): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Main diagonal watermark
  doc.setTextColor(220, 220, 220);
  doc.setFontSize(50);
  doc.text('WELDING ALLOYS', pageWidth / 2, pageHeight / 2 - 10, {
    align: 'center',
    angle: 45,
  });

  // BRD 5.4.3 - Add "Internal Use Only" notice
  doc.setFontSize(20);
  doc.text('INTERNAL USE ONLY', pageWidth / 2, pageHeight / 2 + 15, {
    align: 'center',
    angle: 45,
  });

  // BRD 5.4.3 - Add personalized watermark with user name if provided
  if (options?.exportedByName) {
    doc.setFontSize(12);
    doc.text(`Downloaded by: ${options.exportedByName}`, pageWidth / 2, pageHeight / 2 + 35, {
      align: 'center',
      angle: 45,
    });
  }

  doc.setTextColor(0, 0, 0);
}

export function generateCaseStudyPDF(caseStudy: CaseStudyPDFData, options?: PDFExportOptions): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Get translated content if available and requested
  const translatedContent = getTranslatedContent(caseStudy, options);

  // BRD 6.2 - Determine if obfuscation should be applied
  let shouldObfuscate = options?.obfuscate ?? false;

  // If we have user context and case study data, check access permissions
  if (options?.caseStudyForObfuscation && options?.exportingUserId && options?.exportingUserRole) {
    const isPrivileged = waHasPrivilegedAccess(
      options.caseStudyForObfuscation,
      options.exportingUserId,
      options.exportingUserRole
    );
    shouldObfuscate = !isPrivileged;
  }

  // BRD 6.2 - Apply obfuscation to sensitive fields
  const displayCustomerName = shouldObfuscate && options?.caseStudyForObfuscation
    ? waObfuscateCustomerName(options.caseStudyForObfuscation, false)
    : caseStudy.customerName;

  const displayLocation = shouldObfuscate && options?.caseStudyForObfuscation
    ? waObfuscateLocation(options.caseStudyForObfuscation, false)
    : caseStudy.location;

  // Add watermark with personalization per BRD 5.4.3
  addWatermark(doc, options);

  // BRD 6.2 - Add "CONFIDENTIAL" watermark if obfuscated
  if (shouldObfuscate) {
    doc.setTextColor(255, 200, 200);
    doc.setFontSize(40);
    doc.text('CONFIDENTIAL', pageWidth / 2, pageHeight / 2 + 50, {
      align: 'center',
      angle: 45,
    });
    doc.setTextColor(0, 0, 0);
  }

  // Header
  doc.setFillColor(37, 99, 235); // Blue color
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('WELDING ALLOYS', 15, 15);
  doc.setFontSize(14);
  doc.text('Case Study Report', 15, 23);

  // Reset text color
  doc.setTextColor(0, 0, 0);
  yPos = 40;

  // Case Type Badge
  const typeColor =
    caseStudy.type === 'STAR' ? [234, 179, 8] :
    caseStudy.type === 'TECH' ? [147, 51, 234] :
    [37, 99, 235];
  doc.setFillColor(typeColor[0], typeColor[1], typeColor[2]);
  doc.setTextColor(255, 255, 255);
  doc.roundedRect(15, yPos, 30, 8, 2, 2, 'F');
  doc.setFontSize(10);
  doc.text(caseStudy.type, 30, yPos + 6, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // Translation indicator badge (if translated)
  if (translatedContent.isTranslated && translatedContent.translatedToLanguage) {
    const langName = LANGUAGE_NAMES[translatedContent.translatedToLanguage] || translatedContent.translatedToLanguage;
    doc.setFillColor(59, 130, 246); // Blue for translation
    doc.roundedRect(50, yPos, 45, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`Translated: ${langName}`, 72.5, yPos + 6, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }
  yPos += 15;

  // Title - BRD 6.2: Use obfuscated customer name if applicable
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${displayCustomerName} - ${caseStudy.componentWorkpiece}`, 15, yPos);
  yPos += 10;

  // Metadata - BRD 6.2: Use obfuscated location if applicable
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Industry: ${caseStudy.industry} | Location: ${displayLocation}`, 15, yPos);
  yPos += 6;
  doc.text(`Submitted by: ${caseStudy.contributor.name}`, 15, yPos);
  if (caseStudy.approver) {
    yPos += 5;
    doc.text(`Approved by: ${caseStudy.approver.name}`, 15, yPos);
  }

  // Original language indicator
  if (translatedContent.originalLanguage && translatedContent.originalLanguage !== 'en') {
    yPos += 5;
    const origLangName = LANGUAGE_NAMES[translatedContent.originalLanguage] || translatedContent.originalLanguage;
    doc.setTextColor(59, 130, 246);
    doc.text(`Originally written in ${origLangName}`, 15, yPos);
  }

  yPos += 12;
  doc.setTextColor(0, 0, 0);

  // Problem Description Section - Use translated content
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Problem Description', 15, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const problemLines = doc.splitTextToSize(translatedContent.problemDescription, pageWidth - 30);
  doc.text(problemLines, 15, yPos);
  yPos += problemLines.length * 5 + 8;

  // Check if we need a new page
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
    // Add watermark to new page
    addWatermark(doc, options);
  }

  // Technical Details Table
  const technicalData = [
    ['Work Type', caseStudy.workType],
    ['Wear Type', caseStudy.wearType.join(', ')],
    ['Base Metal', caseStudy.baseMetal || 'N/A'],
    ['Dimensions', caseStudy.generalDimensions || 'N/A'],
  ];

  if (translatedContent.previousSolution) {
    technicalData.push(['Previous Solution', translatedContent.previousSolution]);
  }
  if (caseStudy.previousServiceLife) {
    technicalData.push(['Previous Service Life', caseStudy.previousServiceLife]);
  }
  if (caseStudy.competitorName) {
    technicalData.push(['Competitor', caseStudy.competitorName]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Technical Details', '']],
    body: technicalData,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 15, right: 15 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
    // Add watermark to new page
    addWatermark(doc, options);
  }

  // WA Solution Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Welding Alloys Solution', 15, yPos);
  yPos += 7;

  const solutionData = [
    ['WA Solution', translatedContent.waSolution],
    ['WA Product', caseStudy.waProduct],
  ];

  if (caseStudy.expectedServiceLife) {
    solutionData.push(['Expected Service Life', caseStudy.expectedServiceLife]);
  }

  autoTable(doc, {
    startY: yPos,
    body: solutionData,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 15, right: 15 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Technical Advantages - Use translated content
  if (translatedContent.technicalAdvantages) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
      // Add watermark to new page
      addWatermark(doc, options);
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Technical Advantages', 15, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const advantagesLines = doc.splitTextToSize(translatedContent.technicalAdvantages, pageWidth - 30);
    doc.text(advantagesLines, 15, yPos);
    yPos += advantagesLines.length * 5 + 8;
  }

  // Financial Impact
  if (caseStudy.solutionValueRevenue || caseStudy.annualPotentialRevenue || caseStudy.customerSavingsAmount) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
      // Add watermark to new page
      addWatermark(doc, options);
    }

    const financialData = [];
    if (caseStudy.solutionValueRevenue) {
      financialData.push(['Solution Value', `$${caseStudy.solutionValueRevenue.toLocaleString()}`]);
    }
    if (caseStudy.annualPotentialRevenue) {
      financialData.push(['Annual Potential', `$${caseStudy.annualPotentialRevenue.toLocaleString()}`]);
    }
    if (caseStudy.customerSavingsAmount) {
      financialData.push(['Customer Savings', `$${caseStudy.customerSavingsAmount.toLocaleString()}`]);
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Financial Impact', '']],
      body: financialData,
      theme: 'striped',
      headStyles: { fillColor: [22, 163, 74] }, // Green color
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Footer on all pages - BRD 5.4.3 compliant
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);

    // BRD 5.4.3 - Add "INTERNAL USE ONLY" and personalized footer
    const footerText = options?.exportedByName
      ? `© ${new Date().getFullYear()} Welding Alloys Group - INTERNAL USE ONLY - Downloaded by: ${options.exportedByName}`
      : `© ${new Date().getFullYear()} Welding Alloys Group - INTERNAL USE ONLY`;

    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 15, pageHeight - 10);
  }

  return doc;
}

export function downloadCaseStudyPDF(caseStudy: CaseStudyPDFData, options?: PDFExportOptions): void {
  const doc = generateCaseStudyPDF(caseStudy, options);
  const fileName = `${caseStudy.customerName.replace(/\s+/g, '_')}_${caseStudy.componentWorkpiece.replace(/\s+/g, '_')}_CaseStudy.pdf`;
  doc.save(fileName);
}

/**
 * BRD 3.4F - Side-by-side comparison PDF
 * Highlight: Annual Potential Revenue, Service Life
 */
export interface ComparisonPDFData {
  id: string;
  type: string;
  customerName: string;
  industry: string;
  location: string;
  country?: string;
  componentWorkpiece: string;
  workType: string;
  wearType: string[];
  wearSeverities?: Record<string, number> | null;
  wearTypeOthers?: Array<{ name: string; severity: number }> | null;
  problemDescription: string;
  waSolution: string;
  waProduct: string;
  waProductDiameter?: string;
  technicalAdvantages?: string;
  expectedServiceLife?: string;
  previousServiceLife?: string;
  previousSolution?: string;
  baseMetal?: string;
  generalDimensions?: string;
  jobType?: string;
  jobTypeOther?: string;
  oem?: string;
  solutionValueRevenue?: number | null;
  annualPotentialRevenue?: number | null;
  customerSavingsAmount?: number | null;
  jobDurationHours?: number | null;
  jobDurationDays?: number | null;
  jobDurationWeeks?: number | null;
  approvedAt?: Date | string | null;
  currency?: string | null;
}

// Currency symbols mapping for PDF export
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: 'EUR', USD: '$', GBP: 'GBP', AUD: 'A$', CAD: 'C$',
  CHF: 'CHF', JPY: 'JPY', CNY: 'CNY', MAD: 'MAD',
};

// Get currency symbol from currency code
function waGetCurrencySymbol(currency: string | null | undefined): string {
  return CURRENCY_SYMBOLS[currency || 'EUR'] || 'EUR';
}

// WA Green color constant (RGB)
const WA_GREEN = { r: 0, g: 130, b: 70 }; // #008246

// Helper to draw wear severity progress bars in PDF
function waDrawWearSeverityBars(
  doc: jsPDF,
  wearType: string,
  severity: number,
  xPos: number,
  yPos: number,
  maxWidth: number
): void {
  const segmentWidth = 12;
  const segmentHeight = 4;
  const gap = 2;
  const totalSegments = 5;

  // Draw label (truncated)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const label = wearType.length > 12 ? wearType.substring(0, 11) + '..' : wearType;
  doc.text(label, xPos, yPos + 3);

  // Draw segments
  const barStartX = xPos + 45;
  for (let i = 0; i < totalSegments; i++) {
    const segX = barStartX + (i * (segmentWidth + gap));
    if (i < severity) {
      doc.setFillColor(WA_GREEN.r, WA_GREEN.g, WA_GREEN.b);
    } else {
      doc.setFillColor(220, 220, 220);
    }
    doc.roundedRect(segX, yPos, segmentWidth, segmentHeight, 1, 1, 'F');
  }
}

export function generateComparisonPDF(
  caseStudies: (ComparisonPDFData | null)[],
  options?: PDFExportOptions
): jsPDF {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Filter out nulls
  const validCases = caseStudies.filter((c): c is ComparisonPDFData => c !== null);

  if (validCases.length === 0) {
    doc.text('No case studies to compare', pageWidth / 2, pageHeight / 2, { align: 'center' });
    return doc;
  }

  // Add subtle watermark
  doc.setTextColor(240, 240, 240);
  doc.setFontSize(35);
  doc.text('WELDING ALLOYS - CONFIDENTIAL', pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 25,
  });

  // BRD 5.4.3 - Add personalized watermark
  if (options?.exportedByName) {
    doc.setFontSize(14);
    doc.text(`Downloaded by: ${options.exportedByName}`, pageWidth / 2, pageHeight / 2 + 25, {
      align: 'center',
      angle: 25,
    });
  }
  doc.setTextColor(0, 0, 0);

  // WA Green Header
  doc.setFillColor(WA_GREEN.r, WA_GREEN.g, WA_GREEN.b);
  doc.rect(0, 0, pageWidth, 30, 'F');

  // Header content
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('WELDING ALLOYS', 15, 13);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Case Study Comparison Report', 15, 22);

  // Right side header info
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 15, 13, { align: 'right' });
  doc.text(`Comparing ${validCases.length} Case Studies`, pageWidth - 15, 20, { align: 'right' });
  if (options?.exportedByName) {
    doc.text(`By: ${options.exportedByName}`, pageWidth - 15, 27, { align: 'right' });
  }

  doc.setTextColor(0, 0, 0);
  yPos = 40;

  // Calculate column widths
  const colCount = validCases.length;
  const labelWidth = 55;
  const availableWidth = pageWidth - 25 - labelWidth;
  const colWidth = availableWidth / colCount;

  // Helper to add new page with header
  const waAddNewPage = () => {
    doc.addPage();
    // Add watermark
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(35);
    doc.text('WELDING ALLOYS - CONFIDENTIAL', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 25,
    });
    doc.setTextColor(0, 0, 0);
    // Add header stripe
    doc.setFillColor(WA_GREEN.r, WA_GREEN.g, WA_GREEN.b);
    doc.rect(0, 0, pageWidth, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('WELDING ALLOYS - Case Study Comparison', 15, 8);
    doc.setTextColor(0, 0, 0);
    return 20;
  };

  // Helper to add section header
  const waAddSectionHeader = (title: string, bgColor?: { r: number; g: number; b: number }) => {
    if (yPos > pageHeight - 30) {
      yPos = waAddNewPage();
    }
    const color = bgColor || { r: WA_GREEN.r, g: WA_GREEN.g, b: WA_GREEN.b };
    doc.setFillColor(color.r, color.g, color.b);
    doc.rect(10, yPos - 4, pageWidth - 20, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title, 15, yPos + 2);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    yPos += 14;
  };

  // Helper to add comparison rows with better styling
  const waAddComparisonRow = (
    label: string,
    values: (string | undefined)[],
    options?: { highlighted?: boolean; bold?: boolean; multiLine?: boolean }
  ) => {
    const rowHeight = options?.multiLine ? 18 : 10;
    if (yPos > pageHeight - rowHeight - 10) {
      yPos = waAddNewPage();
    }

    // Alternating row background
    if (options?.highlighted) {
      doc.setFillColor(255, 250, 205); // Light yellow highlight
      doc.rect(10, yPos - 4, pageWidth - 20, rowHeight, 'F');
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(label, 15, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    values.forEach((val, idx) => {
      const xPos = labelWidth + 15 + (idx * colWidth);
      const text = val || '—';
      const maxWidth = colWidth - 8;

      if (options?.multiLine) {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines.slice(0, 3), xPos, yPos);
      } else {
        const truncated = text.length > 40 ? text.substring(0, 38) + '..' : text;
        doc.text(truncated, xPos, yPos);
      }
    });

    yPos += rowHeight;
  };

  // Case headers with type badges
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('FIELD', 15, yPos);

  validCases.forEach((cs, idx) => {
    const xPos = labelWidth + 15 + (idx * colWidth);

    // Type badge
    const typeColors: Record<string, number[]> = {
      'STAR': [234, 179, 8],   // Gold
      'TECH': [147, 51, 234],  // Purple
      'BASIC': [100, 100, 100] // Gray
    };
    const color = typeColors[cs.type] || typeColors['BASIC'];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(xPos - 2, yPos - 7, 25, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(cs.type, xPos + 10.5, yPos - 1.5, { align: 'center' });

    // Customer name
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    const name = cs.customerName.length > 25 ? cs.customerName.substring(0, 23) + '..' : cs.customerName;
    doc.text(name, xPos + 28, yPos);
  });

  doc.setTextColor(0, 0, 0);
  yPos += 12;

  // ═══════════════════════════════════════════════════════════════
  // SECTION 1: BASIC INFORMATION
  // ═══════════════════════════════════════════════════════════════
  waAddSectionHeader('BASIC INFORMATION');

  waAddComparisonRow('Industry', validCases.map(c => c.industry));
  waAddComparisonRow('Location', validCases.map(c =>
    `${c.location}${c.country ? ', ' + c.country : ''}`
  ));
  waAddComparisonRow('Component/Workpiece', validCases.map(c => c.componentWorkpiece));
  waAddComparisonRow('Work Type', validCases.map(c => c.workType));
  waAddComparisonRow('Job Type', validCases.map(c =>
    c.jobType === 'Other' && c.jobTypeOther ? c.jobTypeOther : c.jobType || '—'
  ));
  waAddComparisonRow('OEM', validCases.map(c => c.oem || '—'));
  waAddComparisonRow('Approved Date', validCases.map(c =>
    c.approvedAt ? new Date(c.approvedAt).toLocaleDateString() : '—'
  ));

  // ═══════════════════════════════════════════════════════════════
  // SECTION 2: WEAR TYPE ANALYSIS (with visual severity bars)
  // ═══════════════════════════════════════════════════════════════
  yPos += 5;
  waAddSectionHeader('WEAR TYPE ANALYSIS', { r: 80, g: 80, b: 80 });

  // Get all unique wear types across all cases
  const allWearTypes = new Set<string>();
  validCases.forEach(c => {
    c.wearType?.forEach(wt => allWearTypes.add(wt));
    c.wearTypeOthers?.forEach(other => allWearTypes.add(other.name));
  });

  // Draw wear types with severity bars for each case
  Array.from(allWearTypes).forEach(wearType => {
    if (yPos > pageHeight - 20) {
      yPos = waAddNewPage();
    }

    // Draw wear type label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const label = wearType.length > 16 ? wearType.substring(0, 14) + '..' : wearType;
    doc.text(label, 15, yPos);
    doc.setTextColor(0, 0, 0);

    // Draw severity bars for each case
    validCases.forEach((cs, idx) => {
      const xPos = labelWidth + 15 + (idx * colWidth);

      // Get severity for this wear type
      let severity = 0;
      if (cs.wearType?.includes(wearType)) {
        severity = (cs.wearSeverities as Record<string, number>)?.[wearType] || 1;
      }
      // Check in others
      const otherMatch = cs.wearTypeOthers?.find(o => o.name === wearType);
      if (otherMatch) {
        severity = otherMatch.severity || 1;
      }

      // Draw segments
      const segmentWidth = 10;
      const segmentHeight = 5;
      const gap = 2;
      for (let i = 0; i < 5; i++) {
        const segX = xPos + (i * (segmentWidth + gap));
        if (i < severity) {
          doc.setFillColor(WA_GREEN.r, WA_GREEN.g, WA_GREEN.b);
        } else {
          doc.setFillColor(220, 220, 220);
        }
        doc.roundedRect(segX, yPos - 4, segmentWidth, segmentHeight, 1, 1, 'F');
      }
    });

    yPos += 10;
  });

  // ═══════════════════════════════════════════════════════════════
  // SECTION 3: TECHNICAL DETAILS
  // ═══════════════════════════════════════════════════════════════
  yPos += 5;
  waAddSectionHeader('TECHNICAL DETAILS');

  waAddComparisonRow('Base Metal', validCases.map(c => c.baseMetal || '—'));
  waAddComparisonRow('Dimensions', validCases.map(c => c.generalDimensions || '—'));
  waAddComparisonRow('Previous Solution', validCases.map(c => c.previousSolution || '—'));
  waAddComparisonRow('Previous Service Life', validCases.map(c => c.previousServiceLife || '—'));

  // ═══════════════════════════════════════════════════════════════
  // SECTION 4: WA SOLUTION
  // ═══════════════════════════════════════════════════════════════
  yPos += 5;
  waAddSectionHeader('WELDING ALLOYS SOLUTION', WA_GREEN);

  waAddComparisonRow('WA Product', validCases.map(c => c.waProduct), { bold: true });
  waAddComparisonRow('Product Diameter', validCases.map(c => c.waProductDiameter || '—'));
  waAddComparisonRow('Expected Service Life', validCases.map(c => c.expectedServiceLife || '—'), { highlighted: true, bold: true });

  // Job Duration
  waAddComparisonRow('Job Duration', validCases.map(c => {
    const parts = [];
    if (c.jobDurationWeeks) parts.push(`${c.jobDurationWeeks}w`);
    if (c.jobDurationDays) parts.push(`${c.jobDurationDays}d`);
    if (c.jobDurationHours) parts.push(`${c.jobDurationHours}h`);
    return parts.length > 0 ? parts.join(' ') : '—';
  }));

  // ═══════════════════════════════════════════════════════════════
  // SECTION 5: FINANCIAL IMPACT (HIGHLIGHTED)
  // ═══════════════════════════════════════════════════════════════
  yPos += 5;
  waAddSectionHeader('FINANCIAL IMPACT (KEY METRICS)', { r: 22, g: 163, b: 74 }); // Green

  // Helper to format currency properly (handles strings and numbers, uses case currency)
  const waFormatCurrencyWithSymbol = (value: number | string | null | undefined, currency: string | null | undefined): string => {
    if (value === null || value === undefined) return '—';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue === 0) return '—';
    const symbol = waGetCurrencySymbol(currency);
    return `${symbol} ${numValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  waAddComparisonRow('Solution Value Revenue', validCases.map(c =>
    waFormatCurrencyWithSymbol(c.solutionValueRevenue, c.currency)
  ), { highlighted: true, bold: true });

  waAddComparisonRow('Annual Potential Revenue', validCases.map(c =>
    waFormatCurrencyWithSymbol(c.annualPotentialRevenue, c.currency)
  ), { highlighted: true, bold: true });

  waAddComparisonRow('Customer Savings', validCases.map(c =>
    waFormatCurrencyWithSymbol(c.customerSavingsAmount, c.currency)
  ), { highlighted: true, bold: true });

  // Calculate totals row - ensure proper number parsing
  const waParseNumber = (val: number | string | null | undefined): number => {
    if (val === null || val === undefined) return 0;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? 0 : num;
  };

  const totalSolutionValue = validCases.reduce((sum, c) => sum + waParseNumber(c.solutionValueRevenue), 0);
  const totalAnnualRevenue = validCases.reduce((sum, c) => sum + waParseNumber(c.annualPotentialRevenue), 0);
  const totalSavings = validCases.reduce((sum, c) => sum + waParseNumber(c.customerSavingsAmount), 0);

  // Determine the primary currency for totals (use first case's currency or EUR)
  const primaryCurrency = validCases.find(c => c.currency)?.currency || 'EUR';
  const primarySymbol = waGetCurrencySymbol(primaryCurrency);

  // Check if all cases have same currency
  const allSameCurrency = validCases.every(c => !c.currency || c.currency === primaryCurrency);

  if (totalSolutionValue > 0 || totalAnnualRevenue > 0 || totalSavings > 0) {
    yPos += 3;
    doc.setFillColor(22, 163, 74);
    doc.rect(10, yPos - 4, pageWidth - 20, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(allSameCurrency ? 'COMBINED TOTAL' : 'COMBINED TOTAL (Mixed Currencies)', 15, yPos + 2);

    // Show totals with proper currency formatting
    const totalsText = [];
    if (totalSolutionValue > 0) totalsText.push(`Solution: ${primarySymbol} ${totalSolutionValue.toLocaleString('en-US')}`);
    if (totalAnnualRevenue > 0) totalsText.push(`Annual: ${primarySymbol} ${totalAnnualRevenue.toLocaleString('en-US')}`);
    if (totalSavings > 0) totalsText.push(`Savings: ${primarySymbol} ${totalSavings.toLocaleString('en-US')}`);
    doc.text(totalsText.join('  |  '), labelWidth + 60, yPos + 2);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    yPos += 16;
  }

  // ═══════════════════════════════════════════════════════════════
  // SECTION 6: PROBLEM & SOLUTION DESCRIPTION
  // ═══════════════════════════════════════════════════════════════
  yPos += 5;
  waAddSectionHeader('PROBLEM & SOLUTION SUMMARY');

  waAddComparisonRow('Problem Description', validCases.map(c =>
    c.problemDescription ? (c.problemDescription.length > 120
      ? c.problemDescription.substring(0, 118) + '..'
      : c.problemDescription) : '—'
  ), { multiLine: true });

  waAddComparisonRow('WA Solution', validCases.map(c =>
    c.waSolution ? (c.waSolution.length > 120
      ? c.waSolution.substring(0, 118) + '..'
      : c.waSolution) : '—'
  ), { multiLine: true });

  waAddComparisonRow('Technical Advantages', validCases.map(c =>
    c.technicalAdvantages ? (c.technicalAdvantages.length > 120
      ? c.technicalAdvantages.substring(0, 118) + '..'
      : c.technicalAdvantages) : '—'
  ), { multiLine: true });

  // ═══════════════════════════════════════════════════════════════
  // FOOTER ON ALL PAGES
  // ═══════════════════════════════════════════════════════════════
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(WA_GREEN.r, WA_GREEN.g, WA_GREEN.b);
    doc.setLineWidth(0.5);
    doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);

    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);

    const footerText = options?.exportedByName
      ? `© ${new Date().getFullYear()} Welding Alloys Group — INTERNAL USE ONLY — Downloaded by: ${options.exportedByName}`
      : `© ${new Date().getFullYear()} Welding Alloys Group — INTERNAL USE ONLY`;

    doc.text(footerText, pageWidth / 2, pageHeight - 6, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 6, { align: 'right' });
    doc.text(`Report ID: COMP-${Date.now().toString(36).toUpperCase()}`, 15, pageHeight - 6);
  }

  return doc;
}

export function downloadComparisonPDF(
  caseStudies: (ComparisonPDFData | null)[],
  options?: PDFExportOptions
): void {
  const doc = generateComparisonPDF(caseStudies, options);
  const fileName = `Case_Study_Comparison_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

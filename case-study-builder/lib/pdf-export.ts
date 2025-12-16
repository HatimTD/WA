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
}

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
  yPos += 12;
  doc.setTextColor(0, 0, 0);

  // Problem Description Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Problem Description', 15, yPos);
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const problemLines = doc.splitTextToSize(caseStudy.problemDescription, pageWidth - 30);
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

  if (caseStudy.previousSolution) {
    technicalData.push(['Previous Solution', caseStudy.previousSolution]);
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
    ['WA Solution', caseStudy.waSolution],
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

  // Technical Advantages
  if (caseStudy.technicalAdvantages) {
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
    const advantagesLines = doc.splitTextToSize(caseStudy.technicalAdvantages, pageWidth - 30);
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
  problemDescription: string;
  waSolution: string;
  waProduct: string;
  technicalAdvantages?: string;
  expectedServiceLife?: string;
  previousServiceLife?: string;
  solutionValueRevenue?: number | null;
  annualPotentialRevenue?: number | null;
  customerSavingsAmount?: number | null;
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

  // Add watermark
  doc.setTextColor(230, 230, 230);
  doc.setFontSize(40);
  doc.text('WELDING ALLOYS - COMPARISON', pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 30,
  });
  doc.setTextColor(0, 0, 0);

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('Case Study Comparison', 15, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 50, 15);

  if (options?.exportedByName) {
    doc.text(`Downloaded by: ${options.exportedByName}`, pageWidth - 50, 20);
  }

  doc.setTextColor(0, 0, 0);
  yPos = 35;

  // Calculate column widths based on number of cases
  const colCount = validCases.length;
  const labelWidth = 50;
  const availableWidth = pageWidth - 30 - labelWidth;
  const colWidth = availableWidth / colCount;

  // Helper to add comparison rows
  const addComparisonRow = (label: string, values: (string | undefined)[], highlighted?: boolean) => {
    if (yPos > pageHeight - 15) {
      doc.addPage();
      yPos = 20;
    }

    if (highlighted) {
      doc.setFillColor(255, 250, 220);
      doc.rect(10, yPos - 4, pageWidth - 20, 10, 'F');
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(label, 15, yPos);
    doc.setFont('helvetica', 'normal');

    values.forEach((val, idx) => {
      const xPos = labelWidth + 15 + (idx * colWidth);
      const text = val || 'N/A';
      const maxWidth = colWidth - 5;
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines.slice(0, 2).join(' '), xPos, yPos);
    });

    yPos += 10;
  };

  // Case headers
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Field', 15, yPos);
  validCases.forEach((cs, idx) => {
    const xPos = labelWidth + 15 + (idx * colWidth);
    doc.setFillColor(
      cs.type === 'STAR' ? 234 : cs.type === 'TECH' ? 147 : 37,
      cs.type === 'STAR' ? 179 : cs.type === 'TECH' ? 51 : 99,
      cs.type === 'STAR' ? 8 : cs.type === 'TECH' ? 234 : 235
    );
    doc.roundedRect(xPos - 2, yPos - 8, colWidth - 5, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    const title = `${cs.customerName.substring(0, 20)}${cs.customerName.length > 20 ? '...' : ''}`;
    doc.text(`${cs.type}: ${title}`, xPos, yPos);
  });
  doc.setTextColor(0, 0, 0);
  yPos += 15;

  // Basic Information Section
  doc.setFillColor(240, 240, 240);
  doc.rect(10, yPos - 4, pageWidth - 20, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BASIC INFORMATION', 15, yPos);
  yPos += 12;
  doc.setFont('helvetica', 'normal');

  addComparisonRow('Industry', validCases.map(c => c.industry));
  addComparisonRow('Location', validCases.map(c => `${c.location}${c.country ? ', ' + c.country : ''}`));
  addComparisonRow('Component', validCases.map(c => c.componentWorkpiece));
  addComparisonRow('Work Type', validCases.map(c => c.workType));
  addComparisonRow('Wear Types', validCases.map(c => c.wearType?.join(', ')));

  // Solution Section
  yPos += 5;
  doc.setFillColor(240, 240, 240);
  doc.rect(10, yPos - 4, pageWidth - 20, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('SOLUTION DETAILS', 15, yPos);
  yPos += 12;
  doc.setFont('helvetica', 'normal');

  addComparisonRow('WA Product', validCases.map(c => c.waProduct));
  addComparisonRow('Previous Life', validCases.map(c => c.previousServiceLife));

  // BRD 3.4F - HIGHLIGHT: Service Life
  addComparisonRow('★ Expected Life', validCases.map(c => c.expectedServiceLife), true);

  // Financial Section - BRD 3.4F Highlight
  yPos += 5;
  doc.setFillColor(220, 252, 231);
  doc.rect(10, yPos - 4, pageWidth - 20, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('★ FINANCIAL IMPACT (HIGHLIGHTED)', 15, yPos);
  yPos += 12;
  doc.setFont('helvetica', 'normal');

  addComparisonRow('Solution Value', validCases.map(c =>
    c.solutionValueRevenue ? `$${c.solutionValueRevenue.toLocaleString()}` : undefined
  ), true);

  // BRD 3.4F - HIGHLIGHT: Annual Potential Revenue
  addComparisonRow('★ Annual Revenue', validCases.map(c =>
    c.annualPotentialRevenue ? `$${c.annualPotentialRevenue.toLocaleString()}` : undefined
  ), true);

  addComparisonRow('Customer Savings', validCases.map(c =>
    c.customerSavingsAmount ? `$${c.customerSavingsAmount.toLocaleString()}` : undefined
  ), true);

  // Descriptions Section (abbreviated)
  if (yPos < pageHeight - 60) {
    yPos += 5;
    doc.setFillColor(240, 240, 240);
    doc.rect(10, yPos - 4, pageWidth - 20, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('PROBLEM & SOLUTION SUMMARY', 15, yPos);
    yPos += 12;
    doc.setFont('helvetica', 'normal');

    addComparisonRow('Problem', validCases.map(c =>
      c.problemDescription ? c.problemDescription.substring(0, 100) + '...' : undefined
    ));
    addComparisonRow('Solution', validCases.map(c =>
      c.waSolution ? c.waSolution.substring(0, 100) + '...' : undefined
    ));
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const footerText = options?.exportedByName
      ? `© ${new Date().getFullYear()} Welding Alloys Group - INTERNAL USE ONLY - Downloaded by: ${options.exportedByName}`
      : `© ${new Date().getFullYear()} Welding Alloys Group - INTERNAL USE ONLY`;
    doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 8, { align: 'right' });
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

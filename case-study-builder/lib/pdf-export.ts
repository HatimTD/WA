import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
export interface PDFExportOptions {
  /** Name of the user downloading the PDF (for watermark) */
  exportedByName?: string;
  /** Email of the user downloading the PDF (for watermark) */
  exportedByEmail?: string;
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

  // Add watermark with personalization per BRD 5.4.3
  addWatermark(doc, options);

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

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${caseStudy.customerName} - ${caseStudy.componentWorkpiece}`, 15, yPos);
  yPos += 10;

  // Metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Industry: ${caseStudy.industry} | Location: ${caseStudy.location}`, 15, yPos);
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

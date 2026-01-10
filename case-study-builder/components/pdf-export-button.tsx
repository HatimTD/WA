'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { downloadCaseStudyPDF, type CaseStudyPDFData, type PDFExportOptions } from '@/lib/pdf-export-ppt';
import { toast } from 'sonner';

// BRD 5.4.3 - Props with user info for personalized watermark
type Props = {
  caseStudy: CaseStudyPDFData;
  /** Current user's name for personalized PDF watermark */
  userName?: string;
  /** Current user's email for personalized PDF watermark */
  userEmail?: string;
  /** Button variant */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

export default function PDFExportButton({
  caseStudy,
  userName,
  userEmail,
  variant = 'outline',
  size = 'default'
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    try {
      setIsGenerating(true);
      console.log('[PDFExport] Generating PPT-style PDF for case study:', caseStudy.id, 'Type:', caseStudy.type);

      // BRD 5.4.3 - Generate PDF with personalized watermark
      const pdfOptions: PDFExportOptions = {
        exportedByName: userName,
        exportedByEmail: userEmail,
      };

      // Async PDF generation with real images
      await downloadCaseStudyPDF(caseStudy, pdfOptions);

      console.log('[PDFExport] PDF generated successfully for:', userName);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('[PDFExport] Error generating PDF:', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isGenerating}
      variant={variant}
      size={size}
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Export PDF
        </>
      )}
    </Button>
  );
}

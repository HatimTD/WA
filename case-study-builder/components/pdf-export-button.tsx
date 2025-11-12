'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { downloadCaseStudyPDF, CaseStudyPDFData } from '@/lib/pdf-export';
import { toast } from 'sonner';

type Props = {
  caseStudy: CaseStudyPDFData;
};

export default function PDFExportButton({ caseStudy }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    try {
      setIsGenerating(true);
      console.log('[PDFExport] Generating PDF for case study:', caseStudy.id);

      // Generate and download PDF
      downloadCaseStudyPDF(caseStudy);

      console.log('[PDFExport] PDF generated successfully');
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
      variant="outline"
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

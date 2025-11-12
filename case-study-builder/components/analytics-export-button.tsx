'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

interface AnalyticsExportButtonProps {
  userName: string;
  userEmail: string;
  totalPoints: number;
  totalCases: number;
  approvedCases: number;
  rejectedCases: number;
  pendingCases: number;
  draftCases: number;
  approvalRate: number;
  applicationCases: number;
  techCases: number;
  starCases: number;
  totalRevenue: number;
  totalAnnualRevenue: number;
  badges: string[];
}

export function AnalyticsExportButton(props: AnalyticsExportButtonProps) {
  const handleExport = () => {
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CASE STUDY BUILDER', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.setFontSize(14);
    doc.text('Contributor Analytics Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${reportDate}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    // Contributor Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRIBUTOR INFORMATION', 15, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${props.userName}`, 20, yPos);
    yPos += 6;
    doc.text(`Email: ${props.userEmail}`, 20, yPos);
    yPos += 6;
    doc.text(`Total Points Earned: ${props.totalPoints}`, 20, yPos);
    yPos += 12;

    // Submission Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBMISSION SUMMARY', 15, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Case Studies: ${props.totalCases}`, 20, yPos);
    yPos += 6;
    doc.text(`Approved: ${props.approvedCases}`, 20, yPos);
    yPos += 6;
    doc.text(`Pending Review: ${props.pendingCases}`, 20, yPos);
    yPos += 6;
    doc.text(`Drafts: ${props.draftCases}`, 20, yPos);
    yPos += 6;
    doc.text(`Rejected: ${props.rejectedCases}`, 20, yPos);
    yPos += 6;
    doc.text(`Approval Rate: ${props.approvalRate}%`, 20, yPos);
    yPos += 12;

    // Case Type Breakdown
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CASE TYPE BREAKDOWN', 15, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const appPercent = props.totalCases > 0 ? Math.round((props.applicationCases / props.totalCases) * 100) : 0;
    const techPercent = props.totalCases > 0 ? Math.round((props.techCases / props.totalCases) * 100) : 0;
    const starPercent = props.totalCases > 0 ? Math.round((props.starCases / props.totalCases) * 100) : 0;
    doc.text(`Application Cases: ${props.applicationCases} (${appPercent}%)`, 20, yPos);
    yPos += 6;
    doc.text(`Tech Cases: ${props.techCases} (${techPercent}%)`, 20, yPos);
    yPos += 6;
    doc.text(`Star Cases: ${props.starCases} (${starPercent}%)`, 20, yPos);
    yPos += 12;

    // Revenue Impact
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REVENUE IMPACT', 15, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Solution Value: $${props.totalRevenue.toLocaleString()}`, 20, yPos);
    yPos += 6;
    doc.text(`Annual Potential Revenue: $${props.totalAnnualRevenue.toLocaleString()}`, 20, yPos);
    yPos += 12;

    // Badges & Achievements
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BADGES & ACHIEVEMENTS', 15, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Badges Earned: ${props.badges.length}`, 20, yPos);
    yPos += 6;
    if (props.badges.length > 0) {
      doc.text(`Badges: ${props.badges.join(', ')}`, 20, yPos);
    } else {
      doc.text('No badges earned yet', 20, yPos);
    }
    yPos += 15;

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(`© ${new Date().getFullYear()} Welding Alloys - Case Study Builder`, pageWidth / 2, yPos, { align: 'center' });

    // Save the PDF
    doc.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);

    toast.success('Analytics report downloaded as PDF');
  };

  return (
    <Button variant="outline" className="gap-2" onClick={handleExport}>
      <Download className="h-4 w-4" />
      Export Report
    </Button>
  );
}

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MapPin,
  Building2,
  Package,
  Wrench,
  DollarSign,
  Calendar,
  User,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import Image from 'next/image';
import ApprovalActions from '@/components/approval-actions';
import WeldingProcedureForm from '@/components/welding-procedure-form';
import CostCalculatorDisplay from '@/components/cost-calculator-display';
import { WearTypeStarsDisplay } from '@/components/wear-type-progress-bar';
import LanguageIndicator from '@/components/language-indicator';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ showOriginal?: string }>;
};

export default async function ApprovalReviewPage({ params, searchParams }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // Only Approvers and Admins can access this page
  if (user?.role !== 'APPROVER' && user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const { id } = await params;
  const { showOriginal } = await searchParams;

  // Determine if we should show original content or translated
  const displayOriginal = showOriginal === 'true';

  const caseStudy = await prisma.waCaseStudy.findUnique({
    where: { id },
    include: {
      contributor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!caseStudy) {
    notFound();
  }

  // Only show submitted cases
  if (caseStudy.status !== 'SUBMITTED') {
    redirect('/dashboard/approvals');
  }

  // Fetch WPS data if it's a TECH or STAR case
  let wpsData = null;
  if (caseStudy.type === 'TECH' || caseStudy.type === 'STAR') {
    wpsData = await prisma.waWeldingProcedure.findUnique({
      where: { caseStudyId: id },
    });
  }

  // Fetch Cost Calculator data if it's a STAR case
  let costCalcData = null;
  if (caseStudy.type === 'STAR') {
    costCalcData = await prisma.waCostCalculator.findUnique({
      where: { caseStudyId: id },
    });
  }

  // BRD: Get display content - translated to English by default, original if requested
  const hasTranslation = Boolean(caseStudy.translationAvailable && caseStudy.translatedText);
  let displayContent = {
    problemDescription: caseStudy.problemDescription,
    previousSolution: caseStudy.previousSolution,
    technicalAdvantages: caseStudy.technicalAdvantages,
    waSolution: caseStudy.waSolution,
    isTranslated: false,
  };

  // Use translated content by default (unless showOriginal=true)
  if (hasTranslation && !displayOriginal) {
    try {
      const translation = JSON.parse(caseStudy.translatedText!);
      const fields = translation.fields || {};
      displayContent = {
        problemDescription: fields.problemDescription || caseStudy.problemDescription,
        previousSolution: fields.previousSolution || caseStudy.previousSolution,
        technicalAdvantages: fields.technicalAdvantages || caseStudy.technicalAdvantages,
        waSolution: fields.waSolution || caseStudy.waSolution,
        isTranslated: true,
      };
    } catch {
      // If parsing fails, use original content
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'APPLICATION':
        return 'bg-wa-green-50 text-wa-green-600 border-wa-green-200';
      case 'TECH':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'STAR':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'; /* Changed from yellow-600 for WCAG AA contrast */
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getTypePoints = (type: string) => {
    switch (type) {
      case 'APPLICATION':
        return 1;
      case 'TECH':
        return 2;
      case 'STAR':
        return 3;
      default:
        return 0;
    }
  };

  // Currency symbols mapping
  const CURRENCY_SYMBOLS: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    JPY: '¥',
    CNY: '¥',
    MAD: 'MAD',
  };

  function getCurrencySymbol(currency: string | null | undefined): string {
    return CURRENCY_SYMBOLS[currency || 'EUR'] || '€';
  }

  // Helper to format expanded service life (hours, days, weeks, months, years)
  function waFormatExpandedServiceLife(data: {
    hours?: string | null;
    days?: string | null;
    weeks?: string | null;
    months?: string | null;
    years?: string | null;
  }): string | null {
    const parts: string[] = [];
    if (data.years && parseInt(data.years) > 0) parts.push(`${data.years}y`);
    if (data.months && parseInt(data.months) > 0) parts.push(`${data.months}mo`);
    if (data.weeks && parseInt(data.weeks) > 0) parts.push(`${data.weeks}w`);
    if (data.days && parseInt(data.days) > 0) parts.push(`${data.days}d`);
    if (data.hours && parseInt(data.hours) > 0) parts.push(`${data.hours}h`);
    return parts.length > 0 ? parts.join(' ') : null;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/approvals">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Approvals
          </Button>
        </Link>
      </div>

      {/* Approval Actions */}
      <Card role="article" className="bg-gradient-to-r from-wa-green-50 to-purple-50 dark:from-accent dark:to-purple-900/20 border-2 border-wa-green-200 dark:border-primary">
        <CardHeader>
          <CardTitle className="text-xl dark:text-foreground">Review & Approve</CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Review this case study and decide whether to approve or reject it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApprovalActions caseStudyId={caseStudy.id} />
        </CardContent>
      </Card>

      {/* Title and Info */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
              {caseStudy.title || `${caseStudy.customerName} - ${caseStudy.componentWorkpiece}`}
            </h1>
            <p className="text-lg text-gray-600 dark:text-muted-foreground mt-2">
              {caseStudy.location}, {caseStudy.country || 'N/A'}
            </p>
          </div>
          <Badge className={`${getTypeColor(caseStudy.type)} border text-lg px-4 py-2`}>
            {caseStudy.type} (+{getTypePoints(caseStudy.type)} pts)
          </Badge>
        </div>
      </div>

      {/* Basic Information */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="dark:text-foreground">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* General Description - Overview */}
          {caseStudy.generalDescription && (
            <div className="pb-4 border-b dark:border-border">
              <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-2">Overview</p>
              <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">{caseStudy.generalDescription}</p>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-gray-400 dark:text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Industry</p>
                <p className="text-base font-semibold dark:text-foreground">{caseStudy.industry}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 dark:text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Location</p>
                <p className="text-base font-semibold dark:text-foreground">
                  {caseStudy.location}, {caseStudy.country || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-gray-400 dark:text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Component/Workpiece</p>
                <p className="text-base font-semibold dark:text-foreground">{caseStudy.componentWorkpiece}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Wrench className="h-5 w-5 text-gray-400 dark:text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Work Type</p>
                <p className="text-base font-semibold dark:text-foreground">{caseStudy.workType}</p>
              </div>
            </div>

            {caseStudy.jobType && (
              <div className="flex items-start gap-3">
                <Wrench className="h-5 w-5 text-gray-400 dark:text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Job Type</p>
                  <p className="text-base font-semibold dark:text-foreground">
                    {caseStudy.jobType === 'OTHER' ? caseStudy.jobTypeOther || 'Other' : caseStudy.jobType}
                  </p>
                </div>
              </div>
            )}

            {caseStudy.oem && (
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-gray-400 dark:text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">OEM</p>
                  <p className="text-base font-semibold dark:text-foreground">{caseStudy.oem}</p>
                </div>
              </div>
            )}

            {(caseStudy.jobDurationHours || caseStudy.jobDurationDays || caseStudy.jobDurationWeeks) && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 dark:text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Job Duration</p>
                  <p className="text-base font-semibold dark:text-foreground">
                    {[
                      caseStudy.jobDurationHours && `${caseStudy.jobDurationHours}h`,
                      caseStudy.jobDurationDays && `${caseStudy.jobDurationDays}d`,
                      caseStudy.jobDurationWeeks && `${caseStudy.jobDurationWeeks}w`,
                    ].filter(Boolean).join(' ')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-2">Type of Wear</p>
            <WearTypeStarsDisplay
              wearTypes={caseStudy.wearType}
              wearSeverities={caseStudy.wearSeverities as Record<string, number> | null}
              wearTypeOthers={caseStudy.wearTypeOthers as { name: string; severity: number }[] | null}
              showOnlySelected
            />
          </div>

          {caseStudy.baseMetal && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Base Metal</p>
              <p className="text-base dark:text-foreground">{caseStudy.baseMetal}</p>
            </div>
          )}

          {caseStudy.generalDimensions && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">General Dimensions</p>
              <p className="text-base dark:text-foreground">{caseStudy.generalDimensions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Language Indicator - Show translation status */}
      {caseStudy.originalLanguage && caseStudy.originalLanguage !== 'en' && (
        <LanguageIndicator
          originalLanguage={caseStudy.originalLanguage}
          translationAvailable={caseStudy.translationAvailable}
          translatedText={caseStudy.translatedText}
          caseStudyId={caseStudy.id}
          variant="banner"
          showLink={hasTranslation}
          isViewingOriginal={displayOriginal}
          basePath="/dashboard/approvals"
        />
      )}

      {/* Problem Description */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="dark:text-foreground">Problem Description</CardTitle>
          <CardDescription className="dark:text-muted-foreground">The challenge the customer was facing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose max-w-none">
            <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">{displayContent.problemDescription}</p>
          </div>

          {(displayContent.previousSolution || caseStudy.previousServiceLife || waFormatExpandedServiceLife({
            hours: caseStudy.previousServiceLifeHours,
            days: caseStudy.previousServiceLifeDays,
            weeks: caseStudy.previousServiceLifeWeeks,
            months: caseStudy.previousServiceLifeMonths,
            years: caseStudy.previousServiceLifeYears,
          }) || caseStudy.competitorName) && (
            <div className="pt-4 border-t dark:border-border space-y-3">
              {displayContent.previousSolution && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Previous Solution</p>
                  <p className="text-base dark:text-foreground">{displayContent.previousSolution}</p>
                </div>
              )}

              {(caseStudy.previousServiceLife || waFormatExpandedServiceLife({
                hours: caseStudy.previousServiceLifeHours,
                days: caseStudy.previousServiceLifeDays,
                weeks: caseStudy.previousServiceLifeWeeks,
                months: caseStudy.previousServiceLifeMonths,
                years: caseStudy.previousServiceLifeYears,
              })) && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Previous Service Life</p>
                  <p className="text-base dark:text-foreground">
                    {waFormatExpandedServiceLife({
                      hours: caseStudy.previousServiceLifeHours,
                      days: caseStudy.previousServiceLifeDays,
                      weeks: caseStudy.previousServiceLifeWeeks,
                      months: caseStudy.previousServiceLifeMonths,
                      years: caseStudy.previousServiceLifeYears,
                    }) || caseStudy.previousServiceLife}
                  </p>
                </div>
              )}

              {caseStudy.competitorName && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Competitor</p>
                  <p className="text-base dark:text-foreground">{caseStudy.competitorName}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* WA Solution */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="dark:text-foreground">Welding Alloys Solution</CardTitle>
          <CardDescription className="dark:text-muted-foreground">How WA solved the challenge</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose max-w-none">
            <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">{displayContent.waSolution}</p>
          </div>

          <div className="pt-4 border-t dark:border-border grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">WA Product Used</p>
              <p className="text-lg font-semibold text-wa-green-600 dark:text-primary">{caseStudy.waProduct}</p>
            </div>
            {caseStudy.waProductDiameter && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Wire Diameter</p>
                <p className="text-lg font-semibold dark:text-foreground">{caseStudy.waProductDiameter}</p>
              </div>
            )}
            {waFormatExpandedServiceLife({
              hours: caseStudy.jobDurationHours,
              days: caseStudy.jobDurationDays,
              weeks: caseStudy.jobDurationWeeks,
            }) && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Job Duration</p>
                <p className="text-lg font-semibold dark:text-foreground">
                  {waFormatExpandedServiceLife({
                    hours: caseStudy.jobDurationHours,
                    days: caseStudy.jobDurationDays,
                    weeks: caseStudy.jobDurationWeeks,
                  })}
                </p>
              </div>
            )}
          </div>

          {displayContent.technicalAdvantages && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Technical Advantages</p>
              <p className="text-base dark:text-foreground whitespace-pre-wrap">{displayContent.technicalAdvantages}</p>
            </div>
          )}

          {(caseStudy.expectedServiceLife || waFormatExpandedServiceLife({
            hours: caseStudy.expectedServiceLifeHours,
            days: caseStudy.expectedServiceLifeDays,
            weeks: caseStudy.expectedServiceLifeWeeks,
            months: caseStudy.expectedServiceLifeMonths,
            years: caseStudy.expectedServiceLifeYears,
          })) && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Expected/Achieved Service Life</p>
              <p className="text-base dark:text-foreground">
                {waFormatExpandedServiceLife({
                  hours: caseStudy.expectedServiceLifeHours,
                  days: caseStudy.expectedServiceLifeDays,
                  weeks: caseStudy.expectedServiceLifeWeeks,
                  months: caseStudy.expectedServiceLifeMonths,
                  years: caseStudy.expectedServiceLifeYears,
                }) || caseStudy.expectedServiceLife}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images Gallery */}
      {caseStudy.images && caseStudy.images.length > 0 && (
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-foreground">
              <ImageIcon className="h-5 w-5 text-wa-green-600 dark:text-primary" />
              Images ({caseStudy.images.length})
            </CardTitle>
            <CardDescription className="dark:text-muted-foreground">Photos and visuals for this case study</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {caseStudy.images.map((imageUrl, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-border bg-gray-100 dark:bg-background">
                  <Image
                    src={imageUrl}
                    alt={`${caseStudy.customerName} - Image ${index + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supporting Documents */}
      {caseStudy.supportingDocs && caseStudy.supportingDocs.length > 0 && (
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-foreground">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Supporting Documents ({caseStudy.supportingDocs.length})
            </CardTitle>
            <CardDescription className="dark:text-muted-foreground">Documents and files for this case study</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {caseStudy.supportingDocs.map((docUrl, index) => {
                const fileName = decodeURIComponent(docUrl.split('/').pop()?.split('?')[0] || 'Document');
                const extension = fileName.split('.').pop()?.toLowerCase();

                return (
                  <a
                    key={index}
                    href={docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 border border-gray-200 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-accent hover:border-wa-green-300 dark:hover:border-primary transition-all"
                  >
                    <FileText className={`h-8 w-8 flex-shrink-0 ${
                      extension === 'pdf' ? 'text-red-500 dark:text-red-400' :
                      extension === 'doc' || extension === 'docx' ? 'text-wa-green-500 dark:text-primary' :
                      extension === 'xls' || extension === 'xlsx' ? 'text-green-500 dark:text-green-400' :
                      extension === 'ppt' || extension === 'pptx' ? 'text-orange-500 dark:text-orange-400' :
                      'text-gray-500 dark:text-muted-foreground'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-wa-green-600 dark:text-primary hover:underline truncate">
                        {fileName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                        Click to view or download
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Information - Only for APPLICATION cases */}
      {caseStudy.type === 'APPLICATION' && (caseStudy.solutionValueRevenue || caseStudy.annualPotentialRevenue || caseStudy.customerSavingsAmount) && (
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-foreground">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-primary" />
              Financial Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {caseStudy.solutionValueRevenue && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Solution Value/Revenue</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-primary">
                    {getCurrencySymbol(caseStudy.revenueCurrency)}{Number(caseStudy.solutionValueRevenue).toLocaleString()}
                  </p>
                </div>
              )}

              {caseStudy.annualPotentialRevenue && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Annual Potential Revenue</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-primary">
                    {getCurrencySymbol(caseStudy.revenueCurrency)}{Number(caseStudy.annualPotentialRevenue).toLocaleString()}
                  </p>
                </div>
              )}

              {caseStudy.customerSavingsAmount && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Customer Savings</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-primary">
                    {getCurrencySymbol(caseStudy.revenueCurrency)}{Number(caseStudy.customerSavingsAmount).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Welding Procedure Specification - Only for TECH and STAR cases */}
      {(caseStudy.type === 'TECH' || caseStudy.type === 'STAR') && (
        <WeldingProcedureForm
          caseStudyId={caseStudy.id}
          existingData={wpsData ? {
            // Base Metal
            baseMetalType: wpsData.baseMetalType || undefined,
            baseMetalGrade: wpsData.baseMetalGrade || undefined,
            baseMetalThickness: wpsData.baseMetalThickness || undefined,
            surfacePreparation: wpsData.surfacePreparation || undefined,
            surfacePreparationOther: (wpsData as any).surfacePreparationOther || undefined,
            // Layers (new multi-layer structure)
            layers: (wpsData as any).layers || undefined,
            // Legacy fields for backward compatibility
            waProductName: wpsData.waProductName || undefined,
            waProductDiameter: wpsData.waProductDiameter || undefined,
            shieldingGas: wpsData.shieldingGas || undefined,
            shieldingFlowRate: wpsData.shieldingFlowRate || undefined,
            flux: wpsData.flux || undefined,
            standardDesignation: wpsData.standardDesignation || undefined,
            weldingProcess: wpsData.weldingProcess || undefined,
            currentType: wpsData.currentType || undefined,
            currentModeSynergy: wpsData.currentModeSynergy || undefined,
            wireFeedSpeed: wpsData.wireFeedSpeed || undefined,
            intensity: wpsData.intensity || undefined,
            voltage: wpsData.voltage || undefined,
            heatInput: wpsData.heatInput || undefined,
            weldingPosition: wpsData.weldingPosition || undefined,
            torchAngle: wpsData.torchAngle || undefined,
            stickOut: wpsData.stickOut || undefined,
            travelSpeed: wpsData.travelSpeed || undefined,
            oscillationWidth: wpsData.oscillationWidth || undefined,
            oscillationSpeed: wpsData.oscillationSpeed || undefined,
            oscillationStepOver: wpsData.oscillationStepOver || undefined,
            oscillationTempo: wpsData.oscillationTempo || undefined,
            // Heating Procedure (new fields)
            preheatingTemp: (wpsData as any).preheatingTemp || undefined,
            interpassTemp: (wpsData as any).interpassTemp || undefined,
            postheatingTemp: (wpsData as any).postheatingTemp || undefined,
            // Legacy heating fields
            preheatTemperature: wpsData.preheatTemperature || undefined,
            interpassTemperature: wpsData.interpassTemperature || undefined,
            postheatTemperature: wpsData.postheatTemperature || undefined,
            // PWHT (new fields)
            pwhtRequired: (wpsData as any).pwhtRequired || undefined,
            pwhtHeatingRate: (wpsData as any).pwhtHeatingRate || undefined,
            pwhtTempHoldingTime: (wpsData as any).pwhtTempHoldingTime || undefined,
            pwhtCoolingRate: (wpsData as any).pwhtCoolingRate || undefined,
            pwhtDetails: wpsData.pwhtDetails || undefined,
            // Documents
            documents: (wpsData as any).documents || undefined,
            // Other fields
            layerNumbers: wpsData.layerNumbers || undefined,
            hardness: wpsData.hardness || undefined,
            defectsObserved: wpsData.defectsObserved || undefined,
            additionalNotes: wpsData.additionalNotes || undefined,
          } : undefined}
        />
      )}

      {/* Cost Reduction Calculator - Only for STAR cases */}
      {caseStudy.type === 'STAR' && costCalcData && (
        <CostCalculatorDisplay
          data={{
            costOfPart: costCalcData.costOfPart ? Number(costCalcData.costOfPart) : null,
            costOfWaSolution: costCalcData.costOfWaSolution ? Number(costCalcData.costOfWaSolution) : null,
            oldSolutionLifetimeDays: costCalcData.oldSolutionLifetimeDays ? Number(costCalcData.oldSolutionLifetimeDays) : null,
            waSolutionLifetimeDays: costCalcData.waSolutionLifetimeDays ? Number(costCalcData.waSolutionLifetimeDays) : null,
            partsUsedPerYear: costCalcData.partsUsedPerYear ? Number(costCalcData.partsUsedPerYear) : null,
            maintenanceRepairCostBefore: costCalcData.maintenanceRepairCostBefore ? Number(costCalcData.maintenanceRepairCostBefore) : null,
            maintenanceRepairCostAfter: costCalcData.maintenanceRepairCostAfter ? Number(costCalcData.maintenanceRepairCostAfter) : null,
            disassemblyCostBefore: costCalcData.disassemblyCostBefore ? Number(costCalcData.disassemblyCostBefore) : null,
            disassemblyCostAfter: costCalcData.disassemblyCostAfter ? Number(costCalcData.disassemblyCostAfter) : null,
            downtimeCostPerEvent: costCalcData.downtimeCostPerEvent ? Number(costCalcData.downtimeCostPerEvent) : null,
            currency: costCalcData.currency,
            extraBenefits: costCalcData.extraBenefits,
            totalCostBefore: Number(costCalcData.totalCostBefore),
            totalCostAfter: Number(costCalcData.totalCostAfter),
            annualSavings: Number(costCalcData.annualSavings),
            savingsPercentage: Number(costCalcData.savingsPercentage),
            // Legacy fields
            materialCostBefore: costCalcData.materialCostBefore ? Number(costCalcData.materialCostBefore) : null,
            materialCostAfter: costCalcData.materialCostAfter ? Number(costCalcData.materialCostAfter) : null,
            laborCostBefore: costCalcData.laborCostBefore ? Number(costCalcData.laborCostBefore) : null,
            laborCostAfter: costCalcData.laborCostAfter ? Number(costCalcData.laborCostAfter) : null,
            downtimeCostBefore: costCalcData.downtimeCostBefore ? Number(costCalcData.downtimeCostBefore) : null,
            downtimeCostAfter: costCalcData.downtimeCostAfter ? Number(costCalcData.downtimeCostAfter) : null,
            maintenanceFrequencyBefore: costCalcData.maintenanceFrequencyBefore,
            maintenanceFrequencyAfter: costCalcData.maintenanceFrequencyAfter,
          }}
        />
      )}

      {/* Contributor Info */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="dark:text-foreground">Submitted By</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-400 dark:text-muted-foreground mt-0.5" />
            <div>
              <p className="text-base font-semibold dark:text-foreground">{caseStudy.contributor.name}</p>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">{caseStudy.contributor.email}</p>
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                Submitted on {new Date(caseStudy.submittedAt!).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Actions (Sticky Bottom) */}
      <div className="sticky bottom-0 bg-white dark:bg-card border-t dark:border-border shadow-lg p-4 -mx-4">
        <div className="max-w-5xl mx-auto">
          <ApprovalActions caseStudyId={caseStudy.id} />
        </div>
      </div>
    </div>
  );
}

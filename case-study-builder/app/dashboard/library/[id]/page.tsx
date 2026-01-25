import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SaveButton } from '@/components/save-button';
import { ShareButton } from '@/components/share-button';
import CostCalculatorDisplay from '@/components/cost-calculator-display';
import { WearTypeStarsDisplay } from '@/components/wear-type-progress-bar';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { auth } from '@/auth';
import type { CaseStudyPDFData } from '@/lib/pdf-export-ppt';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Package,
  Wrench,
  TrendingUp,
  DollarSign,
  Calendar,
  FileText,
  Globe,
  Languages,
  AlertCircle,
  Layers,
} from 'lucide-react';
import type { WpsLayer } from '@/lib/actions/waWpsActions';
import { waFormatJobType, waFormatProductCategory, waGetProductDisplay } from '@/lib/waUtils';

// Dynamic import for PDF export
const PDFExportButton = dynamic(() => import('@/components/pdf-export-button'), {
  loading: () => (
    <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
      <span className="text-gray-400">Loading...</span>
    </button>
  ),
});

// BRD 5.4.4 - Language display names for translation notice
const languageNames: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  it: 'Italian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  ru: 'Russian',
  nl: 'Dutch',
  pl: 'Polish',
  tr: 'Turkish',
};

function getLanguageName(code: string): string {
  return languageNames[code.toLowerCase()] || code.toUpperCase();
}

// Helper to display value or placeholder
function waDisplayValue(value: string | number | undefined | null, placeholder = '-'): string {
  if (value === undefined || value === null || value === '') return placeholder;
  return String(value);
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

// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', AUD: 'A$', CAD: 'C$',
  CHF: 'CHF', JPY: '¥', CNY: '¥', MAD: 'MAD',
};

function getCurrencySymbol(currency: string | null | undefined): string {
  return CURRENCY_SYMBOLS[currency || 'EUR'] || '€';
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseStudy = await prisma.waCaseStudy.findUnique({
    where: { id },
    select: { customerName: true, industry: true, status: true },
  });

  if (!caseStudy || caseStudy.status !== 'APPROVED') {
    return {
      title: 'Case Study Not Found',
    };
  }

  return {
    title: `${caseStudy.customerName} - ${caseStudy.industry} | Case Study Library`,
    description: `Industrial case study from ${caseStudy.industry} industry`,
  };
}

interface PageSearchParams {
  showOriginal?: string;
}

export default async function PublicCaseDetailPage({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<PageSearchParams>;
}) {
  const { id } = await params;
  const searchParams = await searchParamsPromise;
  const showOriginal = searchParams.showOriginal === 'true';

  const caseStudy = await prisma.waCaseStudy.findUnique({
    where: { id },
    include: {
      contributor: {
        select: {
          name: true,
          email: true,
        },
      },
      approver: {
        select: {
          name: true,
          email: true,
        },
      },
      costCalculator: true,
      wps: true,
    },
  });

  // Only show approved cases in public library
  if (!caseStudy || caseStudy.status !== 'APPROVED') {
    notFound();
  }

  // Get session for PDF export
  const session = await auth();

  // Prepare PDF export data (same as cases detail page for consistency)
  const pdfData: CaseStudyPDFData = {
    id: caseStudy.id,
    type: caseStudy.type as 'APPLICATION' | 'TECH' | 'STAR',
    title: caseStudy.title || undefined,
    customerName: caseStudy.customerName,
    industry: caseStudy.industry,
    componentWorkpiece: caseStudy.componentWorkpiece,
    workType: caseStudy.workType || undefined,
    wearType: caseStudy.wearType,
    wearSeverities: caseStudy.wearSeverities as Record<string, number> | undefined,
    problemDescription: caseStudy.problemDescription,
    previousSolution: caseStudy.previousSolution || undefined,
    previousServiceLife: waFormatExpandedServiceLife({
      hours: caseStudy.previousServiceLifeHours,
      days: caseStudy.previousServiceLifeDays,
      weeks: caseStudy.previousServiceLifeWeeks,
      months: caseStudy.previousServiceLifeMonths,
      years: caseStudy.previousServiceLifeYears,
    }) || caseStudy.previousServiceLife || undefined,
    competitorName: caseStudy.competitorName || undefined,
    baseMetal: caseStudy.baseMetal || undefined,
    generalDimensions: caseStudy.generalDimensions || undefined,
    waSolution: caseStudy.waSolution,
    productCategory: (caseStudy as any).productCategory || undefined,
    productCategoryOther: (caseStudy as any).productCategoryOther || undefined,
    waProduct: caseStudy.waProduct,
    waProductDiameter: caseStudy.waProductDiameter || undefined,
    productDescription: (caseStudy as any).productDescription || undefined,
    technicalAdvantages: caseStudy.technicalAdvantages || undefined,
    expectedServiceLife: waFormatExpandedServiceLife({
      hours: caseStudy.expectedServiceLifeHours,
      days: caseStudy.expectedServiceLifeDays,
      weeks: caseStudy.expectedServiceLifeWeeks,
      months: caseStudy.expectedServiceLifeMonths,
      years: caseStudy.expectedServiceLifeYears,
    }) || caseStudy.expectedServiceLife || undefined,
    revenueCurrency: caseStudy.revenueCurrency || 'EUR',
    solutionValueRevenue: caseStudy.solutionValueRevenue ? Number(caseStudy.solutionValueRevenue) : undefined,
    annualPotentialRevenue: caseStudy.annualPotentialRevenue ? Number(caseStudy.annualPotentialRevenue) : undefined,
    customerSavingsAmount: caseStudy.customerSavingsAmount ? Number(caseStudy.customerSavingsAmount) : undefined,
    location: caseStudy.location,
    country: caseStudy.country || undefined,
    // Job info
    jobType: caseStudy.jobType || undefined,
    jobTypeOther: caseStudy.jobTypeOther || undefined,
    oem: caseStudy.oem || undefined,
    jobDurationHours: caseStudy.jobDurationHours || undefined,
    jobDurationDays: caseStudy.jobDurationDays || undefined,
    jobDurationWeeks: caseStudy.jobDurationWeeks || undefined,
    jobDurationMonths: (caseStudy as any).jobDurationMonths || undefined,
    jobDurationYears: (caseStudy as any).jobDurationYears || undefined,
    // People
    contributor: {
      name: caseStudy.contributor?.name || 'Unknown',
    },
    approver: caseStudy.approver ? {
      name: caseStudy.approver.name || 'Unknown',
    } : undefined,
    // Dates
    createdAt: caseStudy.createdAt,
    approvedAt: caseStudy.approvedAt || undefined,
    // Translation fields
    originalLanguage: caseStudy.originalLanguage || undefined,
    translationAvailable: caseStudy.translationAvailable || undefined,
    translatedText: caseStudy.translatedText || undefined,
    // Cost calculator
    costCalculator: caseStudy.costCalculator ? {
      costOfPart: caseStudy.costCalculator.costOfPart ? Number(caseStudy.costCalculator.costOfPart) : undefined,
      costOfWaSolution: caseStudy.costCalculator.costOfWaSolution ? Number(caseStudy.costCalculator.costOfWaSolution) : undefined,
      oldSolutionLifetimeDays: caseStudy.costCalculator.oldSolutionLifetimeDays || undefined,
      waSolutionLifetimeDays: caseStudy.costCalculator.waSolutionLifetimeDays || undefined,
      partsUsedPerYear: caseStudy.costCalculator.partsUsedPerYear || undefined,
      currency: caseStudy.costCalculator.currency || undefined,
      annualSavings: caseStudy.costCalculator.annualSavings ? Number(caseStudy.costCalculator.annualSavings) : undefined,
      savingsPercentage: caseStudy.costCalculator.savingsPercentage ? Number(caseStudy.costCalculator.savingsPercentage) : undefined,
    } : undefined,
    // WPS data for TECH and STAR cases
    wps: caseStudy.wps ? {
      numberOfLayers: caseStudy.wps.layerNumbers?.toString() || undefined,
      process: caseStudy.wps.weldingProcess || undefined,
      technique: caseStudy.wps.currentModeSynergy || undefined,
      weldingPosition: caseStudy.wps.weldingPosition || undefined,
      torchPosition: caseStudy.wps.torchAngle || undefined,
      voltage: caseStudy.wps.voltage || undefined,
      intensity: caseStudy.wps.intensity || undefined,
      wireSpeed: caseStudy.wps.wireFeedSpeed || undefined,
      oscillationWidth: caseStudy.wps.oscillationWidth || undefined,
      oscillationSpeed: caseStudy.wps.oscillationSpeed || undefined,
      stickOut: caseStudy.wps.stickOut || undefined,
      weldingSpeed: caseStudy.wps.travelSpeed || undefined,
      shieldingGas: caseStudy.wps.shieldingGas || undefined,
      flowRate: caseStudy.wps.shieldingFlowRate || undefined,
      preheatTemperature: caseStudy.wps.preheatTemperature || undefined,
      interpassTemperature: caseStudy.wps.interpassTemperature || undefined,
      pwht: caseStudy.wps.pwhtDetails || undefined,
    } : undefined,
  };

  // Parse translation data if available
  let translatedContent: Record<string, string> = {};
  if (caseStudy.translationAvailable && caseStudy.translatedText) {
    try {
      const parsed = JSON.parse(caseStudy.translatedText);
      translatedContent = parsed.fields || {};
    } catch {
      // Ignore parse errors
    }
  }

  // Helper to get the appropriate content based on view mode
  // When showOriginal=false (default): show translated content if available
  // When showOriginal=true: show original content
  const getContent = (field: string, originalValue: string | null | undefined): string => {
    if (!originalValue) return '';
    if (showOriginal) return originalValue;
    return translatedContent[field] || originalValue;
  };

  // Content fields with possible translations
  const displayProblemDescription = getContent('problemDescription', caseStudy.problemDescription);
  const displayPreviousSolution = getContent('previousSolution', caseStudy.previousSolution);
  const displayWaSolution = getContent('waSolution', caseStudy.waSolution);
  const displayTechnicalAdvantages = getContent('technicalAdvantages', caseStudy.technicalAdvantages);
  const displayTitle = getContent('title', caseStudy.title);
  const displayIndustry = getContent('industry', caseStudy.industry);
  const displayLocation = getContent('location', caseStudy.location);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard/library">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Library
            </Button>
          </Link>
          <div className="flex gap-2">
            <ShareButton
              title={`${caseStudy.customerName} - Case Study`}
              text={`Check out this ${caseStudy.industry} case study from ${caseStudy.customerName}. ${caseStudy.problemDescription.substring(0, 100)}...`}
              variant="outline"
            />
            <SaveButton caseStudyId={id} variant="outline" />
            {session?.user && (
              <PDFExportButton
                caseStudy={pdfData}
                userName={session.user.name || 'Unknown User'}
                userEmail={session.user.email || undefined}
              />
            )}
          </div>
        </div>
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">{displayTitle || `${caseStudy.customerName} - ${caseStudy.componentWorkpiece}`}</h1>
              <p className="text-gray-600 dark:text-muted-foreground mt-2">
                {displayIndustry} • {displayLocation}
              </p>
            </div>
            <Badge
              variant={
                caseStudy.type === 'STAR'
                  ? 'default'
                  : caseStudy.type === 'TECH'
                  ? 'secondary'
                  : 'outline'
              }
              className="text-sm px-3 py-1"
            >
              {caseStudy.type}
            </Badge>
          </div>
        </div>
      </div>

      {/* BRD 5.4.4 - Translation Status Notice with Toggle */}
      {caseStudy.originalLanguage && caseStudy.originalLanguage !== 'en' && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Languages className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              {showOriginal ? (
                <>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Viewing original ({getLanguageName(caseStudy.originalLanguage)})
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    You are viewing the original content in {getLanguageName(caseStudy.originalLanguage)}.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Auto-translated from {getLanguageName(caseStudy.originalLanguage)}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    This content has been automatically translated. Some technical terms may vary.
                  </p>
                </>
              )}
            </div>
            {caseStudy.translationAvailable && (
              <Link
                href={showOriginal
                  ? `/dashboard/library/${id}`
                  : `/dashboard/library/${id}?showOriginal=true`}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 flex-shrink-0 font-medium"
              >
                {showOriginal ? 'View translated' : 'View original'}
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Key Information */}
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="dark:text-foreground">Case Study Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {/* General Description - Overview */}
            {caseStudy.generalDescription && (
              <div className="pb-4 mb-4 border-b dark:border-border">
                <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground mb-2">Overview</p>
                <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">{caseStudy.generalDescription}</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-wa-green-600 dark:text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground">Location</p>
                  <p className="text-gray-900 dark:text-foreground">{caseStudy.location}, {caseStudy.country}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-wa-green-600 dark:text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground">Industry</p>
                  <p className="text-gray-900 dark:text-foreground">{caseStudy.industry}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-wa-green-600 dark:text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground">Component/Workpiece</p>
                  <p className="text-gray-900 dark:text-foreground">{caseStudy.componentWorkpiece}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Wrench className="h-5 w-5 text-wa-green-600 dark:text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground">Work Type</p>
                  <p className="text-gray-900 dark:text-foreground">{caseStudy.workType}</p>
                </div>
              </div>
              {caseStudy.jobType && (
                <div className="flex items-start gap-3">
                  <Wrench className="h-5 w-5 text-wa-green-600 dark:text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground">Job Type</p>
                    <p className="text-gray-900 dark:text-foreground">
                      {waFormatJobType(caseStudy.jobType, caseStudy.jobTypeOther)}
                    </p>
                  </div>
                </div>
              )}
              {caseStudy.oem && (
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-wa-green-600 dark:text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground">OEM</p>
                    <p className="text-gray-900 dark:text-foreground">{caseStudy.oem}</p>
                  </div>
                </div>
              )}
              {caseStudy.wearType && caseStudy.wearType.length > 0 && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <FileText className="h-5 w-5 text-wa-green-600 dark:text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground mb-2">Wear Types</p>
                    <WearTypeStarsDisplay
                      wearTypes={caseStudy.wearType}
                      wearSeverities={caseStudy.wearSeverities as Record<string, number> | null}
                      wearTypeOthers={caseStudy.wearTypeOthers as { name: string; severity: number }[] | null}
                      showOnlySelected
                    />
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 md:col-span-2">
                <Calendar className="h-5 w-5 text-wa-green-600 dark:text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground">Approved</p>
                  <p className="text-gray-900 dark:text-foreground">
                    {caseStudy.approvedAt
                      ? new Date(caseStudy.approvedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Problem & Solution */}
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="dark:text-foreground">Problem Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">{displayProblemDescription}</p>
          </CardContent>
        </Card>

        {caseStudy.previousSolution && (
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="dark:text-foreground">Previous Solution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">{displayPreviousSolution}</p>
              {(caseStudy.previousServiceLife || waFormatExpandedServiceLife({
                hours: caseStudy.previousServiceLifeHours,
                days: caseStudy.previousServiceLifeDays,
                weeks: caseStudy.previousServiceLifeWeeks,
                months: caseStudy.previousServiceLifeMonths,
                years: caseStudy.previousServiceLifeYears,
              })) && (
                <p className="text-sm text-gray-600 dark:text-muted-foreground mt-2">
                  <span className="font-medium">Previous Service Life:</span>{' '}
                  {waFormatExpandedServiceLife({
                    hours: caseStudy.previousServiceLifeHours,
                    days: caseStudy.previousServiceLifeDays,
                    weeks: caseStudy.previousServiceLifeWeeks,
                    months: caseStudy.previousServiceLifeMonths,
                    years: caseStudy.previousServiceLifeYears,
                  }) || caseStudy.previousServiceLife}
                </p>
              )}
              {caseStudy.competitorName && (
                <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                  <span className="font-medium">Competitor:</span> {caseStudy.competitorName}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card role="article" className="border-2 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-400">Welding Alloys Solution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {(caseStudy as any).productCategory && (
                <div>
                  <p className="font-medium text-sm text-green-700 dark:text-green-300 mb-2">Product Category</p>
                  <p className="text-gray-900 dark:text-foreground text-lg font-semibold">
                    {waFormatProductCategory((caseStudy as any).productCategory, (caseStudy as any).productCategoryOther)}
                  </p>
                </div>
              )}
              <div>
                <p className="font-medium text-sm text-green-700 dark:text-green-300 mb-2">WA Product Used</p>
                <p className="text-gray-900 dark:text-foreground text-lg font-semibold">
                  {waGetProductDisplay({
                    productCategory: (caseStudy as any).productCategory,
                    waProduct: caseStudy.waProduct,
                    waProductDiameter: caseStudy.waProductDiameter,
                    productDescription: (caseStudy as any).productDescription,
                  })}
                </p>
              </div>
              {waFormatExpandedServiceLife({
                hours: caseStudy.jobDurationHours,
                days: caseStudy.jobDurationDays,
                weeks: caseStudy.jobDurationWeeks,
                months: (caseStudy as any).jobDurationMonths,
                years: (caseStudy as any).jobDurationYears,
              }) && (
                <div>
                  <p className="font-medium text-sm text-green-700 dark:text-green-300 mb-2">Job Duration</p>
                  <p className="text-gray-900 dark:text-foreground text-lg font-semibold">
                    {waFormatExpandedServiceLife({
                      hours: caseStudy.jobDurationHours,
                      days: caseStudy.jobDurationDays,
                      weeks: caseStudy.jobDurationWeeks,
                      months: (caseStudy as any).jobDurationMonths,
                      years: (caseStudy as any).jobDurationYears,
                    })}
                  </p>
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-sm text-green-700 dark:text-green-300 mb-2">Solution Description</p>
              <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">{displayWaSolution}</p>
            </div>
            {caseStudy.technicalAdvantages && (
              <div>
                <p className="font-medium text-sm text-green-700 dark:text-green-300 mb-2">Technical Advantages</p>
                <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">
                  {displayTechnicalAdvantages}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results & Benefits */}
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-foreground">
              <TrendingUp className="h-5 w-5 text-wa-green-600" />
              Results & Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {(caseStudy.expectedServiceLife || waFormatExpandedServiceLife({
                hours: caseStudy.expectedServiceLifeHours,
                days: caseStudy.expectedServiceLifeDays,
                weeks: caseStudy.expectedServiceLifeWeeks,
                months: caseStudy.expectedServiceLifeMonths,
                years: caseStudy.expectedServiceLifeYears,
              })) && (
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground mb-1">Expected Service Life</p>
                  <p className="text-2xl font-bold text-wa-green-600 dark:text-primary">
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
              {caseStudy.solutionValueRevenue && (
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground mb-1">Solution Value Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {getCurrencySymbol(caseStudy.revenueCurrency)}{parseFloat(caseStudy.solutionValueRevenue.toString()).toLocaleString()}
                  </p>
                </div>
              )}
              {caseStudy.annualPotentialRevenue && (
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground mb-1">
                    Annual Potential Revenue
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {getCurrencySymbol(caseStudy.revenueCurrency)}{parseFloat(caseStudy.annualPotentialRevenue.toString()).toLocaleString()}
                  </p>
                </div>
              )}
              {caseStudy.customerSavingsAmount && (
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground mb-1">Customer Savings</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {getCurrencySymbol(caseStudy.revenueCurrency)}{parseFloat(caseStudy.customerSavingsAmount.toString()).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cost Reduction Analysis (STAR cases) */}
        {caseStudy.costCalculator && (
          <CostCalculatorDisplay
            data={{
              costOfPart: caseStudy.costCalculator.costOfPart ? Number(caseStudy.costCalculator.costOfPart) : null,
              costOfWaSolution: caseStudy.costCalculator.costOfWaSolution ? Number(caseStudy.costCalculator.costOfWaSolution) : null,
              oldSolutionLifetimeDays: caseStudy.costCalculator.oldSolutionLifetimeDays ? Number(caseStudy.costCalculator.oldSolutionLifetimeDays) : null,
              waSolutionLifetimeDays: caseStudy.costCalculator.waSolutionLifetimeDays ? Number(caseStudy.costCalculator.waSolutionLifetimeDays) : null,
              partsUsedPerYear: caseStudy.costCalculator.partsUsedPerYear ? Number(caseStudy.costCalculator.partsUsedPerYear) : null,
              maintenanceRepairCostBefore: caseStudy.costCalculator.maintenanceRepairCostBefore ? Number(caseStudy.costCalculator.maintenanceRepairCostBefore) : null,
              maintenanceRepairCostAfter: caseStudy.costCalculator.maintenanceRepairCostAfter ? Number(caseStudy.costCalculator.maintenanceRepairCostAfter) : null,
              disassemblyCostBefore: caseStudy.costCalculator.disassemblyCostBefore ? Number(caseStudy.costCalculator.disassemblyCostBefore) : null,
              disassemblyCostAfter: caseStudy.costCalculator.disassemblyCostAfter ? Number(caseStudy.costCalculator.disassemblyCostAfter) : null,
              downtimeCostPerEvent: caseStudy.costCalculator.downtimeCostPerEvent ? Number(caseStudy.costCalculator.downtimeCostPerEvent) : null,
              currency: caseStudy.costCalculator.currency,
              extraBenefits: caseStudy.costCalculator.extraBenefits,
              totalCostBefore: Number(caseStudy.costCalculator.totalCostBefore),
              totalCostAfter: Number(caseStudy.costCalculator.totalCostAfter),
              annualSavings: Number(caseStudy.costCalculator.annualSavings),
              savingsPercentage: Number(caseStudy.costCalculator.savingsPercentage),
              // Legacy fields
              materialCostBefore: caseStudy.costCalculator.materialCostBefore ? Number(caseStudy.costCalculator.materialCostBefore) : null,
              materialCostAfter: caseStudy.costCalculator.materialCostAfter ? Number(caseStudy.costCalculator.materialCostAfter) : null,
              laborCostBefore: caseStudy.costCalculator.laborCostBefore ? Number(caseStudy.costCalculator.laborCostBefore) : null,
              laborCostAfter: caseStudy.costCalculator.laborCostAfter ? Number(caseStudy.costCalculator.laborCostAfter) : null,
              downtimeCostBefore: caseStudy.costCalculator.downtimeCostBefore ? Number(caseStudy.costCalculator.downtimeCostBefore) : null,
              downtimeCostAfter: caseStudy.costCalculator.downtimeCostAfter ? Number(caseStudy.costCalculator.downtimeCostAfter) : null,
              maintenanceFrequencyBefore: caseStudy.costCalculator.maintenanceFrequencyBefore,
              maintenanceFrequencyAfter: caseStudy.costCalculator.maintenanceFrequencyAfter,
            }}
          />
        )}

        {/* Welding Procedure (TECH/STAR cases) */}
        {caseStudy.wps && (
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="dark:text-foreground">Welding Procedure Specification</CardTitle>
              <CardDescription className="dark:text-muted-foreground">
                {(caseStudy.wps.layers as WpsLayer[] | undefined)?.length
                  ? `${(caseStudy.wps.layers as WpsLayer[]).length} layer(s) documented`
                  : 'Welding parameters and specifications'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Base Metal Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">Base Metal</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  {caseStudy.wps.baseMetalType && (
                    <div>
                      <p className="font-medium text-gray-600 dark:text-muted-foreground">Base Metal Type</p>
                      <p className="text-gray-900 dark:text-foreground">{caseStudy.wps.baseMetalType}</p>
                    </div>
                  )}
                  {caseStudy.wps.surfacePreparation && (
                    <div>
                      <p className="font-medium text-gray-600 dark:text-muted-foreground">Surface Preparation</p>
                      <p className="text-gray-900 dark:text-foreground">
                        {caseStudy.wps.surfacePreparation}
                        {caseStudy.wps.surfacePreparationOther && ` - ${caseStudy.wps.surfacePreparationOther}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Welding Layers Section */}
              {(caseStudy.wps.layers as WpsLayer[] | undefined)?.length ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2 flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Welding Layers
                  </h3>
                  {(caseStudy.wps.layers as WpsLayer[]).map((layer, index) => (
                    <div key={layer.id || index} className="border border-border rounded-lg p-4 space-y-4">
                      <h4 className="font-semibold text-wa-green-600 dark:text-primary">
                        Layer {index + 1}
                        {layer.waProductName && ` - ${layer.waProductName}`}
                      </h4>

                      {/* WA Consumables */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300">WA Consumables</h5>
                        <div className="grid md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-muted-foreground">Product Name</p>
                            <p className="font-medium text-gray-900 dark:text-foreground">{waDisplayValue(layer.waProductName)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-muted-foreground">Diameter</p>
                            <p className="font-medium text-gray-900 dark:text-foreground">{waDisplayValue(layer.waProductDiameter)} {layer.waProductDiameter && 'mm'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-muted-foreground">Process</p>
                            <p className="font-medium text-gray-900 dark:text-foreground">
                              {waDisplayValue(layer.weldingProcess)}
                              {layer.weldingProcessOther && ` - ${layer.weldingProcessOther}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-muted-foreground">Technique</p>
                            <p className="font-medium text-gray-900 dark:text-foreground">
                              {waDisplayValue(layer.technique)}
                              {layer.techniqueOther && ` - ${layer.techniqueOther}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-muted-foreground">Welding Position</p>
                            <p className="font-medium text-gray-900 dark:text-foreground">
                              {waDisplayValue(layer.weldingPosition)}
                              {layer.weldingPositionOther && ` - ${layer.weldingPositionOther}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-muted-foreground">Torch Position</p>
                            <p className="font-medium text-gray-900 dark:text-foreground">{waDisplayValue(layer.torchAngle)}</p>
                          </div>
                          {/* Shielding Gas - Only show for FCAW, GTAW, or Other processes */}
                          {(layer.weldingProcess === 'FCAW' || layer.weldingProcess === 'GTAW' || layer.weldingProcess === 'Other') && layer.shieldingGas && (
                            <div>
                              <p className="text-xs text-gray-500 dark:text-muted-foreground">Shielding Gas</p>
                              <p className="font-medium text-gray-900 dark:text-foreground">
                                {waDisplayValue(layer.shieldingGas)}
                                {layer.shieldingGasOther && ` - ${layer.shieldingGasOther}`}
                              </p>
                            </div>
                          )}
                          {/* Flow Rate - Only show when shielding gas is selected and not self-shielded */}
                          {layer.shieldingFlowRate && layer.shieldingGas && layer.shieldingGas !== 'Self shielded' && (
                            <div>
                              <p className="text-xs text-gray-500 dark:text-muted-foreground">Flow Rate (L/min)</p>
                              <p className="font-medium text-gray-900 dark:text-foreground">{layer.shieldingFlowRate}</p>
                            </div>
                          )}
                          {layer.flux && (
                            <div>
                              <p className="text-xs text-gray-500 dark:text-muted-foreground">Flux</p>
                              <p className="font-medium text-gray-900 dark:text-foreground">
                                {layer.flux}
                                {layer.fluxOther && ` - ${layer.fluxOther}`}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* WA Parameters */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300">WA Parameters</h5>
                        <div className="grid md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-muted-foreground">Stick-out</p>
                            <p className="font-medium text-gray-900 dark:text-foreground">{waDisplayValue(layer.stickOut)} {layer.stickOut && 'mm'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-muted-foreground">Type of Current</p>
                            <p className="font-medium text-gray-900 dark:text-foreground">
                              {waDisplayValue(layer.currentType)}
                              {layer.currentTypeOther && ` - ${layer.currentTypeOther}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-muted-foreground">Welding Mode</p>
                            <p className="font-medium text-gray-900 dark:text-foreground">
                              {waDisplayValue(layer.currentModeSynergy)}
                              {layer.currentModeSynergyOther && ` - ${layer.currentModeSynergyOther}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-muted-foreground">Wire Feed Speed</p>
                            <p className="font-medium text-gray-900 dark:text-foreground">{waDisplayValue(layer.wireFeedSpeed)} {layer.wireFeedSpeed && 'm/min'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-muted-foreground">Intensity</p>
                            <p className="font-medium text-gray-900 dark:text-foreground">{waDisplayValue(layer.intensity)} {layer.intensity && 'A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-muted-foreground">Voltage</p>
                            <p className="font-medium text-gray-900 dark:text-foreground">{waDisplayValue(layer.voltage)} {layer.voltage && 'V'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-muted-foreground">Welding Speed</p>
                            <p className="font-medium text-gray-900 dark:text-foreground">{waDisplayValue(layer.travelSpeed)} {layer.travelSpeed && 'cm/min'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Oscillation Details */}
                      {(layer.oscillationAmplitude || layer.oscillationPeriod || layer.oscillationTempos) && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300">Oscillation Details</h5>
                          <div className="grid md:grid-cols-3 gap-3 text-sm">
                            {layer.oscillationAmplitude && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-muted-foreground">Amplitude</p>
                                <p className="font-medium text-gray-900 dark:text-foreground">{layer.oscillationAmplitude} mm</p>
                              </div>
                            )}
                            {layer.oscillationPeriod && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-muted-foreground">Period</p>
                                <p className="font-medium text-gray-900 dark:text-foreground">{layer.oscillationPeriod} s</p>
                              </div>
                            )}
                            {layer.oscillationTempos && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-muted-foreground">Tempos</p>
                                <p className="font-medium text-gray-900 dark:text-foreground">{layer.oscillationTempos} s</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Legacy WPS Display */
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  {caseStudy.wps.weldingProcess && (
                    <div>
                      <p className="font-medium text-gray-600 dark:text-muted-foreground">Welding Process</p>
                      <p className="text-gray-900 dark:text-foreground">{caseStudy.wps.weldingProcess}</p>
                    </div>
                  )}
                  {caseStudy.wps.shieldingGas && (
                    <div>
                      <p className="font-medium text-gray-600 dark:text-muted-foreground">Shielding Gas</p>
                      <p className="text-gray-900 dark:text-foreground">{caseStudy.wps.shieldingGas}</p>
                    </div>
                  )}
                  {caseStudy.wps.currentType && (
                    <div>
                      <p className="font-medium text-gray-600 dark:text-muted-foreground">Current Type</p>
                      <p className="text-gray-900 dark:text-foreground">{caseStudy.wps.currentType}</p>
                    </div>
                  )}
                  {caseStudy.wps.voltage && (
                    <div>
                      <p className="font-medium text-gray-600 dark:text-muted-foreground">Voltage</p>
                      <p className="text-gray-900 dark:text-foreground">{caseStudy.wps.voltage}</p>
                    </div>
                  )}
                  {caseStudy.wps.intensity && (
                    <div>
                      <p className="font-medium text-gray-600 dark:text-muted-foreground">Current/Intensity</p>
                      <p className="text-gray-900 dark:text-foreground">{caseStudy.wps.intensity}</p>
                    </div>
                  )}
                  {caseStudy.wps.wireFeedSpeed && (
                    <div>
                      <p className="font-medium text-gray-600 dark:text-muted-foreground">Wire Feed Speed</p>
                      <p className="text-gray-900 dark:text-foreground">{caseStudy.wps.wireFeedSpeed}</p>
                    </div>
                  )}
                  {caseStudy.wps.travelSpeed && (
                    <div>
                      <p className="font-medium text-gray-600 dark:text-muted-foreground">Travel Speed</p>
                      <p className="text-gray-900 dark:text-foreground">{caseStudy.wps.travelSpeed}</p>
                    </div>
                  )}
                  {caseStudy.wps.weldingPosition && (
                    <div>
                      <p className="font-medium text-gray-600 dark:text-muted-foreground">Welding Position</p>
                      <p className="text-gray-900 dark:text-foreground">{caseStudy.wps.weldingPosition}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Heating Procedure Section */}
              {(caseStudy.wps.preheatingTemp || caseStudy.wps.interpassTemp || caseStudy.wps.postheatingTemp ||
                caseStudy.wps.preheatTemperature || caseStudy.wps.interpassTemperature || caseStudy.wps.postheatTemperature) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">Heating Procedure</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-600 dark:text-muted-foreground">Preheating Temperature</p>
                      <p className="text-gray-900 dark:text-foreground">
                        {waDisplayValue(caseStudy.wps.preheatingTemp || caseStudy.wps.preheatTemperature)} {(caseStudy.wps.preheatingTemp || caseStudy.wps.preheatTemperature) && '°C'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600 dark:text-muted-foreground">Interpass Temperature</p>
                      <p className="text-gray-900 dark:text-foreground">
                        {waDisplayValue(caseStudy.wps.interpassTemp || caseStudy.wps.interpassTemperature)} {(caseStudy.wps.interpassTemp || caseStudy.wps.interpassTemperature) && '°C'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600 dark:text-muted-foreground">Postheating Temperature</p>
                      <p className="text-gray-900 dark:text-foreground">
                        {waDisplayValue(caseStudy.wps.postheatingTemp || caseStudy.wps.postheatTemperature)} {(caseStudy.wps.postheatingTemp || caseStudy.wps.postheatTemperature) && '°C'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PWHT Section */}
              {caseStudy.wps.pwhtRequired === 'Y' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">Post Weld Heat Treatment (PWHT)</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    {caseStudy.wps.pwhtHeatingRate && (
                      <div>
                        <p className="font-medium text-gray-600 dark:text-muted-foreground">Heating Rate</p>
                        <p className="text-gray-900 dark:text-foreground">{caseStudy.wps.pwhtHeatingRate} °C/h</p>
                      </div>
                    )}
                    {caseStudy.wps.pwhtTempHoldingTime && (
                      <div>
                        <p className="font-medium text-gray-600 dark:text-muted-foreground">Temperature & Holding Time</p>
                        <p className="text-gray-900 dark:text-foreground">{caseStudy.wps.pwhtTempHoldingTime}</p>
                      </div>
                    )}
                    {caseStudy.wps.pwhtCoolingRate && (
                      <div>
                        <p className="font-medium text-gray-600 dark:text-muted-foreground">Cooling Rate</p>
                        <p className="text-gray-900 dark:text-foreground">{caseStudy.wps.pwhtCoolingRate} °C/h</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Legacy PWHT Details */}
              {caseStudy.wps.pwhtDetails && !caseStudy.wps.pwhtRequired && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">PWHT Details</h3>
                  <p className="text-gray-900 dark:text-foreground text-sm">{caseStudy.wps.pwhtDetails}</p>
                </div>
              )}

              {/* Documents Section */}
              {caseStudy.wps.documents && (caseStudy.wps.documents as any[]).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">Supporting Documents</h3>
                  <div className="space-y-2">
                    {(caseStudy.wps.documents as any[]).map((doc: any, index: number) => {
                      const isImage = doc.type?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(doc.name);
                      return (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 dark:bg-muted/20 rounded-lg">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-gray-900 dark:text-foreground">{doc.name}</span>
                          {doc.url && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={doc.name}
                              className="text-sm text-wa-green-600 dark:text-primary hover:underline ml-auto"
                            >
                              {isImage ? 'View' : 'Download'}
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Additional Notes Section */}
              {caseStudy.wps.additionalNotes && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground border-b dark:border-border pb-2">Additional Notes</h3>
                  <p className="text-gray-900 dark:text-foreground text-sm whitespace-pre-wrap">{caseStudy.wps.additionalNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

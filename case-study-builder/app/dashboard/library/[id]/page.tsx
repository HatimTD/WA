import { prisma } from '@/lib/prisma';
import { waSafeUrl } from '@/lib/waSafeUrl';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SaveButton } from '@/components/save-button';
import { ShareButton } from '@/components/share-button';
import CostCalculatorDisplay from '@/components/cost-calculator-display';
import { WearTypeStarsDisplay } from '@/components/wear-type-progress-bar';
import Link from 'next/link';
import { auth } from '@/auth';
import EnhancedCommentsSection from '@/components/enhanced-comments-section';
import { waGetComments } from '@/lib/actions/waCommentActions';
// PDF EXPORT DISABLED - import dynamic from 'next/dynamic';
// PDF EXPORT DISABLED - import type { CaseStudyPDFData } from '@/lib/export_pdf_design3';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Package,
  Wrench,
  DollarSign,
  Calendar,
  FileText,
  Languages,
  Image as ImageIcon,
  User,
} from 'lucide-react';
import Image from 'next/image';
import { waFormatJobType, waFormatProductCategory, waGetProductDisplay } from '@/lib/waUtils';
import WeldingProcedureForm from '@/components/welding-procedure-form';
import { waGetWeldingProcedure } from '@/lib/actions/waWpsActions';
import TranslationPanel from '@/components/translation-panel';
import { TagColleagues } from '@/components/tag-colleagues';

// PDF EXPORT DISABLED - Dynamic import for PDF export
// const PDFExportButton = dynamic(() => import('@/components/pdf-export-button'), {
//   loading: () => (
//     <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
//       <span className="text-gray-400">Loading...</span>
//     </button>
//   ),
// });

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
    select: { industry: true, status: true },
  });

  if (!caseStudy || caseStudy.status !== 'APPROVED') {
    return {
      title: 'Case Study Not Found',
    };
  }

  return {
    title: `Case Study Details - ${caseStudy.industry}`,
    description: `Industrial case study from the ${caseStudy.industry} industry`,
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

  // Get session for comments and PDF export
  const session = await auth();
  // Check multi-role system for customer name visibility
  let canSeeCustomerName = session?.user?.role === 'ADMIN' || session?.user?.role === 'APPROVER';
  if (!canSeeCustomerName && session?.user?.id) {
    const userWithRoles = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userRoles: { select: { role: true } } },
    });
    const roles = userWithRoles?.userRoles?.map(ur => ur.role) || [];
    canSeeCustomerName = roles.includes('ADMIN') || roles.includes('APPROVER');
  }

  // Fetch comments and WPS data
  const [commentsResult, wpsResult] = await Promise.all([
    waGetComments(id),
    waGetWeldingProcedure(id),
  ]);
  const comments = commentsResult.comments || [];
  const existingWPS = wpsResult.wps;

  // PDF EXPORT DISABLED - Prepare PDF export data (same as cases detail page for consistency)
  // const pdfData: CaseStudyPDFData = {
  //   id: caseStudy.id,
  //   type: caseStudy.type as 'APPLICATION' | 'TECH' | 'STAR',
  //   title: caseStudy.title || undefined,
  //   customerName: caseStudy.customerName,
  //   industry: caseStudy.industry,
  //   componentWorkpiece: caseStudy.componentWorkpiece,
  //   workType: caseStudy.workType || undefined,
  //   wearType: caseStudy.wearType,
  //   wearSeverities: caseStudy.wearSeverities as Record<string, number> | undefined,
  //   wearTypeOthers: (caseStudy.wearTypeOthers as Array<{ name: string; severity: number }>) || undefined,
  //   problemDescription: caseStudy.problemDescription,
  //   previousSolution: caseStudy.previousSolution || undefined,
  //   previousServiceLife: waFormatExpandedServiceLife({
  //     hours: caseStudy.previousServiceLifeHours,
  //     days: caseStudy.previousServiceLifeDays,
  //     weeks: caseStudy.previousServiceLifeWeeks,
  //     months: caseStudy.previousServiceLifeMonths,
  //     years: caseStudy.previousServiceLifeYears,
  //   }) || caseStudy.previousServiceLife || undefined,
  //   competitorName: caseStudy.competitorName || undefined,
  //   baseMetal: caseStudy.baseMetal || undefined,
  //   generalDimensions: caseStudy.generalDimensions || undefined,
  //   waSolution: caseStudy.waSolution,
  //   productCategory: (caseStudy as any).productCategory || undefined,
  //   productCategoryOther: (caseStudy as any).productCategoryOther || undefined,
  //   waProduct: caseStudy.waProduct,
  //   waProductDiameter: caseStudy.waProductDiameter || undefined,
  //   productDescription: (caseStudy as any).productDescription || undefined,
  //   technicalAdvantages: caseStudy.technicalAdvantages || undefined,
  //   expectedServiceLife: waFormatExpandedServiceLife({
  //     hours: caseStudy.expectedServiceLifeHours,
  //     days: caseStudy.expectedServiceLifeDays,
  //     weeks: caseStudy.expectedServiceLifeWeeks,
  //     months: caseStudy.expectedServiceLifeMonths,
  //     years: caseStudy.expectedServiceLifeYears,
  //   }) || caseStudy.expectedServiceLife || undefined,
  //   revenueCurrency: caseStudy.revenueCurrency || 'EUR',
  //   solutionValueRevenue: caseStudy.solutionValueRevenue ? Number(caseStudy.solutionValueRevenue) : undefined,
  //   annualPotentialRevenue: caseStudy.annualPotentialRevenue ? Number(caseStudy.annualPotentialRevenue) : undefined,
  //   customerSavingsAmount: caseStudy.customerSavingsAmount ? Number(caseStudy.customerSavingsAmount) : undefined,
  //   location: caseStudy.location,
  //   country: caseStudy.country || undefined,
  //   // Job info
  //   jobType: caseStudy.jobType || undefined,
  //   jobTypeOther: caseStudy.jobTypeOther || undefined,
  //   oem: caseStudy.oem || undefined,
  //   jobDurationHours: caseStudy.jobDurationHours || undefined,
  //   jobDurationDays: caseStudy.jobDurationDays || undefined,
  //   jobDurationWeeks: caseStudy.jobDurationWeeks || undefined,
  //   jobDurationMonths: (caseStudy as any).jobDurationMonths || undefined,
  //   jobDurationYears: (caseStudy as any).jobDurationYears || undefined,
  //   // People
  //   contributor: {
  //     name: caseStudy.contributor?.name || 'Unknown',
  //   },
  //   approver: caseStudy.approver ? {
  //     name: caseStudy.approver.name || 'Unknown',
  //   } : undefined,
  //   // Dates
  //   createdAt: caseStudy.createdAt,
  //   approvedAt: caseStudy.approvedAt || undefined,
  //   // Translation fields
  //   originalLanguage: caseStudy.originalLanguage || undefined,
  //   translationAvailable: caseStudy.translationAvailable || undefined,
  //   translatedText: caseStudy.translatedText || undefined,
  //   // Cost calculator
  //   costCalculator: caseStudy.costCalculator ? {
  //     costOfPart: caseStudy.costCalculator.costOfPart ? Number(caseStudy.costCalculator.costOfPart) : undefined,
  //     costOfWaSolution: caseStudy.costCalculator.costOfWaSolution ? Number(caseStudy.costCalculator.costOfWaSolution) : undefined,
  //     oldSolutionLifetimeDays: caseStudy.costCalculator.oldSolutionLifetimeDays || undefined,
  //     waSolutionLifetimeDays: caseStudy.costCalculator.waSolutionLifetimeDays || undefined,
  //     partsUsedPerYear: caseStudy.costCalculator.partsUsedPerYear || undefined,
  //     currency: caseStudy.costCalculator.currency || undefined,
  //     annualSavings: caseStudy.costCalculator.annualSavings ? Number(caseStudy.costCalculator.annualSavings) : undefined,
  //     savingsPercentage: caseStudy.costCalculator.savingsPercentage ? Number(caseStudy.costCalculator.savingsPercentage) : undefined,
  //   } : undefined,
  //   // WPS data for TECH and STAR cases
  //   wps: caseStudy.wps ? {
  //     numberOfLayers: caseStudy.wps.layerNumbers?.toString() || undefined,
  //     process: caseStudy.wps.weldingProcess || undefined,
  //     technique: caseStudy.wps.currentModeSynergy || undefined,
  //     weldingPosition: caseStudy.wps.weldingPosition || undefined,
  //     torchPosition: caseStudy.wps.torchAngle || undefined,
  //     voltage: caseStudy.wps.voltage || undefined,
  //     intensity: caseStudy.wps.intensity || undefined,
  //     wireSpeed: caseStudy.wps.wireFeedSpeed || undefined,
  //     oscillationWidth: caseStudy.wps.oscillationWidth || undefined,
  //     oscillationSpeed: caseStudy.wps.oscillationSpeed || undefined,
  //     stickOut: caseStudy.wps.stickOut || undefined,
  //     weldingSpeed: caseStudy.wps.travelSpeed || undefined,
  //     shieldingGas: caseStudy.wps.shieldingGas || undefined,
  //     flowRate: caseStudy.wps.shieldingFlowRate || undefined,
  //     preheatTemperature: caseStudy.wps.preheatTemperature || undefined,
  //     interpassTemperature: caseStudy.wps.interpassTemperature || undefined,
  //     pwht: caseStudy.wps.pwhtDetails || undefined,
  //   } : undefined,
  // };

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
  const displayGeneralDescription = getContent('generalDescription', caseStudy.generalDescription);
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
              title={`${caseStudy.industry} - Case Study`}
              text={`Check out this ${caseStudy.industry} case study. ${caseStudy.componentWorkpiece}`}
              variant="outline"
            />
            <SaveButton caseStudyId={id} variant="outline" />
            {/* PDF EXPORT DISABLED
            {session?.user && (
              <PDFExportButton
                caseStudy={pdfData}
                userName={session.user.name || 'Unknown User'}
                userEmail={session.user.email || undefined}
              />
            )}
            */}
          </div>
        </div>
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">{displayTitle || (canSeeCustomerName ? `${caseStudy.customerName} - ${caseStudy.componentWorkpiece}` : caseStudy.componentWorkpiece)}</h1>
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
            <CardTitle className="dark:text-foreground">Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            {/* General Description - Overview (translated if available) */}
            {(displayGeneralDescription || caseStudy.generalDescription) && (
              <div className="pb-4 mb-4 border-b dark:border-border">
                <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground mb-2">Overview</p>
                <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">{displayGeneralDescription || caseStudy.generalDescription}</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-6">
              {canSeeCustomerName && caseStudy.customerName && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <Building2 className="h-5 w-5 text-wa-green-600 dark:text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground">Customer</p>
                    <p className="text-gray-900 dark:text-foreground">{caseStudy.customerName}</p>
                  </div>
                </div>
              )}
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
                  <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground">Business Type</p>
                  <p className="text-gray-900 dark:text-foreground">{({
                    'INTEGRA_WORKSHOP': 'Integra - Workshop',
                    'INTEGRA_ON_SITE': 'Integra - On Site',
                    'INTEGRA_COMBINATION': 'Integra - Combination',
                    'CONSUMABLE_SALES': 'Consumable Sales',
                    'WORKSHOP': 'Workshop',
                    'ON_SITE': 'On Site',
                    'BOTH': 'Both',
                  } as Record<string, string>)[caseStudy.workType || ''] || caseStudy.workType}</p>
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

            {(caseStudy.tags as string[])?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {(caseStudy.tags as string[]).map((tag) => (
                    <Badge key={tag} variant="outline" className="bg-wa-green-50 text-wa-green-700 border-wa-green-200 dark:bg-wa-green-900/20 dark:text-wa-green-400 dark:border-wa-green-800">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {caseStudy.baseMetal && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Base Metal</p>
                <p className="text-base dark:text-foreground">{caseStudy.baseMetal}</p>
              </div>
            )}

            {caseStudy.generalDimensions && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">
                  General Dimensions ({(caseStudy as any).unitSystem === 'IMPERIAL' ? 'inches' : 'mm'})
                </p>
                <p className="text-base dark:text-foreground">{caseStudy.generalDimensions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Problem Description */}
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="dark:text-foreground">Problem Description</CardTitle>
            <CardDescription className="dark:text-muted-foreground">The challenge the customer was facing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose max-w-none dark:prose-invert">
              <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">{displayProblemDescription}</p>
            </div>

            {displayPreviousSolution && (
              <div className="pt-4 border-t dark:border-border">
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Previous Solution</p>
                <p className="text-base dark:text-foreground">{displayPreviousSolution}</p>
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
          </CardContent>
        </Card>

        {/* WA Solution */}
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="dark:text-foreground">Welding Alloys Solution</CardTitle>
            <CardDescription className="dark:text-muted-foreground">How WA solved the challenge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose max-w-none dark:prose-invert">
              <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">{displayWaSolution}</p>
            </div>

            {(caseStudy as any).productCategory && (
              <div className="pt-4 border-t dark:border-border">
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Product Category</p>
                <p className="text-base font-semibold dark:text-foreground">
                  {waFormatProductCategory((caseStudy as any).productCategory, (caseStudy as any).productCategoryOther)}
                </p>
              </div>
            )}

            {(caseStudy as any).productCategory === 'CONSUMABLES' ? (
              <>
                <div className="pt-4 border-t dark:border-border">
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">WA Product Used</p>
                  <p className="text-lg font-semibold text-wa-green-600 dark:text-primary">{caseStudy.waProduct}</p>
                </div>
                {caseStudy.waProductDiameter && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Diameter</p>
                    <p className="text-base dark:text-foreground">{caseStudy.waProductDiameter} mm</p>
                  </div>
                )}
              </>
            ) : (caseStudy as any).productCategory === 'COMPOSITE_WEAR_PLATES' ? (
              <>
                <div className="pt-4 border-t dark:border-border">
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Product Name</p>
                  <p className="text-lg font-semibold text-wa-green-600 dark:text-primary">{caseStudy.waProduct}</p>
                </div>
                {(caseStudy as any).productDescription && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Thickness</p>
                    <p className="text-base dark:text-foreground">{(caseStudy as any).productDescription}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="pt-4 border-t dark:border-border">
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Product Description</p>
                <p className="text-lg font-semibold text-wa-green-600 dark:text-primary">
                  {(caseStudy as any).productDescription || caseStudy.waProduct || ''}
                </p>
              </div>
            )}

            {waFormatExpandedServiceLife({
              hours: caseStudy.jobDurationHours,
              days: caseStudy.jobDurationDays,
              weeks: caseStudy.jobDurationWeeks,
              months: (caseStudy as any).jobDurationMonths,
              years: (caseStudy as any).jobDurationYears,
            }) && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Job Duration</p>
                <p className="text-base dark:text-foreground">
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

            {displayTechnicalAdvantages && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Technical Advantages</p>
                <p className="text-base dark:text-foreground whitespace-pre-wrap">{displayTechnicalAdvantages}</p>
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
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Service Life</p>
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
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {caseStudy.images.map((imageUrl, index) => (
                  <a key={index} href={waSafeUrl(imageUrl)} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-border bg-gray-100 dark:bg-gray-800 cursor-pointer block">
                    <Image
                      src={imageUrl}
                      alt={`Case study image ${index + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </a>
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
                <FileText className="h-5 w-5 text-purple-600" />
                Supporting Documents ({caseStudy.supportingDocs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {caseStudy.supportingDocs.map((docUrl, index) => {
                  const fileName = decodeURIComponent(docUrl.split('/').pop()?.split('?')[0] || 'Document');
                  const extension = fileName.split('.').pop()?.toLowerCase();
                  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(extension || '');
                  const downloadUrl = isImage ? docUrl : `/api/documents/download?url=${encodeURIComponent(docUrl)}&filename=${encodeURIComponent(fileName)}`;
                  return (
                    <a
                      key={index}
                      href={waSafeUrl(downloadUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 border border-gray-200 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-card hover:border-wa-green-300 dark:hover:border-primary transition-all"
                    >
                      <FileText className={`h-8 w-8 flex-shrink-0 ${
                        extension === 'pdf' ? 'text-red-500' :
                        extension === 'doc' || extension === 'docx' ? 'text-wa-green-500 dark:text-primary' :
                        extension === 'xls' || extension === 'xlsx' ? 'text-green-500' :
                        extension === 'ppt' || extension === 'pptx' ? 'text-orange-500' :
                        'text-gray-500 dark:text-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-wa-green-600 dark:text-primary hover:underline truncate">{fileName}</p>
                        <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">Click to view or download</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial Impact - Only for APPLICATION and TECH cases */}
        {(caseStudy.type === 'APPLICATION' || caseStudy.type === 'TECH') && (caseStudy.solutionValueRevenue || caseStudy.customerSavingsAmount) && (
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-foreground">
                <DollarSign className="h-5 w-5 text-green-600" />
                Financial Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {caseStudy.solutionValueRevenue && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Solution Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {getCurrencySymbol(caseStudy.revenueCurrency)}{Number(caseStudy.solutionValueRevenue).toLocaleString()}
                    </p>
                  </div>
                )}

                {caseStudy.customerSavingsAmount && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Customer Savings</p>
                    <p className="text-2xl font-bold text-green-600">
                      {getCurrencySymbol(caseStudy.revenueCurrency)}{Number(caseStudy.customerSavingsAmount).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Welding Procedure Specification - matching dashboard/cases design */}
        {(caseStudy.type === 'TECH' || caseStudy.type === 'STAR') && (
          <WeldingProcedureForm
            caseStudyId={caseStudy.id}
            existingData={existingWPS ? {
              baseMetalType: existingWPS.baseMetalType || undefined,
              baseMetalGrade: existingWPS.baseMetalGrade || undefined,
              baseMetalThickness: existingWPS.baseMetalThickness || undefined,
              surfacePreparation: existingWPS.surfacePreparation || undefined,
              surfacePreparationOther: (existingWPS as any).surfacePreparationOther || undefined,
              layers: (existingWPS as any).layers || undefined,
              waProductName: existingWPS.waProductName || undefined,
              waProductDiameter: existingWPS.waProductDiameter || undefined,
              shieldingGas: existingWPS.shieldingGas || undefined,
              shieldingFlowRate: existingWPS.shieldingFlowRate || undefined,
              flux: existingWPS.flux || undefined,
              standardDesignation: existingWPS.standardDesignation || undefined,
              weldingProcess: existingWPS.weldingProcess || undefined,
              currentType: existingWPS.currentType || undefined,
              currentModeSynergy: existingWPS.currentModeSynergy || undefined,
              wireFeedSpeed: existingWPS.wireFeedSpeed || undefined,
              intensity: existingWPS.intensity || undefined,
              voltage: existingWPS.voltage || undefined,
              heatInput: existingWPS.heatInput || undefined,
              weldingPosition: existingWPS.weldingPosition || undefined,
              torchAngle: existingWPS.torchAngle || undefined,
              stickOut: existingWPS.stickOut || undefined,
              travelSpeed: existingWPS.travelSpeed || undefined,
              oscillationWidth: existingWPS.oscillationWidth || undefined,
              oscillationSpeed: existingWPS.oscillationSpeed || undefined,
              oscillationStepOver: existingWPS.oscillationStepOver || undefined,
              oscillationTempo: existingWPS.oscillationTempo || undefined,
              preheatingTemp: (existingWPS as any).preheatingTemp || undefined,
              interpassTemp: (existingWPS as any).interpassTemp || undefined,
              postheatingTemp: (existingWPS as any).postheatingTemp || undefined,
              pwhtRequired: (existingWPS as any).pwhtRequired || undefined,
              pwhtHeatingRate: (existingWPS as any).pwhtHeatingRate || undefined,
              pwhtTempHoldingTime: (existingWPS as any).pwhtTempHoldingTime || undefined,
              pwhtCoolingRate: (existingWPS as any).pwhtCoolingRate || undefined,
              preheatTemperature: existingWPS.preheatTemperature || undefined,
              interpassTemperature: existingWPS.interpassTemperature || undefined,
              postheatTemperature: existingWPS.postheatTemperature || undefined,
              pwhtDetails: existingWPS.pwhtDetails || undefined,
              documents: (existingWPS as any).documents || undefined,
              layerNumbers: existingWPS.layerNumbers || undefined,
              hardness: existingWPS.hardness || undefined,
              defectsObserved: existingWPS.defectsObserved || undefined,
              additionalNotes: existingWPS.additionalNotes || undefined,
            } : undefined}
          />
        )}

        {/* Translation Panel */}
        <TranslationPanel
          caseStudyId={caseStudy.id}
          originalLanguage={caseStudy.originalLanguage}
          translationAvailable={caseStudy.translationAvailable}
          translatedText={caseStudy.translatedText}
        />

        {/* Tag Colleagues */}
        {session?.user && (
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="dark:text-foreground">Collaborate</CardTitle>
              <CardDescription className="dark:text-muted-foreground">
                Tag colleagues to notify them about this case study
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TagColleagues caseStudyId={caseStudy.id} />
            </CardContent>
          </Card>
        )}

        {/* Submission Details */}
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="dark:text-foreground">Submission Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {caseStudy.contributor?.name && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Contributor</p>
                    <p className="text-base font-semibold dark:text-foreground">{caseStudy.contributor.name}</p>
                    {caseStudy.contributor.email && (
                      <p className="text-sm text-gray-600 dark:text-muted-foreground">{caseStudy.contributor.email}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Created</p>
                  <p className="text-base font-semibold dark:text-foreground">
                    {new Date(caseStudy.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {caseStudy.submittedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Submitted</p>
                    <p className="text-base font-semibold dark:text-foreground">
                      {new Date(caseStudy.submittedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}

              {caseStudy.approvedAt && caseStudy.approver && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Approved By</p>
                    <p className="text-base font-semibold dark:text-foreground">{caseStudy.approver.name}</p>
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">
                      {new Date(caseStudy.approvedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        {session?.user && (
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="dark:text-foreground">Comments</CardTitle>
              <CardDescription className="dark:text-muted-foreground">
                Discussion and feedback on this case study
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedCommentsSection
                caseStudyId={id}
                initialComments={comments}
                currentUserId={session.user.id}
                currentUserRole={session.user.role || 'CONTRIBUTOR'}
              />
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

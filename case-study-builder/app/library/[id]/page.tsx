import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SaveButton } from '@/components/save-button';
import CostCalculatorDisplay from '@/components/cost-calculator-display';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  LogIn,
  MapPin,
  Building2,
  Package,
  Wrench,
  DollarSign,
  Calendar,
  FileText,
  User,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { WearTypeStarsDisplay } from '@/components/wear-type-progress-bar';
import { waFormatJobType, waFormatProductCategory, waGetProductDisplay } from '@/lib/waUtils';
import LanguageIndicator from '@/components/language-indicator';
import WeldingProcedureForm from '@/components/welding-procedure-form';
import { waGetWeldingProcedure } from '@/lib/actions/waWpsActions';

// Language names for display
const LANGUAGE_NAMES: Record<string, string> = {
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

// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '\u20ac', USD: '$', GBP: '\u00a3', AUD: 'A$', CAD: 'C$',
  CHF: 'CHF', JPY: '\u00a5', CNY: '\u00a5', MAD: 'MAD',
};

function getCurrencySymbol(currency: string | null | undefined): string {
  return CURRENCY_SYMBOLS[currency || 'EUR'] || '\u20ac';
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

const getTypeColor = (type: string) => {
  switch (type) {
    case 'APPLICATION':
      return 'bg-wa-green-50 text-wa-green-600 border-wa-green-200';
    case 'TECH':
      return 'bg-purple-50 text-purple-600 border-purple-200';
    case 'STAR':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getTypePoints = (type: string, hasWps: boolean = false) => {
  switch (type) {
    case 'APPLICATION':
      return 1;
    case 'TECH':
      return 2;
    case 'STAR':
      return hasWps ? 4 : 3;
    default:
      return 0;
  }
};

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

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ showOriginal?: string }>;
};

export default async function PublicCaseDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { showOriginal } = await searchParams;

  // Determine if we should show original content or translated
  const displayOriginal = showOriginal === 'true';

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
          id: true,
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

  // Fetch WPS data
  const wpsResult = await waGetWeldingProcedure(id);
  const existingWPS = wpsResult.wps;

  // BRD: Show translated content (English) by default for public library
  const hasTranslation = Boolean(caseStudy.translationAvailable && caseStudy.translatedText);
  let displayContent = {
    generalDescription: caseStudy.generalDescription,
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
        generalDescription: fields.generalDescription || caseStudy.generalDescription,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-gray-200 dark:border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/library">
              <Button variant="ghost" size="sm" className="gap-2 dark:hover:bg-card">
                <ArrowLeft className="h-4 w-4" />
                Back to Library
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <SaveButton caseStudyId={id} />
              <Link href="/login">
                <Button size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In to Contribute
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
                {caseStudy.componentWorkpiece || caseStudy.industry}
              </h1>
              <p className="text-lg text-gray-600 dark:text-muted-foreground mt-2">
                {caseStudy.industry} &bull; {caseStudy.location}, {caseStudy.country || 'N/A'}
              </p>
              {/* Language Indicator with View Original/Translated toggle link */}
              {(caseStudy.originalLanguage !== 'en' || caseStudy.translationAvailable) && (
                <div className="mt-3">
                  <LanguageIndicator
                    originalLanguage={caseStudy.originalLanguage}
                    translationAvailable={caseStudy.translationAvailable}
                    translatedText={caseStudy.translatedText}
                    caseStudyId={caseStudy.id}
                    variant="inline"
                    showLink={true}
                    isViewingOriginal={displayOriginal}
                    basePath="/library"
                  />
                  {/* Show current view mode indicator */}
                  {caseStudy.translationAvailable && (
                    <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                      {displayOriginal
                        ? `Showing original ${LANGUAGE_NAMES[caseStudy.originalLanguage || 'en'] || caseStudy.originalLanguage} content`
                        : 'Showing translated English content'}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Badge className={`${getTypeColor(caseStudy.type)} border dark:border-border`}>
                {caseStudy.type} (+{getTypePoints(caseStudy.type, !!caseStudy.wps?.weldingProcess)} pts)
              </Badge>
              <Badge variant="outline" className="bg-green-100 text-green-700 dark:border-border">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  APPROVED
                </span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Basic Information */}
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="dark:text-foreground">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* General Description - Overview */}
            {(displayContent.generalDescription || caseStudy.generalDescription) && (
              <div className="pb-4 border-b dark:border-border">
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-2">Overview</p>
                <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">{displayContent.generalDescription || caseStudy.generalDescription}</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Industry</p>
                  <p className="text-base font-semibold dark:text-foreground">{caseStudy.industry}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Location</p>
                  <p className="text-base font-semibold dark:text-foreground">
                    {caseStudy.location}, {caseStudy.country || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Component/Workpiece</p>
                  <p className="text-base font-semibold dark:text-foreground">{caseStudy.componentWorkpiece}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Wrench className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Business Type</p>
                  <p className="text-base font-semibold dark:text-foreground">{({
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
                  <Wrench className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Job Type</p>
                    <p className="text-base font-semibold dark:text-foreground">
                      {waFormatJobType(caseStudy.jobType, caseStudy.jobTypeOther)}
                    </p>
                  </div>
                </div>
              )}

              {caseStudy.oem && (
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">OEM</p>
                    <p className="text-base font-semibold dark:text-foreground">{caseStudy.oem}</p>
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
              <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">{displayContent.problemDescription}</p>
            </div>

            {displayContent.previousSolution && (
              <div className="pt-4 border-t dark:border-border">
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
              <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">{displayContent.waSolution}</p>
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
              <CardDescription className="dark:text-muted-foreground">Photos and visuals for this case study</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {caseStudy.images.map((imageUrl, index) => (
                  <a key={index} href={imageUrl} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-border bg-gray-100 dark:bg-gray-800 cursor-pointer block">
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

        {/* Financial Information - Only for APPLICATION and TECH cases */}
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

        {/* Cost Calculator (STAR cases) */}
        {caseStudy.costCalculator && (
          <CostCalculatorDisplay
            data={{
              costOfPart: caseStudy.costCalculator.costOfPart ? Number(caseStudy.costCalculator.costOfPart) : null,
              costOfWaSolution: caseStudy.costCalculator.costOfWaSolution ? Number(caseStudy.costCalculator.costOfWaSolution) : null,
              oldSolutionLifetimeDays: caseStudy.costCalculator.oldSolutionLifetimeDays,
              waSolutionLifetimeDays: caseStudy.costCalculator.waSolutionLifetimeDays,
              partsUsedPerYear: caseStudy.costCalculator.partsUsedPerYear,
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
              // Legacy fields for backwards compatibility
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

        {/* Submission Details */}
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="dark:text-foreground">Submission Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
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

        {/* CTA Section */}
        <Card role="article" className="bg-gradient-to-r from-wa-green-600 to-purple-600 text-white border-0">
          <CardContent className="py-8 text-center">
            <h3 className="text-2xl font-bold mb-3">
              Inspired by this case study?
            </h3>
            <p className="text-wa-green-100 mb-6 max-w-xl mx-auto">
              Join our community and share your own success stories with Welding Alloys solutions
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/library">
                <Button variant="secondary" size="lg">
                  Browse More Cases
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/10 text-white border-white hover:bg-white/20 gap-2"
                >
                  <LogIn className="h-5 w-5" />
                  Sign In to Contribute
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShareButton } from '@/components/share-button';
import { ShareButtons } from '@/components/share-buttons';
import { EmailPDFButton } from '@/components/email-pdf-button';
import { TagColleagues } from '@/components/tag-colleagues';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
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
import CostCalculator from '@/components/cost-calculator';
import { waGetCostCalculation } from '@/lib/actions/waCostCalculatorActions';
import WeldingProcedureForm from '@/components/welding-procedure-form';
import { waGetWeldingProcedure } from '@/lib/actions/waWpsActions';
import EnhancedCommentsSection from '@/components/enhanced-comments-section';
import { waGetComments } from '@/lib/actions/waCommentActions';
import dynamic from 'next/dynamic';
import type { CaseStudyPDFData } from '@/lib/pdf-export';
import { CompletionIndicator } from '@/components/completion-indicator';
import { waCalculateCompletionPercentage, waGetFieldBreakdown } from '@/lib/utils/waCaseQuality';
import QualityScoreBadge from '@/components/quality-score-badge';
import type { CaseStudyWithRelations } from '@/lib/utils/waQualityScore';
import LanguageIndicator from '@/components/language-indicator';
import TranslationPanel from '@/components/translation-panel';

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

// Dynamic import for PDF export (saves ~200KB from jspdf)
const PDFExportButton = dynamic(() => import('@/components/pdf-export-button'), {
  loading: () => (
    <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
      <span className="text-gray-400">Loading PDF export...</span>
    </button>
  ),
});

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ showOriginal?: string }>;
};

export default async function CaseStudyDetailPage({ params, searchParams }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
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
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!caseStudy) {
    notFound();
  }

  // Fetch cost calculation if exists
  const costCalcResult = await waGetCostCalculation(id);
  const existingCostCalc = costCalcResult.calculation;

  // Fetch welding procedure if exists
  const wpsResult = await waGetWeldingProcedure(id);
  const existingWPS = wpsResult.wps;

  // Fetch comments
  const commentsResult = await waGetComments(id);
  const comments = commentsResult.comments || [];

  // Get current user info
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
    },
  });

  const isOwner = caseStudy.contributorId === session.user.id;
  const canEdit = isOwner && caseStudy.status === 'DRAFT';

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

  // Calculate completion percentage
  const completionPercentage = waCalculateCompletionPercentage(
    caseStudy,
    existingWPS,
    existingCostCalc
  );
  const breakdown = waGetFieldBreakdown(
    caseStudy,
    existingWPS,
    existingCostCalc
  );

  // Prepare data for PDF export
  const pdfData: CaseStudyPDFData = {
    id: caseStudy.id,
    type: caseStudy.type,
    customerName: caseStudy.customerName,
    industry: caseStudy.industry,
    componentWorkpiece: caseStudy.componentWorkpiece,
    workType: caseStudy.workType,
    wearType: caseStudy.wearType,
    problemDescription: caseStudy.problemDescription,
    previousSolution: caseStudy.previousSolution || undefined,
    previousServiceLife: caseStudy.previousServiceLife || undefined,
    competitorName: caseStudy.competitorName || undefined,
    baseMetal: caseStudy.baseMetal || undefined,
    generalDimensions: caseStudy.generalDimensions || undefined,
    waSolution: caseStudy.waSolution,
    waProduct: caseStudy.waProduct,
    technicalAdvantages: caseStudy.technicalAdvantages || undefined,
    expectedServiceLife: caseStudy.expectedServiceLife || undefined,
    solutionValueRevenue: caseStudy.solutionValueRevenue ? Number(caseStudy.solutionValueRevenue) : undefined,
    annualPotentialRevenue: caseStudy.annualPotentialRevenue ? Number(caseStudy.annualPotentialRevenue) : undefined,
    customerSavingsAmount: caseStudy.customerSavingsAmount ? Number(caseStudy.customerSavingsAmount) : undefined,
    location: caseStudy.location,
    country: caseStudy.country || undefined,
    contributor: {
      name: caseStudy.contributor.name || 'Unknown',
      email: caseStudy.contributor.email || '',
    },
    approver: caseStudy.approver ? {
      name: caseStudy.approver.name || 'Unknown',
    } : undefined,
    createdAt: caseStudy.createdAt,
    approvedAt: caseStudy.approvedAt || undefined,
    // Translation fields
    originalLanguage: caseStudy.originalLanguage || undefined,
    translationAvailable: caseStudy.translationAvailable || undefined,
    translatedText: caseStudy.translatedText || undefined,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Clock className="h-5 w-5 text-gray-500" />;
      case 'SUBMITTED':
        return <Clock className="h-5 w-5 text-wa-green-500" />;
      case 'APPROVED':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'PUBLISHED':
        return <CheckCircle2 className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700';
      case 'SUBMITTED':
        return 'bg-wa-green-100 text-wa-green-700';
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'PUBLISHED':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/my-cases">
          <Button variant="ghost" size="sm" className="dark:hover:bg-card">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Cases
          </Button>
        </Link>
        <div className="flex gap-2">
          <ShareButtons
            caseStudyId={caseStudy.id}
            title={`${caseStudy.customerName} - Case Study`}
            description={`${caseStudy.industry} case study: ${caseStudy.problemDescription.substring(0, 100)}...`}
            variant="outline"
            size="sm"
          />
          <EmailPDFButton
            caseStudyId={caseStudy.id}
            variant="outline"
            size="sm"
          />
          <PDFExportButton caseStudy={pdfData} />
          {canEdit && (
            <Link href={`/dashboard/cases/${caseStudy.id}/edit`}>
              <Button variant="outline" size="sm" className="dark:border-border">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Title and Status */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
              {caseStudy.title || `${caseStudy.customerName} - ${caseStudy.componentWorkpiece}`}
            </h1>
            <p className="text-lg text-gray-600 dark:text-muted-foreground mt-2">
              {caseStudy.location}, {caseStudy.country || 'N/A'}
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
                />
                {/* Show current view mode indicator */}
                {caseStudy.translationAvailable && (
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                    {displayOriginal
                      ? `📄 Showing original ${LANGUAGE_NAMES[caseStudy.originalLanguage || 'en'] || caseStudy.originalLanguage} content`
                      : '🌐 Showing translated English content'}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={`${getTypeColor(caseStudy.type)} border dark:border-border`}>
              {caseStudy.type} (+{getTypePoints(caseStudy.type)} pts)
            </Badge>
            <Badge variant="outline" className={`${getStatusColor(caseStudy.status)} dark:border-border`}>
              <span className="flex items-center gap-1">
                {getStatusIcon(caseStudy.status)}
                {caseStudy.status}
              </span>
            </Badge>
            <QualityScoreBadge
              caseStudy={{
                ...caseStudy,
                // Convert Decimal fields to numbers for client component serialization
                solutionValueRevenue: caseStudy.solutionValueRevenue ? Number(caseStudy.solutionValueRevenue) : null,
                annualPotentialRevenue: caseStudy.annualPotentialRevenue ? Number(caseStudy.annualPotentialRevenue) : null,
                customerSavingsAmount: caseStudy.customerSavingsAmount ? Number(caseStudy.customerSavingsAmount) : null,
                wps: existingWPS,
                costCalculator: existingCostCalc,
              } as CaseStudyWithRelations}
            />
          </div>
        </div>
      </div>

      {/* Completion Quality Indicator */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="dark:text-foreground">Case Study Quality</CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            Completion status based on filled fields
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CompletionIndicator
            percentage={completionPercentage}
            variant="full"
            showTooltip={true}
            missingFields={breakdown.missingFields}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t dark:border-border">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-muted-foreground">Required Fields</p>
              <p className="text-lg font-bold dark:text-foreground">
                {breakdown.required.filled}/{breakdown.required.total}
              </p>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-wa-green-500 dark:bg-primary transition-all"
                  style={{ width: `${(breakdown.required.filled / breakdown.required.total) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-muted-foreground">Optional Fields</p>
              <p className="text-lg font-bold dark:text-foreground">
                {breakdown.optional.filled}/{breakdown.optional.total}
              </p>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 dark:bg-blue-600 transition-all"
                  style={{ width: `${(breakdown.optional.filled / breakdown.optional.total) * 100}%` }}
                />
              </div>
            </div>

            {(caseStudy.type === 'TECH' || caseStudy.type === 'STAR') && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-muted-foreground">WPS Fields</p>
                <p className="text-lg font-bold dark:text-foreground">
                  {breakdown.wps.filled}/{breakdown.wps.total}
                </p>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 dark:bg-purple-600 transition-all"
                    style={{ width: `${breakdown.wps.total > 0 ? (breakdown.wps.filled / breakdown.wps.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {caseStudy.type === 'STAR' && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-muted-foreground">Cost Calculator</p>
                <p className="text-lg font-bold dark:text-foreground">
                  {breakdown.cost.filled}/{breakdown.cost.total}
                </p>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 dark:bg-yellow-600 transition-all"
                    style={{ width: `${breakdown.cost.total > 0 ? (breakdown.cost.filled / breakdown.cost.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {breakdown.missingFields.length > 0 && (
            <div className="pt-4 border-t dark:border-border">
              <p className="text-sm font-medium text-gray-700 dark:text-foreground mb-2">
                Missing Fields ({breakdown.missingFields.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {breakdown.missingFields.slice(0, 10).map((field, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs dark:border-border">
                    {field}
                  </Badge>
                ))}
                {breakdown.missingFields.length > 10 && (
                  <Badge variant="outline" className="text-xs dark:border-border">
                    +{breakdown.missingFields.length - 10} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="dark:text-foreground">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Work Type</p>
                <p className="text-base font-semibold dark:text-foreground">{caseStudy.workType}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-2">Type of Wear</p>
            <div className="flex flex-wrap gap-2">
              {caseStudy.wearType.map((wear) => (
                <Badge key={wear} variant="secondary" className="dark:bg-gray-800 dark:text-foreground">
                  {wear}
                </Badge>
              ))}
            </div>
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
              <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">General Dimensions</p>
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

          {caseStudy.previousServiceLife && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Previous Service Life</p>
              <p className="text-base dark:text-foreground">{caseStudy.previousServiceLife}</p>
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

          <div className="pt-4 border-t dark:border-border">
            <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">WA Product Used</p>
            <p className="text-lg font-semibold text-wa-green-600 dark:text-primary">{caseStudy.waProduct}</p>
          </div>

          {displayContent.technicalAdvantages && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Technical Advantages</p>
              <p className="text-base dark:text-foreground whitespace-pre-wrap">{displayContent.technicalAdvantages}</p>
            </div>
          )}

          {caseStudy.expectedServiceLife && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-1">Expected/Achieved Service Life</p>
              <p className="text-base dark:text-foreground">{caseStudy.expectedServiceLife}</p>
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
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-border bg-gray-100 dark:bg-gray-800">
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
      {(caseStudy.type === 'APPLICATION' || caseStudy.type === 'TECH') && (caseStudy.solutionValueRevenue || caseStudy.annualPotentialRevenue || caseStudy.customerSavingsAmount) && (
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-foreground">
              <DollarSign className="h-5 w-5 text-green-600" />
              Financial Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {caseStudy.solutionValueRevenue && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Solution Value/Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${Number(caseStudy.solutionValueRevenue).toLocaleString()}
                  </p>
                </div>
              )}

              {caseStudy.annualPotentialRevenue && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Annual Potential Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${Number(caseStudy.annualPotentialRevenue).toLocaleString()}
                  </p>
                </div>
              )}

              {caseStudy.customerSavingsAmount && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">Customer Savings</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${Number(caseStudy.customerSavingsAmount).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Reduction Calculator - Only for STAR cases */}
      {caseStudy.type === 'STAR' && (
        <CostCalculator
          caseStudyId={caseStudy.id}
          existingData={existingCostCalc ? {
            materialCostBefore: Number(existingCostCalc.materialCostBefore) || 0,
            materialCostAfter: Number(existingCostCalc.materialCostAfter) || 0,
            laborCostBefore: Number(existingCostCalc.laborCostBefore) || 0,
            laborCostAfter: Number(existingCostCalc.laborCostAfter) || 0,
            downtimeCostBefore: Number(existingCostCalc.downtimeCostBefore) || 0,
            downtimeCostAfter: Number(existingCostCalc.downtimeCostAfter) || 0,
            maintenanceFrequencyBefore: existingCostCalc.maintenanceFrequencyBefore || 12,
            maintenanceFrequencyAfter: existingCostCalc.maintenanceFrequencyAfter || 4,
            // New fields for Part Lifecycle, Maintenance & Repair, Disassembly/Assembly, Extra Benefits
            costOfPart: Number(existingCostCalc.costOfPart) || 0,
            oldSolutionLifetimeDays: existingCostCalc.oldSolutionLifetimeDays || 0,
            waSolutionLifetimeDays: existingCostCalc.waSolutionLifetimeDays || 0,
            partsUsedPerYear: existingCostCalc.partsUsedPerYear || 0,
            maintenanceRepairCostBefore: Number(existingCostCalc.maintenanceRepairCostBefore) || 0,
            maintenanceRepairCostAfter: Number(existingCostCalc.maintenanceRepairCostAfter) || 0,
            disassemblyCostBefore: Number(existingCostCalc.disassemblyCostBefore) || 0,
            disassemblyCostAfter: Number(existingCostCalc.disassemblyCostAfter) || 0,
            extraBenefits: existingCostCalc.extraBenefits || '',
          } : undefined}
        />
      )}

      {/* Welding Procedure Specification - Only for TECH and STAR cases */}
      {(caseStudy.type === 'TECH' || caseStudy.type === 'STAR') && (
        <WeldingProcedureForm
          caseStudyId={caseStudy.id}
        existingData={existingWPS ? {
          baseMetalType: existingWPS.baseMetalType || undefined,
          baseMetalGrade: existingWPS.baseMetalGrade || undefined,
          baseMetalThickness: existingWPS.baseMetalThickness || undefined,
          surfacePreparation: existingWPS.surfacePreparation || undefined,
          waProductName: existingWPS.waProductName,
          waProductDiameter: existingWPS.waProductDiameter || undefined,
          shieldingGas: existingWPS.shieldingGas || undefined,
          shieldingFlowRate: existingWPS.shieldingFlowRate || undefined,
          flux: existingWPS.flux || undefined,
          standardDesignation: existingWPS.standardDesignation || undefined,
          weldingProcess: existingWPS.weldingProcess,
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
          preheatTemperature: existingWPS.preheatTemperature || undefined,
          interpassTemperature: existingWPS.interpassTemperature || undefined,
          postheatTemperature: existingWPS.postheatTemperature || undefined,
          pwhtDetails: existingWPS.pwhtDetails || undefined,
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

      {/* Metadata */}
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
                <p className="text-sm text-gray-600 dark:text-muted-foreground">{caseStudy.contributor.email}</p>
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

      {/* Comments Section */}
      {currentUser && (
        <EnhancedCommentsSection
          caseStudyId={caseStudy.id}
          initialComments={comments}
          currentUserId={currentUser.id}
          currentUserRole={currentUser.role}
        />
      )}
    </div>
  );
}

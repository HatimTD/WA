import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { getCostCalculation } from '@/lib/actions/cost-calculator-actions';
import WeldingProcedureForm from '@/components/welding-procedure-form';
import { getWeldingProcedure } from '@/lib/actions/wps-actions';
import EnhancedCommentsSection from '@/components/enhanced-comments-section';
import { getComments } from '@/lib/actions/comment-actions';
import PDFExportButton from '@/components/pdf-export-button';
import type { CaseStudyPDFData } from '@/lib/pdf-export';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CaseStudyDetailPage({ params }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;

  const caseStudy = await prisma.caseStudy.findUnique({
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
  const costCalcResult = await getCostCalculation(id);
  const existingCostCalc = costCalcResult.calculation;

  // Fetch welding procedure if exists
  const wpsResult = await getWeldingProcedure(id);
  const existingWPS = wpsResult.wps;

  // Fetch comments
  const commentsResult = await getComments(id);
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
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Clock className="h-5 w-5 text-gray-500" />;
      case 'SUBMITTED':
        return <Clock className="h-5 w-5 text-blue-500" />;
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
        return 'bg-blue-100 text-blue-700';
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
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'TECH':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'STAR':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
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
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Cases
          </Button>
        </Link>
        <div className="flex gap-2">
          <PDFExportButton caseStudy={pdfData} />
          {canEdit && (
            <Link href={`/dashboard/cases/${caseStudy.id}/edit`}>
              <Button variant="outline" size="sm">
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
            <h1 className="text-3xl font-bold text-gray-900">
              {caseStudy.customerName} - {caseStudy.componentWorkpiece}
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              {caseStudy.location}, {caseStudy.country || 'N/A'}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={`${getTypeColor(caseStudy.type)} border`}>
              {caseStudy.type} (+{getTypePoints(caseStudy.type)} pts)
            </Badge>
            <Badge variant="outline" className={getStatusColor(caseStudy.status)}>
              <span className="flex items-center gap-1">
                {getStatusIcon(caseStudy.status)}
                {caseStudy.status}
              </span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Industry</p>
                <p className="text-base font-semibold">{caseStudy.industry}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-base font-semibold">
                  {caseStudy.location}, {caseStudy.country || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Component/Workpiece</p>
                <p className="text-base font-semibold">{caseStudy.componentWorkpiece}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Wrench className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Work Type</p>
                <p className="text-base font-semibold">{caseStudy.workType}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">Type of Wear</p>
            <div className="flex flex-wrap gap-2">
              {caseStudy.wearType.map((wear) => (
                <Badge key={wear} variant="secondary">
                  {wear}
                </Badge>
              ))}
            </div>
          </div>

          {caseStudy.baseMetal && (
            <div>
              <p className="text-sm font-medium text-gray-500">Base Metal</p>
              <p className="text-base">{caseStudy.baseMetal}</p>
            </div>
          )}

          {caseStudy.generalDimensions && (
            <div>
              <p className="text-sm font-medium text-gray-500">General Dimensions</p>
              <p className="text-base">{caseStudy.generalDimensions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Problem Description */}
      <Card>
        <CardHeader>
          <CardTitle>Problem Description</CardTitle>
          <CardDescription>The challenge the customer was facing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{caseStudy.problemDescription}</p>
          </div>

          {caseStudy.previousSolution && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-gray-500 mb-1">Previous Solution</p>
              <p className="text-base">{caseStudy.previousSolution}</p>
            </div>
          )}

          {caseStudy.previousServiceLife && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Previous Service Life</p>
              <p className="text-base">{caseStudy.previousServiceLife}</p>
            </div>
          )}

          {caseStudy.competitorName && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Competitor</p>
              <p className="text-base">{caseStudy.competitorName}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* WA Solution */}
      <Card>
        <CardHeader>
          <CardTitle>Welding Alloys Solution</CardTitle>
          <CardDescription>How WA solved the challenge</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{caseStudy.waSolution}</p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-gray-500 mb-1">WA Product Used</p>
            <p className="text-lg font-semibold text-blue-600">{caseStudy.waProduct}</p>
          </div>

          {caseStudy.technicalAdvantages && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Technical Advantages</p>
              <p className="text-base whitespace-pre-wrap">{caseStudy.technicalAdvantages}</p>
            </div>
          )}

          {caseStudy.expectedServiceLife && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Expected/Achieved Service Life</p>
              <p className="text-base">{caseStudy.expectedServiceLife}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images Gallery */}
      {caseStudy.images && caseStudy.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-600" />
              Images ({caseStudy.images.length})
            </CardTitle>
            <CardDescription>Photos and visuals for this case study</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {caseStudy.images.map((imageUrl, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Supporting Documents ({caseStudy.supportingDocs.length})
            </CardTitle>
            <CardDescription>Documents and files for this case study</CardDescription>
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
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all"
                  >
                    <FileText className={`h-8 w-8 flex-shrink-0 ${
                      extension === 'pdf' ? 'text-red-500' :
                      extension === 'doc' || extension === 'docx' ? 'text-blue-500' :
                      extension === 'xls' || extension === 'xlsx' ? 'text-green-500' :
                      extension === 'ppt' || extension === 'pptx' ? 'text-orange-500' :
                      'text-gray-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-600 hover:underline truncate">
                        {fileName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Financial Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {caseStudy.solutionValueRevenue && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Solution Value/Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${Number(caseStudy.solutionValueRevenue).toLocaleString()}
                  </p>
                </div>
              )}

              {caseStudy.annualPotentialRevenue && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Annual Potential Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${Number(caseStudy.annualPotentialRevenue).toLocaleString()}
                  </p>
                </div>
              )}

              {caseStudy.customerSavingsAmount && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Customer Savings</p>
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
            materialCostBefore: Number(existingCostCalc.materialCostBefore),
            materialCostAfter: Number(existingCostCalc.materialCostAfter),
            laborCostBefore: Number(existingCostCalc.laborCostBefore),
            laborCostAfter: Number(existingCostCalc.laborCostAfter),
            downtimeCostBefore: Number(existingCostCalc.downtimeCostBefore),
            downtimeCostAfter: Number(existingCostCalc.downtimeCostAfter),
            maintenanceFrequencyBefore: existingCostCalc.maintenanceFrequencyBefore,
            maintenanceFrequencyAfter: existingCostCalc.maintenanceFrequencyAfter,
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

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Contributor</p>
                <p className="text-base font-semibold">{caseStudy.contributor.name}</p>
                <p className="text-sm text-gray-600">{caseStudy.contributor.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-base font-semibold">
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
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Submitted</p>
                  <p className="text-base font-semibold">
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
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Approved By</p>
                  <p className="text-base font-semibold">{caseStudy.approver.name}</p>
                  <p className="text-sm text-gray-600">
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

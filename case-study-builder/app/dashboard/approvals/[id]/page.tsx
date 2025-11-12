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
import CostCalculator from '@/components/cost-calculator';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ApprovalReviewPage({ params }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // Only Approvers can access this page
  if (user?.role !== 'APPROVER') {
    redirect('/dashboard');
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
    wpsData = await prisma.weldingProcedure.findUnique({
      where: { caseStudyId: id },
    });
  }

  // Fetch Cost Calculator data if it's a STAR case
  let costCalcData = null;
  if (caseStudy.type === 'STAR') {
    costCalcData = await prisma.costCalculator.findUnique({
      where: { caseStudyId: id },
    });
  }

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
        <Link href="/dashboard/approvals">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Approvals
          </Button>
        </Link>
      </div>

      {/* Approval Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="text-xl">Review & Approve</CardTitle>
          <CardDescription>
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
            <h1 className="text-3xl font-bold text-gray-900">
              {caseStudy.customerName} - {caseStudy.componentWorkpiece}
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              {caseStudy.location}, {caseStudy.country || 'N/A'}
            </p>
          </div>
          <Badge className={`${getTypeColor(caseStudy.type)} border text-lg px-4 py-2`}>
            {caseStudy.type} (+{getTypePoints(caseStudy.type)} pts)
          </Badge>
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

          {(caseStudy.previousSolution || caseStudy.previousServiceLife || caseStudy.competitorName) && (
            <div className="pt-4 border-t space-y-3">
              {caseStudy.previousSolution && (
                <div>
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

      {/* Financial Information - Only for APPLICATION cases */}
      {caseStudy.type === 'APPLICATION' && (caseStudy.solutionValueRevenue || caseStudy.annualPotentialRevenue || caseStudy.customerSavingsAmount) && (
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

      {/* Welding Procedure Specification - Only for TECH and STAR cases */}
      {(caseStudy.type === 'TECH' || caseStudy.type === 'STAR') && (
        <WeldingProcedureForm
          caseStudyId={caseStudy.id}
          existingData={wpsData ? {
            baseMetalType: wpsData.baseMetalType || undefined,
            baseMetalGrade: wpsData.baseMetalGrade || undefined,
            baseMetalThickness: wpsData.baseMetalThickness || undefined,
            surfacePreparation: wpsData.surfacePreparation || undefined,
            waProductName: wpsData.waProductName,
            waProductDiameter: wpsData.waProductDiameter || undefined,
            shieldingGas: wpsData.shieldingGas || undefined,
            shieldingFlowRate: wpsData.shieldingFlowRate || undefined,
            flux: wpsData.flux || undefined,
            standardDesignation: wpsData.standardDesignation || undefined,
            weldingProcess: wpsData.weldingProcess,
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
            preheatTemperature: wpsData.preheatTemperature || undefined,
            interpassTemperature: wpsData.interpassTemperature || undefined,
            postheatTemperature: wpsData.postheatTemperature || undefined,
            pwhtDetails: wpsData.pwhtDetails || undefined,
            layerNumbers: wpsData.layerNumbers || undefined,
            hardness: wpsData.hardness || undefined,
            defectsObserved: wpsData.defectsObserved || undefined,
            additionalNotes: wpsData.additionalNotes || undefined,
          } : undefined}
        />
      )}

      {/* Cost Reduction Calculator - Only for STAR cases */}
      {caseStudy.type === 'STAR' && (
        <CostCalculator
          caseStudyId={caseStudy.id}
          existingData={costCalcData ? {
            materialCostBefore: Number(costCalcData.materialCostBefore),
            materialCostAfter: Number(costCalcData.materialCostAfter),
            laborCostBefore: Number(costCalcData.laborCostBefore),
            laborCostAfter: Number(costCalcData.laborCostAfter),
            downtimeCostBefore: Number(costCalcData.downtimeCostBefore),
            downtimeCostAfter: Number(costCalcData.downtimeCostAfter),
            maintenanceFrequencyBefore: costCalcData.maintenanceFrequencyBefore,
            maintenanceFrequencyAfter: costCalcData.maintenanceFrequencyAfter,
          } : undefined}
        />
      )}

      {/* Contributor Info */}
      <Card>
        <CardHeader>
          <CardTitle>Submitted By</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-base font-semibold">{caseStudy.contributor.name}</p>
              <p className="text-sm text-gray-600">{caseStudy.contributor.email}</p>
              <p className="text-xs text-gray-500 mt-1">
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
      <div className="sticky bottom-0 bg-white border-t shadow-lg p-4 -mx-4">
        <div className="max-w-5xl mx-auto">
          <ApprovalActions caseStudyId={caseStudy.id} />
        </div>
      </div>
    </div>
  );
}

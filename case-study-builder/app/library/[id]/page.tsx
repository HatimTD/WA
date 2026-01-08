import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SaveButton } from '@/components/save-button';
import CostCalculatorDisplay from '@/components/cost-calculator-display';
import Link from 'next/link';
import {
  ArrowLeft,
  LogIn,
  MapPin,
  Building2,
  Package,
  Wrench,
  TrendingUp,
  DollarSign,
  Calendar,
  FileText,
} from 'lucide-react';
import WearTypeProgressBar from '@/components/wear-type-progress-bar';

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

export default async function PublicCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseStudy = await prisma.waCaseStudy.findUnique({
    where: { id },
    include: {
      contributor: {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/library">
              <Button variant="ghost" size="sm" className="gap-2">
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{caseStudy.customerName}</h1>
              <p className="text-gray-600 mt-2">
                {caseStudy.industry} • {caseStudy.location}
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Key Information */}
        <Card role="article">
          <CardHeader>
            <CardTitle>Case Study Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-wa-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-gray-600">Location</p>
                  <p className="text-gray-900">{caseStudy.location}, {caseStudy.country}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-wa-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-gray-600">Industry</p>
                  <p className="text-gray-900">{caseStudy.industry}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-wa-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-gray-600">Component/Workpiece</p>
                  <p className="text-gray-900">{caseStudy.componentWorkpiece}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Wrench className="h-5 w-5 text-wa-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-gray-600">Work Type</p>
                  <p className="text-gray-900">{caseStudy.workType}</p>
                </div>
              </div>
              {caseStudy.jobType && (
                <div className="flex items-start gap-3">
                  <Wrench className="h-5 w-5 text-wa-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-gray-600">Job Type</p>
                    <p className="text-gray-900">
                      {caseStudy.jobType === 'OTHER' ? caseStudy.jobTypeOther || 'Other' : caseStudy.jobType}
                    </p>
                  </div>
                </div>
              )}
              {caseStudy.oem && (
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-wa-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-gray-600">OEM</p>
                    <p className="text-gray-900">{caseStudy.oem}</p>
                  </div>
                </div>
              )}
              {caseStudy.wearType && caseStudy.wearType.length > 0 && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <FileText className="h-5 w-5 text-wa-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-600 mb-2">Wear Types</p>
                    <WearTypeProgressBar
                      wearTypes={caseStudy.wearType}
                      wearSeverities={caseStudy.wearSeverities as Record<string, number> | null}
                      wearTypeOthers={caseStudy.wearTypeOthers as { name: string; severity: number }[] | null}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 md:col-span-2">
                <Calendar className="h-5 w-5 text-wa-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-gray-600">Approved</p>
                  <p className="text-gray-900">
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
        <Card role="article">
          <CardHeader>
            <CardTitle>Problem Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{caseStudy.problemDescription}</p>
          </CardContent>
        </Card>

        {caseStudy.previousSolution && (
          <Card role="article">
            <CardHeader>
              <CardTitle>Previous Solution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{caseStudy.previousSolution}</p>
              {caseStudy.previousServiceLife && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Previous Service Life:</span>{' '}
                  {caseStudy.previousServiceLife}
                </p>
              )}
              {caseStudy.competitorName && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Competitor:</span> {caseStudy.competitorName}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card role="article" className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Welding Alloys Solution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-sm text-green-700 mb-2">WA Product Used</p>
                <p className="text-gray-900 text-lg font-semibold">{caseStudy.waProduct}</p>
              </div>
              {caseStudy.waProductDiameter && (
                <div>
                  <p className="font-medium text-sm text-green-700 mb-2">Wire Diameter</p>
                  <p className="text-gray-900 text-lg font-semibold">{caseStudy.waProductDiameter}</p>
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-sm text-green-700 mb-2">Solution Description</p>
              <p className="text-gray-700 whitespace-pre-wrap">{caseStudy.waSolution}</p>
            </div>
            {caseStudy.technicalAdvantages && (
              <div>
                <p className="font-medium text-sm text-green-700 mb-2">Technical Advantages</p>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {caseStudy.technicalAdvantages}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results & Benefits */}
        <Card role="article">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-wa-green-600" />
              Results & Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {caseStudy.expectedServiceLife && (
                <div>
                  <p className="font-medium text-sm text-gray-600 mb-1">Expected Service Life</p>
                  <p className="text-2xl font-bold text-wa-green-600">
                    {caseStudy.expectedServiceLife}
                  </p>
                </div>
              )}
              {caseStudy.solutionValueRevenue && (
                <div>
                  <p className="font-medium text-sm text-gray-600 mb-1">Solution Value Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${parseFloat(caseStudy.solutionValueRevenue.toString()).toLocaleString()}
                  </p>
                </div>
              )}
              {caseStudy.annualPotentialRevenue && (
                <div>
                  <p className="font-medium text-sm text-gray-600 mb-1">
                    Annual Potential Revenue
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${parseFloat(caseStudy.annualPotentialRevenue.toString()).toLocaleString()}
                  </p>
                </div>
              )}
              {caseStudy.customerSavingsAmount && (
                <div>
                  <p className="font-medium text-sm text-gray-600 mb-1">Customer Savings</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${parseFloat(caseStudy.customerSavingsAmount.toString()).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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

        {/* Welding Procedure (TECH/STAR cases) */}
        {caseStudy.wps && (
          <Card role="article">
            <CardHeader>
              <CardTitle>Welding Procedure Specification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                {caseStudy.wps.baseMetalType && (
                  <div>
                    <p className="font-medium text-gray-600">Base Metal Type</p>
                    <p className="text-gray-900">{caseStudy.wps.baseMetalType}</p>
                  </div>
                )}
                {caseStudy.wps.weldingProcess && (
                  <div>
                    <p className="font-medium text-gray-600">Welding Process</p>
                    <p className="text-gray-900">{caseStudy.wps.weldingProcess}</p>
                  </div>
                )}
                {caseStudy.wps.shieldingGas && (
                  <div>
                    <p className="font-medium text-gray-600">Shielding Gas</p>
                    <p className="text-gray-900">{caseStudy.wps.shieldingGas}</p>
                  </div>
                )}
                {caseStudy.wps.currentType && (
                  <div>
                    <p className="font-medium text-gray-600">Current Type</p>
                    <p className="text-gray-900">{caseStudy.wps.currentType}</p>
                  </div>
                )}
                {caseStudy.wps.voltage && (
                  <div>
                    <p className="font-medium text-gray-600">Voltage</p>
                    <p className="text-gray-900">{caseStudy.wps.voltage}</p>
                  </div>
                )}
                {caseStudy.wps.intensity && (
                  <div>
                    <p className="font-medium text-gray-600">Current/Intensity</p>
                    <p className="text-gray-900">{caseStudy.wps.intensity}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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

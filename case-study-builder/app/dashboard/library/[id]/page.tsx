import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SaveButton } from '@/components/save-button';
import { ShareButton } from '@/components/share-button';
import Link from 'next/link';
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
} from 'lucide-react';

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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseStudy = await prisma.caseStudy.findUnique({
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
  const caseStudy = await prisma.caseStudy.findUnique({
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
          </div>
        </div>
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">{caseStudy.customerName}</h1>
              <p className="text-gray-600 dark:text-muted-foreground mt-2">
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

      {/* BRD 5.4.4 - Translation Status Notice */}
      {caseStudy.originalLanguage && caseStudy.originalLanguage !== 'en' && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Languages className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Auto-translated from {getLanguageName(caseStudy.originalLanguage)}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                This content has been automatically translated. Some technical terms may vary.
              </p>
            </div>
            {caseStudy.translationAvailable && (
              <Badge variant="outline" className="ml-auto text-blue-600 border-blue-300">
                <Globe className="h-3 w-3 mr-1" />
                Original Available
              </Badge>
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
              {caseStudy.wearType && caseStudy.wearType.length > 0 && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <FileText className="h-5 w-5 text-wa-green-600 dark:text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground">Wear Types</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {caseStudy.wearType.map((type) => (
                        <Badge key={type} variant="outline">
                          {type}
                        </Badge>
                      ))}
                    </div>
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
            <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">{caseStudy.problemDescription}</p>
          </CardContent>
        </Card>

        {caseStudy.previousSolution && (
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="dark:text-foreground">Previous Solution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">{caseStudy.previousSolution}</p>
              {caseStudy.previousServiceLife && (
                <p className="text-sm text-gray-600 dark:text-muted-foreground mt-2">
                  <span className="font-medium">Previous Service Life:</span>{' '}
                  {caseStudy.previousServiceLife}
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
            <div>
              <p className="font-medium text-sm text-green-700 dark:text-green-300 mb-2">WA Product Used</p>
              <p className="text-gray-900 dark:text-foreground text-lg font-semibold">{caseStudy.waProduct}</p>
            </div>
            <div>
              <p className="font-medium text-sm text-green-700 dark:text-green-300 mb-2">Solution Description</p>
              <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">{caseStudy.waSolution}</p>
            </div>
            {caseStudy.technicalAdvantages && (
              <div>
                <p className="font-medium text-sm text-green-700 dark:text-green-300 mb-2">Technical Advantages</p>
                <p className="text-gray-700 dark:text-foreground whitespace-pre-wrap">
                  {caseStudy.technicalAdvantages}
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
              {caseStudy.expectedServiceLife && (
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground mb-1">Expected Service Life</p>
                  <p className="text-2xl font-bold text-wa-green-600 dark:text-primary">
                    {caseStudy.expectedServiceLife}
                  </p>
                </div>
              )}
              {caseStudy.solutionValueRevenue && (
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground mb-1">Solution Value Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${parseFloat(caseStudy.solutionValueRevenue.toString()).toLocaleString()}
                  </p>
                </div>
              )}
              {caseStudy.annualPotentialRevenue && (
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground mb-1">
                    Annual Potential Revenue
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${parseFloat(caseStudy.annualPotentialRevenue.toString()).toLocaleString()}
                  </p>
                </div>
              )}
              {caseStudy.customerSavingsAmount && (
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground mb-1">Customer Savings</p>
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
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-foreground">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-primary" />
                Cost Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground mb-3">Before</p>
                  <div className="space-y-2 text-sm">
                    <p>
                      Material: ${parseFloat(caseStudy.costCalculator.materialCostBefore.toString()).toLocaleString()}
                    </p>
                    <p>
                      Labor: ${parseFloat(caseStudy.costCalculator.laborCostBefore.toString()).toLocaleString()}
                    </p>
                    <p>
                      Downtime: ${parseFloat(caseStudy.costCalculator.downtimeCostBefore.toString()).toLocaleString()}
                    </p>
                    <p className="font-bold text-lg pt-2">
                      Total: ${parseFloat(caseStudy.costCalculator.totalCostBefore.toString()).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-muted-foreground mb-3">After</p>
                  <div className="space-y-2 text-sm">
                    <p>
                      Material: ${parseFloat(caseStudy.costCalculator.materialCostAfter.toString()).toLocaleString()}
                    </p>
                    <p>
                      Labor: ${parseFloat(caseStudy.costCalculator.laborCostAfter.toString()).toLocaleString()}
                    </p>
                    <p>
                      Downtime: ${parseFloat(caseStudy.costCalculator.downtimeCostAfter.toString()).toLocaleString()}
                    </p>
                    <p className="font-bold text-lg pt-2">
                      Total: ${parseFloat(caseStudy.costCalculator.totalCostAfter.toString()).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="font-medium text-sm text-green-700 mb-3">Savings</p>
                  <p className="text-3xl font-bold text-green-600">
                    ${parseFloat(caseStudy.costCalculator.annualSavings.toString()).toLocaleString()}
                  </p>
                  <p className="text-sm text-green-700 mt-1">per year</p>
                  <p className="text-2xl font-bold text-green-600 mt-4">
                    {caseStudy.costCalculator.savingsPercentage}%
                  </p>
                  <p className="text-sm text-green-700">cost reduction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Welding Procedure (TECH/STAR cases) */}
        {caseStudy.wps && (
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="dark:text-foreground">Welding Procedure Specification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                {caseStudy.wps.baseMetalType && (
                  <div>
                    <p className="font-medium text-gray-600 dark:text-muted-foreground">Base Metal Type</p>
                    <p className="text-gray-900 dark:text-foreground">{caseStudy.wps.baseMetalType}</p>
                  </div>
                )}
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
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

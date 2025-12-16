import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Globe, Building2, Users, UserCheck, UserPlus, RefreshCw } from 'lucide-react';
import { waGetBhagProgress, waGetRegionalBhagProgress, waGetIndustryBhagProgress, waGetQualifierTypeBhagProgress, waGetContributorRegionBhagProgress } from '@/lib/actions/waBhagActions';
import type { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'BHAG Progress',
  description: 'Track progress toward solving 100,000 challenges by 2030',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function BHAGPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const [bhagResult, regionalResult, industryResult, qualifierResult, contributorRegionResult] = await Promise.all([
    waGetBhagProgress(),
    waGetRegionalBhagProgress(),
    waGetIndustryBhagProgress(),
    waGetQualifierTypeBhagProgress(),
    waGetContributorRegionBhagProgress(),
  ]);

  if (!bhagResult.success || !bhagResult.bhag) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <p className="text-center text-gray-600">Error loading BHAG data</p>
      </div>
    );
  }

  const { uniqueCount, totalCount, target, percentage, byType } = bhagResult.bhag;
  const regionalData = regionalResult.regionalData || [];
  const industryData = industryResult.industryData || [];
  const qualifierData = qualifierResult.qualifierData;
  const contributorRegionData = contributorRegionResult.contributorRegionData || [];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3 dark:text-foreground">
          <Target className="h-10 w-10 text-wa-green-600 dark:text-primary" />
          BHAG Progress Tracker
        </h1>
        <p className="text-gray-600 dark:text-muted-foreground mt-2">
          Big Hairy Audacious Goal: Building the world's largest industrial case study database
        </p>
      </div>

      {/* Main Progress Card */}
      <Card role="article" className="border-2 border-wa-green-200 bg-gradient-to-br from-wa-green-50 to-white dark:border-primary dark:bg-primary dark:from-primary dark:to-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl dark:text-white">Overall Progress</CardTitle>
              <CardDescription className="dark:text-white dark:opacity-80">Target: {target.toLocaleString()} unique case studies</CardDescription>
            </div>
            <TrendingUp className="h-10 w-10 text-wa-green-500 dark:text-white" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-wa-green-600 dark:text-white">{uniqueCount.toLocaleString()}</p>
              <p className="text-sm text-gray-600 dark:text-white dark:opacity-90 mt-2">Unique Cases</p>
              <p className="text-xs text-gray-500 dark:text-white dark:opacity-70">Deduplicated by Industry + Location + Component</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-purple-600 dark:text-white">{totalCount.toLocaleString()}</p>
              <p className="text-sm text-gray-600 dark:text-white dark:opacity-90 mt-2">Total Submissions</p>
              <p className="text-xs text-gray-500 dark:text-white dark:opacity-70">All approved case studies</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-green-600 dark:text-white">{percentage}%</p>
              <p className="text-sm text-gray-600 dark:text-white dark:opacity-90 mt-2">Complete</p>
              <p className="text-xs text-gray-500 dark:text-white dark:opacity-70">{(target - uniqueCount).toLocaleString()} cases to go</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <Progress value={percentage} className="h-4" />
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-white dark:opacity-70">
              <span>0</span>
              <span>{(target / 4).toLocaleString()}</span>
              <span>{(target / 2).toLocaleString()}</span>
              <span>{(target * 3 / 4).toLocaleString()}</span>
              <span>{target.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown by Type */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="dark:text-foreground">Breakdown by Case Type</CardTitle>
          <CardDescription className="dark:text-muted-foreground">Unique cases per category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-wa-green-50 border-2 border-wa-green-200 rounded-lg p-6 text-center dark:bg-accent dark:border-accent">
              <Badge className="bg-wa-green-100 text-wa-green-700 mb-3 text-sm dark:bg-accent dark:text-white dark:border dark:border-white">APPLICATION</Badge>
              <p className="text-4xl font-bold text-wa-green-600 dark:text-white mb-2">{byType.APPLICATION}</p>
              <p className="text-sm text-gray-600 dark:text-white dark:opacity-80 mb-3">unique cases</p>
              <Progress value={(byType.APPLICATION / uniqueCount) * 100} className="h-2" />
              <p className="text-xs text-gray-500 dark:text-white dark:opacity-70 mt-2">
                {Math.round((byType.APPLICATION / uniqueCount) * 100)}% of total
              </p>
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 text-center dark:bg-accent dark:border-accent">
              <Badge className="bg-purple-100 text-purple-700 mb-3 text-sm dark:bg-accent dark:text-white dark:border dark:border-white">TECH</Badge>
              <p className="text-4xl font-bold text-purple-600 dark:text-white mb-2">{byType.TECH}</p>
              <p className="text-sm text-gray-600 dark:text-white dark:opacity-80 mb-3">unique cases</p>
              <Progress value={(byType.TECH / uniqueCount) * 100} className="h-2" />
              <p className="text-xs text-gray-500 dark:text-white dark:opacity-70 mt-2">
                {Math.round((byType.TECH / uniqueCount) * 100)}% of total
              </p>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center dark:bg-accent dark:border-accent">
              <Badge className="bg-yellow-100 text-yellow-700 mb-3 text-sm dark:bg-accent dark:text-white dark:border dark:border-white">STAR</Badge>
              <p className="text-4xl font-bold text-yellow-700 dark:text-white mb-2">{byType.STAR}</p>
              <p className="text-sm text-gray-600 dark:text-white dark:opacity-80 mb-3">unique cases</p>
              <Progress value={(byType.STAR / uniqueCount) * 100} className="h-2" />
              <p className="text-xs text-gray-500 dark:text-white dark:opacity-70 mt-2">
                {Math.round((byType.STAR / uniqueCount) * 100)}% of total
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Qualifier Type Breakdown - NEW vs CROSS-SELL (BRD 3.5) */}
      {qualifierData && (
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-foreground">
              <UserCheck className="h-5 w-5 dark:text-primary" />
              Challenge Qualifier Breakdown
            </CardTitle>
            <CardDescription className="dark:text-muted-foreground">
              New Customer vs. Cross-Sell (BRD 3.5)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* New Customer */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center dark:bg-green-900/20 dark:border-green-700">
                <UserPlus className="h-6 w-6 mx-auto text-green-600 dark:text-green-400 mb-2" />
                <Badge className="bg-green-100 text-green-700 mb-2 dark:bg-green-900 dark:text-green-300">
                  {qualifierData.newCustomer.label}
                </Badge>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{qualifierData.newCustomer.count}</p>
                <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">{qualifierData.newCustomer.description}</p>
                {qualifierData.newCustomer.countsTowardTarget && (
                  <Badge className="mt-2 bg-green-600 text-white text-xs">Counts to Target</Badge>
                )}
              </div>

              {/* Cross-Sell */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center dark:bg-blue-900/20 dark:border-blue-700">
                <Users className="h-6 w-6 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
                <Badge className="bg-blue-100 text-blue-700 mb-2 dark:bg-blue-900 dark:text-blue-300">
                  {qualifierData.crossSell.label}
                </Badge>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{qualifierData.crossSell.count}</p>
                <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">{qualifierData.crossSell.description}</p>
                {qualifierData.crossSell.countsTowardTarget && (
                  <Badge className="mt-2 bg-blue-600 text-white text-xs">Counts to Target</Badge>
                )}
              </div>

              {/* Maintenance */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 text-center dark:bg-orange-900/20 dark:border-orange-700">
                <RefreshCw className="h-6 w-6 mx-auto text-orange-600 dark:text-orange-400 mb-2" />
                <Badge className="bg-orange-100 text-orange-700 mb-2 dark:bg-orange-900 dark:text-orange-300">
                  {qualifierData.maintenance.label}
                </Badge>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{qualifierData.maintenance.count}</p>
                <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">{qualifierData.maintenance.description}</p>
              </div>

              {/* Unqualified */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 text-center dark:bg-gray-800 dark:border-gray-600">
                <Target className="h-6 w-6 mx-auto text-gray-600 dark:text-gray-400 mb-2" />
                <Badge className="bg-gray-100 text-gray-700 mb-2 dark:bg-gray-700 dark:text-gray-300">
                  {qualifierData.unqualified.label}
                </Badge>
                <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{qualifierData.unqualified.count}</p>
                <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">{qualifierData.unqualified.description}</p>
              </div>
            </div>

            {/* Target Count Summary */}
            <div className="mt-6 p-4 bg-wa-green-50 border border-wa-green-200 rounded-lg dark:bg-primary dark:border-primary">
              <p className="text-center dark:text-white">
                <span className="font-bold text-wa-green-700 dark:text-white">
                  {qualifierData.newCustomer.count + qualifierData.crossSell.count}
                </span>
                <span className="text-gray-700 dark:text-white dark:opacity-90"> cases count toward the {target.toLocaleString()} target</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contributor Region Breakdown (BRD 3.5) */}
      {contributorRegionData.length > 0 && (
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-foreground">
              <Users className="h-5 w-5 dark:text-primary" />
              By Contributor Region
            </CardTitle>
            <CardDescription className="dark:text-muted-foreground">
              Unique cases grouped by contributor's assigned region (BRD 3.5)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {contributorRegionData.slice(0, 8).map((region) => (
                <div key={region.region} className="bg-purple-50 border border-purple-200 rounded-lg p-4 dark:bg-purple-900/20 dark:border-purple-700">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">{region.region}</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{region.uniqueCount}</p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground">unique cases</p>
                </div>
              ))}
            </div>
            {contributorRegionData.length > 8 && (
              <p className="text-sm text-gray-500 dark:text-muted-foreground mt-4 text-center">
                + {contributorRegionData.length - 8} more regions
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Regional Breakdown */}
      {regionalData.length > 0 && (
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-foreground">
              <Globe className="h-5 w-5 dark:text-primary" />
              By Case Study Location
            </CardTitle>
            <CardDescription className="dark:text-muted-foreground">Unique cases by case study location (original)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {regionalData.slice(0, 8).map((region) => (
                <div key={region.region} className="bg-gray-50 border border-gray-200 rounded-lg p-4 dark:bg-background dark:border-border">
                  <p className="text-sm font-medium text-gray-700 dark:text-foreground mb-1">{region.region}</p>
                  <p className="text-2xl font-bold text-wa-green-600 dark:text-primary">{region.uniqueCount}</p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground">unique cases</p>
                </div>
              ))}
            </div>
            {regionalData.length > 8 && (
              <p className="text-sm text-gray-500 dark:text-muted-foreground mt-4 text-center">
                + {regionalData.length - 8} more regions
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Industry Breakdown */}
      {industryData.length > 0 && (
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-foreground">
              <Building2 className="h-5 w-5 dark:text-primary" />
              Industry Distribution
            </CardTitle>
            <CardDescription className="dark:text-muted-foreground">Unique cases by industry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {industryData.slice(0, 10).map((industry, index) => (
                <div key={industry.industry} className="flex items-center gap-4">
                  <div className="w-8 text-center font-bold text-gray-400 dark:text-muted-foreground">#{index + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium dark:text-foreground">{industry.industry}</p>
                      <p className="text-sm font-bold text-wa-green-600 dark:text-primary">{industry.uniqueCount}</p>
                    </div>
                    <Progress
                      value={(industry.uniqueCount / uniqueCount) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
            {industryData.length > 10 && (
              <p className="text-sm text-gray-500 dark:text-muted-foreground mt-4 text-center">
                + {industryData.length - 10} more industries
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deduplication Info */}
      <Card role="article" className="bg-gray-50 border-gray-300 dark:bg-background dark:border-border">
        <CardHeader>
          <CardTitle className="text-lg dark:text-foreground">About Deduplication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700 dark:text-muted-foreground">
          <p>
            <strong className="dark:text-foreground">How we count unique cases:</strong> Case studies are considered unique based on
            the combination of <strong className="dark:text-foreground">Industry + Location + Component/Workpiece</strong>.
          </p>
          <p>
            <strong className="dark:text-foreground">Why this matters:</strong> This ensures we're measuring true diversity in our
            database rather than just the total number of submissions. The same problem solved in
            different industries or locations counts as separate unique cases.
          </p>
          <p>
            <strong className="dark:text-foreground">Example:</strong> A wear solution for pump impellers in Australian mining vs.
            Canadian mining would count as 2 unique cases, even if using the same WA product.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

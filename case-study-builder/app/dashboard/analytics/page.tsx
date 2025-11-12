import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnalyticsExportButton } from '@/components/analytics-export-button';
import Link from 'next/link';
import {
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Target,
  DollarSign,
  Calendar,
  Download,
} from 'lucide-react';
import BadgeDisplay from '@/components/badge-display';

export const metadata = {
  title: 'My Analytics - Dashboard',
  description: 'Personal contribution analytics and insights',
};

export default async function ContributorAnalyticsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch user data with all cases
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      totalPoints: true,
      badges: true,
      caseStudies: {
        select: {
          id: true,
          customerName: true,
          industry: true,
          type: true,
          status: true,
          createdAt: true,
          submittedAt: true,
          approvedAt: true,
          solutionValueRevenue: true,
          annualPotentialRevenue: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  // Calculate metrics
  const totalCases = user.caseStudies.length;
  const approvedCases = user.caseStudies.filter((c) => c.status === 'APPROVED');
  const rejectedCases = user.caseStudies.filter((c) => c.status === 'REJECTED');
  const pendingCases = user.caseStudies.filter((c) => c.status === 'SUBMITTED');
  const draftCases = user.caseStudies.filter((c) => c.status === 'DRAFT');

  const approvalRate =
    totalCases > 0 ? Math.round((approvedCases.length / totalCases) * 100) : 0;

  // Type breakdown
  const byType = {
    APPLICATION: user.caseStudies.filter((c) => c.type === 'APPLICATION').length,
    TECH: user.caseStudies.filter((c) => c.type === 'TECH').length,
    STAR: user.caseStudies.filter((c) => c.type === 'STAR').length,
  };

  // Best performing cases (by revenue)
  const bestCases = [...approvedCases]
    .sort((a, b) => {
      const aRevenue = parseFloat(a.solutionValueRevenue?.toString() || '0');
      const bRevenue = parseFloat(b.solutionValueRevenue?.toString() || '0');
      return bRevenue - aRevenue;
    })
    .slice(0, 5);

  // Calculate total revenue impact
  const totalRevenue = approvedCases.reduce((sum, c) => {
    return sum + parseFloat(c.solutionValueRevenue?.toString() || '0');
  }, 0);

  const totalAnnualRevenue = approvedCases.reduce((sum, c) => {
    return sum + parseFloat(c.annualPotentialRevenue?.toString() || '0');
  }, 0);

  // Submissions over time (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentSubmissions = user.caseStudies.filter(
    (c) => c.createdAt >= sixMonthsAgo
  );

  // Group by month
  const monthlyData: Record<string, number> = {};
  recentSubmissions.forEach((c) => {
    const month = c.createdAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
    monthlyData[month] = (monthlyData[month] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Analytics</h1>
          <p className="text-gray-600 mt-2">
            Insights into your contributions and performance
          </p>
        </div>
        <AnalyticsExportButton
          userName={user.name || 'Unknown'}
          userEmail={user.email}
          totalPoints={user.totalPoints}
          totalCases={totalCases}
          approvedCases={approvedCases.length}
          rejectedCases={rejectedCases.length}
          pendingCases={pendingCases.length}
          draftCases={draftCases.length}
          approvalRate={approvalRate}
          applicationCases={byType.APPLICATION}
          techCases={byType.TECH}
          starCases={byType.STAR}
          totalRevenue={totalRevenue}
          totalAnnualRevenue={totalAnnualRevenue}
          badges={user.badges || []}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{totalCases}</p>
                <p className="text-xs text-gray-500 mt-1">submissions</p>
              </div>
              <FileText className="h-10 w-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-600">{user.totalPoints}</p>
                <p className="text-xs text-gray-500 mt-1">earned</p>
              </div>
              <Target className="h-10 w-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Approval Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-600">{approvalRate}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {approvedCases.length} of {totalCases}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Badges Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-orange-600">
                  {user.badges?.length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">achievements</p>
              </div>
              <Award className="h-10 w-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges Display */}
      {user.badges && user.badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Badges</CardTitle>
            <CardDescription>Achievements earned through contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <BadgeDisplay badges={user.badges} size="lg" />
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Case Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Case Type Breakdown</CardTitle>
            <CardDescription>Distribution across case types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">APPLICATION</Badge>
                    <span className="text-sm text-gray-600">{byType.APPLICATION} cases</span>
                  </div>
                  <span className="text-sm font-medium">
                    {totalCases > 0
                      ? Math.round((byType.APPLICATION / totalCases) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{
                      width: `${
                        totalCases > 0 ? (byType.APPLICATION / totalCases) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">TECH</Badge>
                    <span className="text-sm text-gray-600">{byType.TECH} cases</span>
                  </div>
                  <span className="text-sm font-medium">
                    {totalCases > 0 ? Math.round((byType.TECH / totalCases) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full"
                    style={{
                      width: `${totalCases > 0 ? (byType.TECH / totalCases) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge>STAR</Badge>
                    <span className="text-sm text-gray-600">{byType.STAR} cases</span>
                  </div>
                  <span className="text-sm font-medium">
                    {totalCases > 0 ? Math.round((byType.STAR / totalCases) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-600 rounded-full"
                    style={{
                      width: `${totalCases > 0 ? (byType.STAR / totalCases) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current state of your submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Approved</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {approvedCases.length}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-900">Pending</span>
                </div>
                <span className="text-2xl font-bold text-orange-600">
                  {pendingCases.length}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Drafts</span>
                </div>
                <span className="text-2xl font-bold text-gray-600">{draftCases.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-900">Rejected</span>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  {rejectedCases.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Impact */}
      {totalRevenue > 0 && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <DollarSign className="h-6 w-6" />
              Revenue Impact
            </CardTitle>
            <CardDescription>Total value from your approved case studies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-green-700 mb-2">
                  Total Solution Value
                </p>
                <p className="text-4xl font-bold text-green-600">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
              {totalAnnualRevenue > 0 && (
                <div>
                  <p className="text-sm font-medium text-green-700 mb-2">
                    Annual Potential Revenue
                  </p>
                  <p className="text-4xl font-bold text-green-600">
                    ${totalAnnualRevenue.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>Your latest case study contributions</CardDescription>
        </CardHeader>
        <CardContent>
          {user.caseStudies.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No case studies yet</p>
              <Link href="/dashboard/new">
                <Button>Create Your First Case Study</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {user.caseStudies.slice(0, 10).map((caseStudy) => (
                <Link key={caseStudy.id} href={`/dashboard/cases/${caseStudy.id}`}>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-gray-900">
                          {caseStudy.customerName}
                        </p>
                        <Badge
                          variant={
                            caseStudy.type === 'STAR'
                              ? 'default'
                              : caseStudy.type === 'TECH'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-xs"
                        >
                          {caseStudy.type}
                        </Badge>
                        <Badge
                          variant={
                            caseStudy.status === 'APPROVED'
                              ? 'default'
                              : caseStudy.status === 'REJECTED'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {caseStudy.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{caseStudy.industry}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {caseStudy.createdAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Best Performing Cases */}
      {bestCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Top Performing Cases
            </CardTitle>
            <CardDescription>Highest revenue-generating approved cases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bestCases.map((caseStudy, index) => (
                <Link key={caseStudy.id} href={`/dashboard/cases/${caseStudy.id}`}>
                  <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{caseStudy.customerName}</p>
                      <p className="text-sm text-gray-600">{caseStudy.industry}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        ${parseFloat(
                          caseStudy.solutionValueRevenue?.toString() || '0'
                        ).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">revenue</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

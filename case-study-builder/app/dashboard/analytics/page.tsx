import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';
import {
  getAdminAnalytics,
  getContributorAnalytics,
  getApproverAnalytics,
  getViewerAnalytics,
} from '@/lib/actions/analytics-actions';
import {
  TrendingUp,
  FileText,
  CheckCircle,
  Target,
  Award,
  Users,
  BarChart3,
} from 'lucide-react';

// Dynamic imports for heavy components (saves ~700KB from initial bundle)
// Note: ssr option removed as this is a Server Component
const AnalyticsExportButton = dynamic(
  () => import('@/components/analytics-export-button').then((mod) => ({ default: mod.AnalyticsExportButton })),
  {
    loading: () => (
      <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
        <span className="text-gray-400">Loading export...</span>
      </button>
    ),
  }
);

const AdminChartsView = dynamic(
  () => import('@/components/analytics-charts').then((mod) => ({ default: mod.AdminChartsView })),
  {
    loading: () => <ChartLoadingSkeleton />,
  }
);

const ContributorChartsView = dynamic(
  () => import('@/components/analytics-charts').then((mod) => ({ default: mod.ContributorChartsView })),
  {
    loading: () => <ChartLoadingSkeleton />,
  }
);

const ApproverChartsView = dynamic(
  () => import('@/components/analytics-charts').then((mod) => ({ default: mod.ApproverChartsView })),
  {
    loading: () => <ChartLoadingSkeleton />,
  }
);

const ViewerChartsView = dynamic(
  () => import('@/components/analytics-charts').then((mod) => ({ default: mod.ViewerChartsView })),
  {
    loading: () => <ChartLoadingSkeleton />,
  }
);

// Loading skeleton for charts
function ChartLoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Card role="article" key={i} className="dark:bg-card dark:border-border">
          <CardHeader>
            <div role="status" aria-label="Loading" className="animate-pulse" />
          </CardHeader>
          <CardContent>
            <div role="status" aria-label="Loading" className="animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export const metadata = {
  title: 'Analytics - Dashboard',
  description: 'Comprehensive analytics and insights',
};

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch user with role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      totalPoints: true,
      badges: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  // Fetch basic stats for export (all roles get this)
  const userCases = await prisma.caseStudy.findMany({
    where: { contributorId: user.id },
    select: {
      type: true,
      status: true,
      solutionValueRevenue: true,
      annualPotentialRevenue: true,
    },
  });

  const totalCases = userCases.length;
  const approvedCases = userCases.filter((c) => c.status === 'APPROVED').length;
  const rejectedCases = userCases.filter((c) => c.status === 'REJECTED').length;
  const pendingCases = userCases.filter((c) => c.status === 'SUBMITTED').length;
  const draftCases = userCases.filter((c) => c.status === 'DRAFT').length;
  const approvalRate = totalCases > 0 ? Math.round((approvedCases / totalCases) * 100) : 0;

  const byType = {
    APPLICATION: userCases.filter((c) => c.type === 'APPLICATION').length,
    TECH: userCases.filter((c) => c.type === 'TECH').length,
    STAR: userCases.filter((c) => c.type === 'STAR').length,
  };

  const totalRevenue = userCases
    .filter((c) => c.status === 'APPROVED')
    .reduce((sum, c) => sum + parseFloat(c.solutionValueRevenue?.toString() || '0'), 0);

  const totalAnnualRevenue = userCases
    .filter((c) => c.status === 'APPROVED')
    .reduce((sum, c) => sum + parseFloat(c.annualPotentialRevenue?.toString() || '0'), 0);

  // Fetch role-specific analytics data
  let analyticsData:
    | Awaited<ReturnType<typeof getAdminAnalytics>>
    | Awaited<ReturnType<typeof getContributorAnalytics>>
    | Awaited<ReturnType<typeof getApproverAnalytics>>
    | Awaited<ReturnType<typeof getViewerAnalytics>>
    | undefined;

  if (user.role === 'ADMIN') {
    analyticsData = await getAdminAnalytics();
  } else if (user.role === 'CONTRIBUTOR') {
    analyticsData = await getContributorAnalytics();
  } else if (user.role === 'APPROVER') {
    analyticsData = await getApproverAnalytics();
  } else if (user.role === 'VIEWER') {
    analyticsData = await getViewerAnalytics();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
            {user.role === 'ADMIN' && 'System Analytics'}
            {user.role === 'CONTRIBUTOR' && 'My Analytics'}
            {user.role === 'APPROVER' && 'Review Analytics'}
            {user.role === 'VIEWER' && 'Case Studies Overview'}
          </h1>
          <p className="text-gray-600 dark:text-muted-foreground mt-2">
            {user.role === 'ADMIN' && 'Comprehensive system insights and statistics'}
            {user.role === 'CONTRIBUTOR' && 'Insights into your contributions and performance'}
            {user.role === 'APPROVER' && 'Review performance and metrics'}
            {user.role === 'VIEWER' && 'Explore approved case studies data'}
          </p>
        </div>
        {user.role === 'CONTRIBUTOR' && (
          <AnalyticsExportButton
            userName={user.name || 'Unknown'}
            userEmail={user.email}
            totalPoints={user.totalPoints}
            totalCases={totalCases}
            approvedCases={approvedCases}
            rejectedCases={rejectedCases}
            pendingCases={pendingCases}
            draftCases={draftCases}
            approvalRate={approvalRate}
            applicationCases={byType.APPLICATION}
            techCases={byType.TECH}
            starCases={byType.STAR}
            totalRevenue={totalRevenue}
            totalAnnualRevenue={totalAnnualRevenue}
            badges={user.badges || []}
          />
        )}
      </div>

      {/* Summary Cards - Role Specific */}
      {user.role === 'ADMIN' &&
        analyticsData &&
        'summary' in analyticsData &&
        'totalCases' in analyticsData.summary && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card role="article" className="dark:bg-card dark:border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Total Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-foreground">
                      {analyticsData.summary.totalCases}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">in system</p>
                  </div>
                  <FileText className="h-10 w-10 text-wa-green-600 dark:text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card role="article" className="dark:bg-card dark:border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-foreground">
                      {analyticsData.summary.totalUsers}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">registered</p>
                  </div>
                  <Users className="h-10 w-10 text-purple-600 dark:text-purple-400 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card role="article" className="dark:bg-card dark:border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Approved Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-green-600 dark:text-primary">
                      {analyticsData.summary.approvedCases}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">published</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card role="article" className="dark:bg-card dark:border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Pending Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {analyticsData.summary.pendingCases}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">awaiting</p>
                  </div>
                  <BarChart3 className="h-10 w-10 text-orange-600 dark:text-orange-400 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {user.role === 'CONTRIBUTOR' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Total Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-foreground">{totalCases}</p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">submissions</p>
                </div>
                <FileText className="h-10 w-10 text-wa-green-600 dark:text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Total Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{user.totalPoints}</p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">earned</p>
                </div>
                <Target className="h-10 w-10 text-purple-600 dark:text-purple-400 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Approval Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600 dark:text-primary">{approvalRate}%</p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                    {approvedCases} of {totalCases}
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Badges Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {user.badges?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">achievements</p>
                </div>
                <Award className="h-10 w-10 text-orange-600 dark:text-orange-400 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {user.role === 'APPROVER' && analyticsData && 'pendingCases' in analyticsData && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                Total Reviewed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-foreground">
                    {analyticsData.approvalRate.total}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">cases</p>
                </div>
                <BarChart3 className="h-10 w-10 text-wa-green-600 dark:text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600 dark:text-primary">
                    {analyticsData.approvalRate.approved}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                    {analyticsData.approvalRate.percentage}% rate
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {analyticsData.approvalRate.rejected}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">cases</p>
                </div>
                <FileText className="h-10 w-10 text-red-600 dark:text-red-400 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {analyticsData.pendingCases}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">awaiting</p>
                </div>
                <TrendingUp className="h-10 w-10 text-orange-600 dark:text-orange-400 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {user.role === 'VIEWER' &&
        analyticsData &&
        'summary' in analyticsData &&
        'totalApprovedCases' in analyticsData.summary && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card role="article" className="dark:bg-card dark:border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                  Approved Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-foreground">
                      {analyticsData.summary.totalApprovedCases}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">available</p>
                  </div>
                  <FileText className="h-10 w-10 text-wa-green-600 dark:text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card role="article" className="dark:bg-card dark:border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Industries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {analyticsData.summary.totalIndustries}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">covered</p>
                  </div>
                  <BarChart3 className="h-10 w-10 text-purple-600 dark:text-purple-400 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card role="article" className="dark:bg-card dark:border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Regions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-green-600 dark:text-primary">
                      {analyticsData.summary.totalRegions}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">worldwide</p>
                  </div>
                  <Target className="h-10 w-10 text-green-600 dark:text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card role="article" className="dark:bg-card dark:border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">WA Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {analyticsData.summary.totalProducts}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">featured</p>
                  </div>
                  <Award className="h-10 w-10 text-orange-600 dark:text-orange-400 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Role-Specific Charts */}
      {user.role === 'ADMIN' && analyticsData && <AdminChartsView data={analyticsData} />}
      {user.role === 'CONTRIBUTOR' && analyticsData && (
        <ContributorChartsView data={analyticsData} />
      )}
      {user.role === 'APPROVER' && analyticsData && <ApproverChartsView data={analyticsData} />}
      {user.role === 'VIEWER' && analyticsData && <ViewerChartsView data={analyticsData} />}
    </div>
  );
}
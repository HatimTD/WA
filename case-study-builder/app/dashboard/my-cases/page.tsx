import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Clock, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { CompletionIndicator } from '@/components/completion-indicator';
import { calculateCompletionPercentage, getFieldBreakdown } from '@/lib/utils/case-quality';


export const metadata: Metadata = {
  title: 'My Case Studies',
  description: 'View and manage all your submitted case studies',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MyCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user?.id) {
    redirect('/login');
  }

  const caseStudies = await prisma.caseStudy.findMany({
    where: {
      contributorId: session.user.id,
    },
    include: {
      rejector: {
        select: {
          name: true,
          email: true,
        },
      },
      wps: true,
      costCalculator: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const stats = {
    total: caseStudies.length,
    draft: caseStudies.filter((c) => c.status === 'DRAFT').length,
    submitted: caseStudies.filter((c) => c.status === 'SUBMITTED').length,
    approved: caseStudies.filter((c) => c.status === 'APPROVED').length,
    rejected: caseStudies.filter((c) => c.status === 'REJECTED').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'SUBMITTED':
        return <Clock className="h-4 w-4 text-wa-green-500" />;
      case 'APPROVED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PUBLISHED':
        return <Eye className="h-4 w-4 text-purple-500" />;
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
        return 'bg-wa-green-50 text-wa-green-600';
      case 'TECH':
        return 'bg-purple-50 text-purple-600';
      case 'STAR':
        return 'bg-yellow-50 text-yellow-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  // Render a case study card with completion indicator
  const renderCaseCard = (caseStudy: typeof caseStudies[0]) => {
    const completionPercentage = calculateCompletionPercentage(
      caseStudy,
      caseStudy.wps,
      caseStudy.costCalculator
    );
    const breakdown = getFieldBreakdown(
      caseStudy,
      caseStudy.wps,
      caseStudy.costCalculator
    );

    return (
      <div
        key={caseStudy.id}
        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:border-border dark:hover:border-primary dark:hover:bg-card transition-colors"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge className={getTypeColor(caseStudy.type)}>
              {caseStudy.type}
            </Badge>
            <Badge variant="outline" className={`${getStatusColor(caseStudy.status)} dark:border-border`}>
              <span className="flex items-center gap-1">
                {getStatusIcon(caseStudy.status)}
                {caseStudy.status}
              </span>
            </Badge>
            <CompletionIndicator
              percentage={completionPercentage}
              variant="badge"
              showTooltip={true}
              missingFields={breakdown.missingFields}
            />
          </div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-foreground">
            {caseStudy.customerName} - {caseStudy.componentWorkpiece}
          </h3>
          <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
            {caseStudy.location} • {caseStudy.waProduct}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-xs text-gray-500 dark:text-muted-foreground">
              Created {new Date(caseStudy.createdAt).toLocaleDateString()} •
              Updated {new Date(caseStudy.updatedAt).toLocaleDateString()}
            </p>
            <CompletionIndicator
              percentage={completionPercentage}
              variant="compact"
              showTooltip={false}
              className="ml-auto"
            />
          </div>
          {caseStudy.status === 'REJECTED' && caseStudy.rejectionReason && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 dark:text-red-400">Rejection Feedback</p>
                  <p className="text-sm text-red-800 dark:text-red-300 mt-1">{caseStudy.rejectionReason}</p>
                  {caseStudy.rejectedAt && (
                    <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                      Rejected {new Date(caseStudy.rejectedAt).toLocaleDateString()}
                      {caseStudy.rejector && ` by ${caseStudy.rejector.name}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <Link href={`/dashboard/cases/${caseStudy.id}`}>
            <Button variant="outline" size="sm" className="dark:border-border">
              View
            </Button>
          </Link>
          {caseStudy.status === 'DRAFT' && (
            <Link href={`/dashboard/cases/${caseStudy.id}/edit`}>
              <Button size="sm">Edit</Button>
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">My Case Studies</h1>
          <p className="text-gray-600 dark:text-muted-foreground mt-2">Track your submissions and progress</p>
        </div>
        <Link href="/dashboard/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Case Study
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader className="pb-3">
            <CardDescription className="dark:text-muted-foreground">Total</CardDescription>
            <CardTitle className="text-3xl dark:text-foreground">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader className="pb-3">
            <CardDescription className="dark:text-muted-foreground">Draft</CardDescription>
            <CardTitle className="text-3xl text-gray-600 dark:text-gray-400">{stats.draft}</CardTitle>
          </CardHeader>
        </Card>
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader className="pb-3">
            <CardDescription className="dark:text-muted-foreground">Submitted</CardDescription>
            <CardTitle className="text-3xl text-wa-green-600 dark:text-primary">{stats.submitted}</CardTitle>
          </CardHeader>
        </Card>
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader className="pb-3">
            <CardDescription className="dark:text-muted-foreground">Approved</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader className="pb-3">
            <CardDescription className="dark:text-muted-foreground">Rejected</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.rejected}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter Tabs and Case Studies List */}
      <Tabs defaultValue={params.status || "all"} className="space-y-4">
        <Card role="article" className="dark:bg-card dark:border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="dark:text-foreground">Filter by Status</CardTitle>
                <CardDescription className="dark:text-muted-foreground">Quick access to your cases</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
              <TabsTrigger value="all" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">All</span>
                <Badge variant="outline" className="ml-1">{stats.total}</Badge>
              </TabsTrigger>
              <TabsTrigger value="DRAFT" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Drafts</span>
                <Badge variant="outline" className="ml-1">{stats.draft}</Badge>
              </TabsTrigger>
              <TabsTrigger value="SUBMITTED" className="gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Submitted</span>
                <Badge variant="outline" className="ml-1">{stats.submitted}</Badge>
              </TabsTrigger>
              <TabsTrigger value="APPROVED" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">Approved</span>
                <Badge variant="outline" className="ml-1">{stats.approved}</Badge>
              </TabsTrigger>
              <TabsTrigger value="REJECTED" className="gap-2">
                <XCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Rejected</span>
                <Badge variant="outline" className="ml-1">{stats.rejected}</Badge>
              </TabsTrigger>
              <TabsTrigger value="PUBLISHED" className="gap-2">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Published</span>
                <Badge variant="outline" className="ml-1">
                  {caseStudies.filter((c) => c.status === 'PUBLISHED').length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        {/* All Cases */}
        <TabsContent value="all">
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="dark:text-foreground">All Submissions</CardTitle>
              <CardDescription className="dark:text-muted-foreground">View and manage all your case studies</CardDescription>
            </CardHeader>
            <CardContent>
              {caseStudies.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">
                    No case studies yet
                  </h3>
                  <p className="text-gray-600 dark:text-muted-foreground mb-4">
                    Start documenting challenges and solutions to earn points!
                  </p>
                  <Link href="/dashboard/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Case Study
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {caseStudies.map(renderCaseCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Draft Cases */}
        <TabsContent value="DRAFT">
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-foreground">
                <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                Draft Cases
              </CardTitle>
              <CardDescription className="dark:text-muted-foreground">Cases you're still working on</CardDescription>
            </CardHeader>
            <CardContent>
              {caseStudies.filter((c) => c.status === 'DRAFT').length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">
                    No draft cases
                  </h3>
                  <p className="text-gray-600 dark:text-muted-foreground mb-4">
                    All your cases have been submitted or you haven't started any yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {caseStudies.filter((c) => c.status === 'DRAFT').map(renderCaseCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submitted Cases */}
        <TabsContent value="SUBMITTED">
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-foreground">
                <Clock className="h-5 w-5 text-wa-green-600 dark:text-primary" />
                Submitted Cases
              </CardTitle>
              <CardDescription className="dark:text-muted-foreground">Cases waiting for approval</CardDescription>
            </CardHeader>
            <CardContent>
              {caseStudies.filter((c) => c.status === 'SUBMITTED').length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">
                    No submitted cases
                  </h3>
                  <p className="text-gray-600 dark:text-muted-foreground mb-4">
                    You don't have any cases waiting for approval
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {caseStudies.filter((c) => c.status === 'SUBMITTED').map(renderCaseCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Cases */}
        <TabsContent value="APPROVED">
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Approved Cases
              </CardTitle>
              <CardDescription className="dark:text-muted-foreground">Cases that have been approved</CardDescription>
            </CardHeader>
            <CardContent>
              {caseStudies.filter((c) => c.status === 'APPROVED').length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">
                    No approved cases
                  </h3>
                  <p className="text-gray-600 dark:text-muted-foreground mb-4">
                    You don't have any approved cases yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {caseStudies.filter((c) => c.status === 'APPROVED').map(renderCaseCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejected Cases */}
        <TabsContent value="REJECTED">
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-foreground">
                <XCircle className="h-5 w-5 text-red-600" />
                Rejected Cases
              </CardTitle>
              <CardDescription className="dark:text-muted-foreground">Cases that need revision</CardDescription>
            </CardHeader>
            <CardContent>
              {caseStudies.filter((c) => c.status === 'REJECTED').length === 0 ? (
                <div className="text-center py-12">
                  <XCircle className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">
                    No rejected cases
                  </h3>
                  <p className="text-gray-600 dark:text-muted-foreground mb-4">
                    Great! You don't have any rejected cases
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {caseStudies.filter((c) => c.status === 'REJECTED').map(renderCaseCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Published Cases */}
        <TabsContent value="PUBLISHED">
          <Card role="article" className="dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-foreground">
                <Eye className="h-5 w-5 text-purple-600" />
                Published Cases
              </CardTitle>
              <CardDescription className="dark:text-muted-foreground">Cases available in the public library</CardDescription>
            </CardHeader>
            <CardContent>
              {caseStudies.filter((c) => c.status === 'PUBLISHED').length === 0 ? (
                <div className="text-center py-12">
                  <Eye className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">
                    No published cases
                  </h3>
                  <p className="text-gray-600 dark:text-muted-foreground mb-4">
                    You don't have any published cases yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {caseStudies.filter((c) => c.status === 'PUBLISHED').map(renderCaseCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

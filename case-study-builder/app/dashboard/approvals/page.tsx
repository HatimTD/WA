import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, Eye, FileText } from 'lucide-react';
import ApprovalActions from '@/components/approval-actions';

export default async function ApprovalsPage() {
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

  const pendingCases = await prisma.caseStudy.findMany({
    where: {
      status: 'SUBMITTED',
    },
    include: {
      contributor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
  });

  const recentlyReviewed = await prisma.caseStudy.findMany({
    where: {
      status: {
        in: ['APPROVED', 'REJECTED'],
      },
      approverId: session.user.id,
    },
    include: {
      contributor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      approvedAt: 'desc',
    },
    take: 5,
  });

  const stats = {
    pending: pendingCases.length,
    approvedByMe: await prisma.caseStudy.count({
      where: {
        status: 'APPROVED',
        approverId: session.user.id,
      },
    }),
    rejectedByMe: await prisma.caseStudy.count({
      where: {
        status: 'REJECTED',
        approverId: session.user.id,
      },
    }),
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'APPLICATION':
        return 'bg-blue-50 text-blue-600';
      case 'TECH':
        return 'bg-purple-50 text-purple-600';
      case 'STAR':
        return 'bg-yellow-50 text-yellow-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Approval Dashboard</h1>
        <p className="text-gray-600 mt-2">Review and approve submitted case studies</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Approved by You</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.approvedByMe}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Rejected by You</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.rejectedByMe}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Pending Cases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Pending Approvals ({stats.pending})
          </CardTitle>
          <CardDescription>Case studies waiting for your review</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingCases.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                All caught up!
              </h3>
              <p className="text-gray-600">
                There are no case studies pending approval at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingCases.map((caseStudy) => (
                <div
                  key={caseStudy.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getTypeColor(caseStudy.type)}>
                        {caseStudy.type}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {caseStudy.customerName} - {caseStudy.componentWorkpiece}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {caseStudy.location} • {caseStudy.waProduct}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted by {caseStudy.contributor.name} on{' '}
                      {new Date(caseStudy.submittedAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link href={`/dashboard/approvals/${caseStudy.id}`}>
                      <Button>
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Reviewed */}
      {recentlyReviewed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Reviewed by You</CardTitle>
            <CardDescription>Your recent approval decisions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentlyReviewed.map((caseStudy) => (
                <div
                  key={caseStudy.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getTypeColor(caseStudy.type)}>
                        {caseStudy.type}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(caseStudy.status)}>
                        {caseStudy.status === 'APPROVED' ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {caseStudy.status}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {caseStudy.customerName} - {caseStudy.componentWorkpiece}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {caseStudy.location} • {caseStudy.waProduct}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Reviewed on {new Date(caseStudy.approvedAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/dashboard/cases/${caseStudy.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

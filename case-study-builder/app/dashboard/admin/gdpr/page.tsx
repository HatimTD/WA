/**
 * Admin GDPR Requests Management Page
 *
 * Handles Right to be Forgotten requests and data subject access requests.
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Download,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import GdprRequestActions from '@/components/gdpr-request-actions';

export default async function GdprRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: Record<string, unknown> = {};
  if (params.status) {
    where.status = params.status;
  }

  // Fetch GDPR requests
  const [requests, totalCount, statusCounts] = await Promise.all([
    prisma.waGdprDeletionRequest.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.waGdprDeletionRequest.count({ where }),
    prisma.waGdprDeletionRequest.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Format status counts
  const statusStats = statusCounts.reduce(
    (acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
              GDPR Requests
            </h1>
            <p className="text-gray-600 dark:text-muted-foreground mt-1">
              Manage data subject access and deletion requests
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="dark:bg-card dark:border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-card dark:border-border border-yellow-200 dark:border-yellow-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statusStats['PENDING'] || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-card dark:border-border border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">
              Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statusStats['VERIFIED'] || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-card dark:border-border border-orange-200 dark:border-orange-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statusStats['IN_PROGRESS'] || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-card dark:border-border border-green-200 dark:border-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statusStats['COMPLETED'] || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="dark:bg-card dark:border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filter by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/admin/gdpr">
              <Button variant={!params.status ? 'default' : 'outline'} size="sm">
                All
              </Button>
            </Link>
            <Link href="/dashboard/admin/gdpr?status=PENDING">
              <Button
                variant={params.status === 'PENDING' ? 'default' : 'outline'}
                size="sm"
                className="text-yellow-600"
              >
                Pending ({statusStats['PENDING'] || 0})
              </Button>
            </Link>
            <Link href="/dashboard/admin/gdpr?status=VERIFIED">
              <Button
                variant={params.status === 'VERIFIED' ? 'default' : 'outline'}
                size="sm"
                className="text-blue-600"
              >
                Verified ({statusStats['VERIFIED'] || 0})
              </Button>
            </Link>
            <Link href="/dashboard/admin/gdpr?status=IN_PROGRESS">
              <Button
                variant={params.status === 'IN_PROGRESS' ? 'default' : 'outline'}
                size="sm"
                className="text-orange-600"
              >
                In Progress ({statusStats['IN_PROGRESS'] || 0})
              </Button>
            </Link>
            <Link href="/dashboard/admin/gdpr?status=COMPLETED">
              <Button
                variant={params.status === 'COMPLETED' ? 'default' : 'outline'}
                size="sm"
                className="text-green-600"
              >
                Completed ({statusStats['COMPLETED'] || 0})
              </Button>
            </Link>
            <Link href="/dashboard/admin/gdpr?status=REJECTED">
              <Button
                variant={params.status === 'REJECTED' ? 'default' : 'outline'}
                size="sm"
                className="text-red-600"
              >
                Rejected ({statusStats['REJECTED'] || 0})
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Deletion Requests
          </CardTitle>
          <CardDescription>
            {totalCount > 0
              ? `Showing ${skip + 1} - ${Math.min(skip + pageSize, totalCount)} of ${totalCount} requests`
              : 'No requests found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-muted-foreground">
                  No GDPR deletion requests
                </p>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="border dark:border-border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-background/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                        <span className="text-sm font-mono text-gray-500">
                          {request.id.slice(0, 8)}...
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {request.userEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Requested: {new Date(request.requestedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Status-specific info */}
                      {request.status === 'VERIFIED' && request.verifiedAt && (
                        <p className="text-sm text-blue-600">
                          Verified: {new Date(request.verifiedAt).toLocaleString()}
                        </p>
                      )}
                      {request.status === 'COMPLETED' && request.processedAt && (
                        <div className="text-sm text-green-600">
                          <p>Processed: {new Date(request.processedAt).toLocaleString()}</p>
                          {request.deletedData && (
                            <p className="text-xs mt-1">
                              Deleted: {JSON.stringify(request.deletedData)}
                            </p>
                          )}
                        </div>
                      )}
                      {request.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                          {request.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <GdprRequestActions
                        requestId={request.id}
                        status={request.status}
                        userEmail={request.userEmail}
                      />
                      {getStatusIcon(request.status)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {page > 1 && (
                <Link
                  href={`/dashboard/admin/gdpr?page=${page - 1}${params.status ? `&status=${params.status}` : ''}`}
                >
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                </Link>
              )}
              <span className="px-4 py-2 text-sm">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/dashboard/admin/gdpr?page=${page + 1}${params.status ? `&status=${params.status}` : ''}`}
                >
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GDPR Compliance Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Right to Erasure (Article 17)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-muted-foreground">
              Data subjects have the right to request deletion of their personal data.
              The system processes these requests by:
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Verifying identity via email confirmation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Deleting personal content (drafts, comments, notifications)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Anonymizing published case studies for business records</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Creating immutable audit record of deletion</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-500" />
              Data Portability (Article 20)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-muted-foreground">
              Data subjects can export their personal data in a portable format.
              The export includes:
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>User profile and preferences</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Case studies created by user</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Comments and interactions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Activity audit log (user&apos;s own actions)</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* SLA Information */}
      <Card className="dark:bg-card dark:border-border border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Clock className="h-5 w-5" />
            Response SLA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                30 Days
              </p>
              <p className="text-sm text-blue-600">Maximum response time (GDPR)</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-lg font-bold text-green-700 dark:text-green-400">
                7 Days
              </p>
              <p className="text-sm text-green-600">Target processing time</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                24 Hours
              </p>
              <p className="text-sm text-purple-600">Verification email sent</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    VERIFIED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    IN_PROGRESS: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

function getStatusIcon(status: string): React.ReactNode {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'REJECTED':
    case 'CANCELLED':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'VERIFIED':
    case 'IN_PROGRESS':
      return <Clock className="h-5 w-5 text-orange-500" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  }
}

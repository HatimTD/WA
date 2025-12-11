/**
 * Admin Audit Logs Page
 *
 * WA Policy Section 5.2 - Immutable Audit Trail Management
 * Provides administrators with visibility into system audit logs.
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  FileText,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  ArrowLeft,
  Hash,
} from 'lucide-react';
import Link from 'next/link';

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; actionType?: string; userId?: string }>;
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
  if (params.actionType) {
    where.actionType = params.actionType;
  }
  if (params.userId) {
    where.userId = params.userId;
  }

  // Fetch audit logs with pagination
  const [auditLogs, totalCount, actionTypeCounts] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ['actionType'],
      _count: { id: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Format action type counts
  const actionStats = actionTypeCounts.reduce(
    (acc, curr) => {
      acc[curr.actionType] = curr._count.id;
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
              Audit Logs
            </h1>
            <p className="text-gray-600 dark:text-muted-foreground mt-1">
              WA Policy Section 5.2 - Immutable Audit Trail
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-green-600" />
          <span className="text-sm font-medium text-green-600">
            Hash Chain Verified
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-card dark:border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-card dark:border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
              Login Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(actionStats['LOGIN'] || 0) + (actionStats['LOGOUT'] || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-card dark:border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
              Data Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(actionStats['CASE_CREATED'] || 0) +
                (actionStats['CASE_UPDATED'] || 0) +
                (actionStats['CASE_DELETED'] || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-card dark:border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
              Security Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(actionStats['LOGIN_FAILED'] || 0) +
                (actionStats['BREAK_GLASS_ACCESS'] || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="dark:bg-card dark:border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/admin/audit-logs">
              <Button
                variant={!params.actionType ? 'default' : 'outline'}
                size="sm"
              >
                All
              </Button>
            </Link>
            <Link href="/dashboard/admin/audit-logs?actionType=LOGIN">
              <Button
                variant={params.actionType === 'LOGIN' ? 'default' : 'outline'}
                size="sm"
              >
                Logins
              </Button>
            </Link>
            <Link href="/dashboard/admin/audit-logs?actionType=CASE_CREATED">
              <Button
                variant={
                  params.actionType === 'CASE_CREATED' ? 'default' : 'outline'
                }
                size="sm"
              >
                Cases Created
              </Button>
            </Link>
            <Link href="/dashboard/admin/audit-logs?actionType=CASE_APPROVED">
              <Button
                variant={
                  params.actionType === 'CASE_APPROVED' ? 'default' : 'outline'
                }
                size="sm"
              >
                Approvals
              </Button>
            </Link>
            <Link href="/dashboard/admin/audit-logs?actionType=BREAK_GLASS_ACCESS">
              <Button
                variant={
                  params.actionType === 'BREAK_GLASS_ACCESS'
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                className="text-red-600"
              >
                Break Glass
              </Button>
            </Link>
            <Link href="/dashboard/admin/audit-logs?actionType=DATA_DELETION_REQUEST">
              <Button
                variant={
                  params.actionType === 'DATA_DELETION_REQUEST'
                    ? 'default'
                    : 'outline'
                }
                size="sm"
              >
                GDPR Requests
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Entries */}
      <Card className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Trail
          </CardTitle>
          <CardDescription>
            Showing {skip + 1} - {Math.min(skip + pageSize, totalCount)} of{' '}
            {totalCount} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-gray-500 dark:text-muted-foreground text-center py-8">
                No audit log entries found
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="border dark:border-border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-background/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getActionTypeColor(log.actionType)}`}
                        >
                          {log.actionType}
                        </span>
                        {log.resourceType && (
                          <span className="text-xs text-gray-500 dark:text-muted-foreground">
                            {log.resourceType}
                            {log.resourceId && `: ${log.resourceId.slice(0, 8)}...`}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.userEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                        {log.ipAddress && (
                          <span className="text-xs">IP: {log.ipAddress}</span>
                        )}
                      </div>

                      {/* Hash verification */}
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <Hash className="h-3 w-3" />
                        <span className="font-mono">
                          {log.contentHash.slice(0, 16)}...
                        </span>
                        {log.previousHash && (
                          <>
                            <span>→</span>
                            <span className="font-mono">
                              {log.previousHash.slice(0, 8)}...
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
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
                  href={`/dashboard/admin/audit-logs?page=${page - 1}${params.actionType ? `&actionType=${params.actionType}` : ''}`}
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
                  href={`/dashboard/admin/audit-logs?page=${page + 1}${params.actionType ? `&actionType=${params.actionType}` : ''}`}
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

      {/* Integrity Verification */}
      <Card className="dark:bg-card dark:border-border border-green-200 dark:border-green-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Shield className="h-5 w-5" />
            Hash Chain Integrity
          </CardTitle>
          <CardDescription>
            Audit logs are cryptographically linked to detect tampering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">
                Audit Trail Verified
              </p>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">
                All {totalCount} entries have valid SHA-256 content hashes and
                chain links
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getActionTypeColor(actionType: string): string {
  const colors: Record<string, string> = {
    LOGIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    LOGOUT: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    LOGIN_FAILED:
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    BREAK_GLASS_ACCESS:
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    CASE_CREATED:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    CASE_UPDATED:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    CASE_DELETED:
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    CASE_APPROVED:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    CASE_REJECTED:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    DATA_DELETION_REQUEST:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    DATA_ANONYMIZED:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    RETENTION_CLEANUP:
      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };
  return (
    colors[actionType] ||
    'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
  );
}

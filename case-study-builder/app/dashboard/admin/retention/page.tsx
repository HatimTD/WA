/**
 * Admin Data Retention Management Page
 *
 * WA Policy Section 7.5.4 - Data Retention Policy Management
 * Provides administrators with tools to view and manage data retention policies.
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Database,
  Clock,
  Trash2,
  Archive,
  ArrowLeft,
  Calendar,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import RetentionCleanupButton from '@/components/retention-cleanup-button';

export default async function RetentionManagementPage() {
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

  // Fetch retention policies
  const retentionPolicies = await prisma.waDataRetentionPolicy.findMany({
    orderBy: { dataType: 'asc' },
  });

  // Calculate stats for each data type
  const stats = await Promise.all([
    // Notifications
    prisma.waNotification.count(),
    prisma.waNotification.count({
      where: {
        read: true,
        createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
    }),
    // Sessions
    prisma.session.count(),
    prisma.session.count({
      where: { expires: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    // Users (soft deleted)
    prisma.user.count({ where: { isActive: false } }),
    // Case Studies
    prisma.waCaseStudy.count(),
    prisma.waCaseStudy.count({
      where: {
        isActive: true,
        status: { in: ['APPROVED', 'PUBLISHED'] },
        createdAt: { lt: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000) },
      },
    }),
    // Audit Logs
    prisma.waAuditLog.count(),
    // GDPR Requests
    prisma.waGdprDeletionRequest.count({
      where: { status: { in: ['COMPLETED', 'CANCELLED', 'REJECTED'] } },
    }),
  ]);

  const dataStats = {
    notifications: { total: stats[0], expired: stats[1] },
    sessions: { total: stats[2], expired: stats[3] },
    deletedUsers: { total: stats[4] },
    caseStudies: { total: stats[5], archivable: stats[6] },
    auditLogs: { total: stats[7] },
    gdprRequests: { completed: stats[8] },
  };

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
              Data Retention
            </h1>
            <p className="text-gray-600 dark:text-muted-foreground mt-1">
              WA Policy Section 7.5.4 - Manage data lifecycle
            </p>
          </div>
        </div>
        <RetentionCleanupButton />
      </div>

      {/* Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="dark:bg-card dark:border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{dataStats.notifications.total}</div>
            <p className="text-xs text-orange-600">
              {dataStats.notifications.expired} expired
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-card dark:border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{dataStats.sessions.total}</div>
            <p className="text-xs text-orange-600">
              {dataStats.sessions.expired} expired
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-card dark:border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
              Deleted Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{dataStats.deletedUsers.total}</div>
            <p className="text-xs text-gray-500">awaiting cleanup</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-card dark:border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
              Case Studies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{dataStats.caseStudies.total}</div>
            <p className="text-xs text-blue-600">
              {dataStats.caseStudies.archivable} archivable
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-card dark:border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
              Audit Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{dataStats.auditLogs.total}</div>
            <p className="text-xs text-green-600">immutable</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-card dark:border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
              GDPR Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{dataStats.gdprRequests.completed}</div>
            <p className="text-xs text-gray-500">completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Retention Policies */}
      <Card className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Retention Policies
          </CardTitle>
          <CardDescription>
            Configured data retention periods per data type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {retentionPolicies.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-muted-foreground">
                  No retention policies configured
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Run initialization to set up default policies
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-border">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                        Data Type
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                        Retention Period
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                        Archive After
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                        Legal Basis
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {retentionPolicies.map((policy) => (
                      <tr
                        key={policy.id}
                        className="border-b dark:border-border hover:bg-gray-50 dark:hover:bg-background/50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getDataTypeIcon(policy.dataType)}
                            <span className="font-medium">{policy.dataType}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {formatRetentionDays(policy.retentionDays)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {policy.archiveAfterDays ? (
                            <div className="flex items-center gap-2">
                              <Archive className="h-4 w-4 text-blue-400" />
                              {formatRetentionDays(policy.archiveAfterDays)}
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-muted-foreground">
                          {policy.legalBasis || 'Not specified'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">Active</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Policy Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Data Policy */}
        <Card className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Database className="h-5 w-5" />
              User Data
            </CardTitle>
            <CardDescription>
              Account data retention policy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-muted-foreground">Retention:</span>
              <span className="font-medium">7 years after deletion</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-muted-foreground">Legal Basis:</span>
              <span className="font-medium">Tax/Accounting Records</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-muted-foreground">Action:</span>
              <span className="font-medium text-red-600">Hard Delete</span>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Policy */}
        <Card className="dark:bg-card dark:border-border border-green-200 dark:border-green-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Database className="h-5 w-5" />
              Audit Logs
            </CardTitle>
            <CardDescription>
              Immutable audit trail retention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-muted-foreground">Retention:</span>
              <span className="font-medium">7 years minimum</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-muted-foreground">Legal Basis:</span>
              <span className="font-medium">Audit Requirements</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-muted-foreground">Action:</span>
              <span className="font-medium text-green-600">No Deletion</span>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-400">
                Audit logs are immutable and cannot be deleted to ensure compliance
                with WA Policy Section 5.2.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card className="dark:bg-card dark:border-border border-green-200 dark:border-green-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">
                  GDPR Article 17
                </p>
                <p className="text-xs text-green-600">Right to erasure compliant</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">
                  WA Policy 7.5.4
                </p>
                <p className="text-xs text-green-600">Retention policies active</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">
                  Audit Trail
                </p>
                <p className="text-xs text-green-600">Immutable logging active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getDataTypeIcon(dataType: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    User: <Database className="h-4 w-4 text-blue-500" />,
    CaseStudy: <Database className="h-4 w-4 text-green-500" />,
    AuditLog: <Database className="h-4 w-4 text-purple-500" />,
    Notification: <Database className="h-4 w-4 text-yellow-500" />,
    Session: <Database className="h-4 w-4 text-gray-500" />,
    Comment: <Database className="h-4 w-4 text-cyan-500" />,
    GdprDeletionRequest: <Database className="h-4 w-4 text-red-500" />,
  };
  return icons[dataType] || <Database className="h-4 w-4 text-gray-400" />;
}

function formatRetentionDays(days: number): string {
  if (days >= 365) {
    const years = Math.round(days / 365);
    return `${years} year${years > 1 ? 's' : ''}`;
  }
  return `${days} days`;
}

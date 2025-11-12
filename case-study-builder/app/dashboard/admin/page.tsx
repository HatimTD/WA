import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  FileText,
  Clock,
  TrendingUp,
  UserPlus,
  CheckCircle,
  XCircle,
  Settings,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const session = await auth();

  // Check if user is authenticated and has ADMIN or APPROVER role
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'APPROVER')) {
    redirect('/dashboard');
  }

  // Fetch dashboard statistics
  const [
    totalUsers,
    totalCases,
    pendingCases,
    approvedCases,
    rejectedCases,
    recentUsers,
    recentCases,
    recentApprovals,
  ] = await Promise.all([
    // Total users count
    prisma.user.count(),

    // Total case studies count
    prisma.caseStudy.count(),

    // Pending cases count (status: SUBMITTED = awaiting approval)
    prisma.caseStudy.count({
      where: { status: 'SUBMITTED' },
    }),

    // Approved cases count
    prisma.caseStudy.count({
      where: { status: 'APPROVED' },
    }),

    // Rejected cases count
    prisma.caseStudy.count({
      where: { status: 'REJECTED' },
    }),

    // Recent user registrations (last 5)
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),

    // Recent case submissions (last 5)
    prisma.caseStudy.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        customerName: true,
        type: true,
        status: true,
        createdAt: true,
        contributor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),

    // Recent approvals/rejections (last 5)
    prisma.caseStudy.findMany({
      take: 5,
      where: {
        status: { in: ['APPROVED', 'REJECTED'] },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        customerName: true,
        status: true,
        updatedAt: true,
        contributor: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  // Calculate BHAG progress (target: 1000 unique approved cases)
  const bhagTarget = 1000;
  const bhagProgress = (approvedCases / bhagTarget) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            System overview and management
          </p>
        </div>
        {user.role === 'ADMIN' && (
          <div className="flex gap-3">
            <Link href="/dashboard/admin/users">
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                User Management
              </Button>
            </Link>
            <Link href="/dashboard/admin/settings">
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                System Settings
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">Registered accounts</p>
          </CardContent>
        </Card>

        {/* Total Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Cases
            </CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalCases}</div>
            <p className="text-xs text-gray-500 mt-1">All submissions</p>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{pendingCases}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        {/* BHAG Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              BHAG Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {bhagProgress.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {approvedCases} / {bhagTarget} approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Approval Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Approved Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{approvedCases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Pending Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{pendingCases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Rejected Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{rejectedCases}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent User Registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Recent User Registrations
            </CardTitle>
            <CardDescription>Latest user accounts created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-gray-500">No recent registrations</p>
              ) : (
                recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{u.name || 'No name'}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                        {u.role}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Case Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Recent Case Submissions
            </CardTitle>
            <CardDescription>Latest case studies submitted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCases.length === 0 ? (
                <p className="text-sm text-gray-500">No recent submissions</p>
              ) : (
                recentCases.map((c) => (
                  <div key={c.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex-1">
                      <Link
                        href={`/dashboard/cases/${c.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {c.customerName}
                      </Link>
                      <p className="text-sm text-gray-500">
                        by {c.contributor.name || c.contributor.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded-md font-medium ${
                        c.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        c.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {c.status}
                      </div>
                      <div className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-md font-medium mt-1">
                        {c.type}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Approvals/Rejections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Recent Review Activity
          </CardTitle>
          <CardDescription>Latest approval and rejection decisions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentApprovals.length === 0 ? (
              <p className="text-sm text-gray-500">No recent review activity</p>
            ) : (
              recentApprovals.map((c) => (
                <div key={c.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex items-center gap-3 flex-1">
                    {c.status === 'APPROVED' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <Link
                        href={`/dashboard/cases/${c.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {c.customerName}
                      </Link>
                      <p className="text-sm text-gray-500">
                        by {c.contributor.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded-md font-medium ${
                      c.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {c.status}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {user.role === 'ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/dashboard/admin/users">
                <Button variant="outline" className="w-full gap-2">
                  <Users className="h-4 w-4" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/dashboard/approvals">
                <Button variant="outline" className="w-full gap-2">
                  <Clock className="h-4 w-4" />
                  Review Pending Cases
                </Button>
              </Link>
              <Link href="/dashboard/admin/settings">
                <Button variant="outline" className="w-full gap-2">
                  <Settings className="h-4 w-4" />
                  System Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

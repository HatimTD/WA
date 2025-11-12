import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Clock, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function MyCasesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const caseStudies = await prisma.caseStudy.findMany({
    where: {
      contributorId: session.user.id,
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
        return <Clock className="h-4 w-4 text-blue-500" />;
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
        return 'bg-blue-100 text-blue-700';
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
        return 'bg-blue-50 text-blue-600';
      case 'TECH':
        return 'bg-purple-50 text-purple-600';
      case 'STAR':
        return 'bg-yellow-50 text-yellow-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Case Studies</h1>
          <p className="text-gray-600 mt-2">Track your submissions and progress</p>
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
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Draft</CardDescription>
            <CardTitle className="text-3xl text-gray-600">{stats.draft}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Submitted</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.submitted}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.rejected}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Case Studies List */}
      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>View and manage your case studies</CardDescription>
        </CardHeader>
        <CardContent>
          {caseStudies.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No case studies yet
              </h3>
              <p className="text-gray-600 mb-4">
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
              {caseStudies.map((caseStudy) => (
                <div
                  key={caseStudy.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getTypeColor(caseStudy.type)}>
                        {caseStudy.type}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(caseStudy.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(caseStudy.status)}
                          {caseStudy.status}
                        </span>
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {caseStudy.customerName} - {caseStudy.componentWorkpiece}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {caseStudy.location} • {caseStudy.waProduct}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Created {new Date(caseStudy.createdAt).toLocaleDateString()} •
                      Updated {new Date(caseStudy.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/cases/${caseStudy.id}`}>
                      <Button variant="outline" size="sm">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

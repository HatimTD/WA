import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

type Props = {
  limit?: number;
};

export default async function ActivityFeed({ limit = 10 }: Props) {
  const recentApprovals = await prisma.waCaseStudy.findMany({
    where: {
      status: 'APPROVED',
    },
    include: {
      contributor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      approver: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      approvedAt: 'desc',
    },
    take: limit,
  });

  console.log('[ActivityFeed] Found', recentApprovals.length, 'approved cases');
  recentApprovals.forEach(cs => {
    console.log('[ActivityFeed] Case:', cs.customerName, '-', cs.componentWorkpiece, 'approved at:', cs.approvedAt);
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'APPLICATION':
        return 'bg-wa-green-100 text-wa-green-700';
      case 'TECH':
        return 'bg-purple-100 text-purple-700';
      case 'STAR':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (recentApprovals.length === 0) {
    return (
      <Card className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <Clock className="h-5 w-5 dark:text-primary" />
            Recent Activity
          </CardTitle>
          <CardDescription className="dark:text-muted-foreground">Latest approved case studies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No approved case studies yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-card dark:border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-foreground">
          <Clock className="h-5 w-5 dark:text-primary" />
          Recent Activity
        </CardTitle>
        <CardDescription className="dark:text-muted-foreground">Latest approved case studies across the organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentApprovals.map((caseStudy) => (
            <Link key={caseStudy.id} href={`/dashboard/cases/${caseStudy.id}`} className="block">
              <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-wa-green-300 hover:bg-wa-green-50 dark:border-border dark:hover:border-primary dark:hover:bg-background transition-all cursor-pointer">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getTypeColor(caseStudy.type)}>{caseStudy.type}</Badge>
                    <span className="text-xs text-gray-500 dark:text-muted-foreground">
                      {getTimeAgo(caseStudy.approvedAt || caseStudy.createdAt)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm mb-1 truncate dark:text-foreground">
                    {caseStudy.customerName} - {caseStudy.componentWorkpiece}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground line-clamp-1 mb-2">
                    {caseStudy.problemDescription}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="font-medium dark:text-foreground">{caseStudy.contributor.name}</span>
                    </span>
                    <span>•</span>
                    <span>{caseStudy.location}</span>
                    <span>•</span>
                    <span>{caseStudy.industry}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  {caseStudy.approver && (
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">
                      Approved by
                      <br />
                      <span className="font-medium dark:text-foreground">{caseStudy.approver.name}</span>
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        {recentApprovals.length >= limit && (
          <div className="mt-4 text-center">
            <Link
              href="/dashboard/search?status=APPROVED"
              className="text-sm text-wa-green-600 hover:text-wa-green-700 dark:text-primary dark:hover:text-primary/80 font-medium transition-colors"
            >
              View all approved cases →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

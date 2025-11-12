import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Plus, Target, TrendingUp, Award, BookOpen, Bookmark } from 'lucide-react';
import BHAGProgress from '@/components/bhag-progress';
import ActivityFeed from '@/components/activity-feed';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch user data with role, points and submission count
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      totalPoints: true,
      badges: true,
      _count: {
        select: {
          caseStudies: true,
          savedCases: true,
        },
      },
    },
  });

  const userRole = user?.role || 'VIEWER';
  const totalPoints = user?.totalPoints || 0;
  const totalSubmissions = user?._count.caseStudies || 0;
  const totalSaved = user?._count.savedCases || 0;
  const badges = user?.badges || [];
  const isViewer = userRole === 'VIEWER';

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome back, {session?.user.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 mt-2">
          Track your contributions and explore case studies
        </p>
      </div>

      {/* BHAG Progress Counter */}
      <BHAGProgress />

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        {!isViewer && (
          <Link href="/dashboard/new">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  New Case Study
                </CardTitle>
                <CardDescription>
                  Capture a new industrial challenge solution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Create Case Study</Button>
              </CardContent>
            </Card>
          </Link>
        )}

        {isViewer && (
          <Link href="/dashboard/library">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Case Library
                </CardTitle>
                <CardDescription>
                  Browse approved industrial solutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Explore Library</Button>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href="/dashboard/leaderboard">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Leaderboard
              </CardTitle>
              <CardDescription>
                See top contributors across regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Rankings</Button>
            </CardContent>
          </Card>
        </Link>

        {!isViewer && (
          <Link href="/dashboard/my-cases">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  My Progress
                </CardTitle>
                <CardDescription>
                  View your submissions and badges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Points:</span>
                    <span className="font-bold text-blue-600">{totalPoints}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Submissions:</span>
                    <span className="font-bold text-green-600">{totalSubmissions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Badges:</span>
                    <span className="font-bold text-purple-600">{badges.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {isViewer && (
          <Link href="/dashboard/saved">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-green-600" />
                  Saved Cases
                </CardTitle>
                <CardDescription>
                  Access your saved case studies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Saved Cases:</span>
                    <span className="font-bold text-green-600">{totalSaved}</span>
                  </div>
                  <Button variant="outline" className="w-full mt-2">View Saved</Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Recent Activity */}
      <ActivityFeed limit={5} />

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            {isViewer ? 'Quick tips to explore case studies' : 'Quick tips to start contributing'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isViewer ? (
            <>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Browse the Case Library</h4>
                  <p className="text-sm text-muted-foreground">
                    Explore approved industrial solutions and best practices
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Save Cases for Quick Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Bookmark relevant case studies to your saved collection
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Compare Similar Solutions</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the compare feature to analyze different approaches
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Create Your First Case Study</h4>
                  <p className="text-sm text-muted-foreground">
                    Document a challenge you've solved - it takes less than 2 minutes!
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Earn Points & Badges</h4>
                  <p className="text-sm text-muted-foreground">
                    Application (1pt), Tech (2pts), Star (3pts) case studies unlock badges
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Climb the Leaderboard</h4>
                  <p className="text-sm text-muted-foreground">
                    Compete with colleagues globally and regionally
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

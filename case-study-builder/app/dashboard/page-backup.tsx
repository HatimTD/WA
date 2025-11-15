import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Plus, Target, TrendingUp, Award, BookOpen, Bookmark } from 'lucide-react';
import BHAGProgress from '@/components/bhag-progress';
import ActivityFeed from '@/components/activity-feed';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your personal dashboard for managing case studies, tracking progress, and viewing analytics',
  robots: {
    index: false,
    follow: false,
  },
};

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
        <h1 className="text-4xl font-bold text-gray-900 dark:text-foreground">
          Welcome back, {session?.user.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 dark:text-muted-foreground mt-2">
          Track your contributions and explore case studies
        </p>
      </div>

      {/* BHAG Progress Counter */}
      <BHAGProgress />

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        {!isViewer && (
          <Link href="/dashboard/new">
            <Card role="article" className="hover:shadow-lg hover:shadow-primary/20 dark:hover:border-primary transition-all cursor-pointer dark:bg-card dark:border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-foreground">
                  <Plus className="h-5 w-5 text-wa-green-600 dark:text-primary" />
                  New Case Study
                </CardTitle>
                <CardDescription className="dark:text-muted-foreground">
                  Capture a new industrial challenge solution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">Create Case Study</Button>
              </CardContent>
            </Card>
          </Link>
        )}

        {isViewer && (
          <Link href="/dashboard/library">
            <Card role="article" className="hover:shadow-lg hover:shadow-primary/20 dark:hover:border-primary transition-all cursor-pointer dark:bg-card dark:border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-foreground">
                  <BookOpen className="h-5 w-5 text-wa-green-600 dark:text-primary" />
                  Case Library
                </CardTitle>
                <CardDescription className="dark:text-muted-foreground">
                  Browse approved industrial solutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90">Explore Library</Button>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href="/dashboard/leaderboard">
          <Card role="article" className="hover:shadow-lg hover:shadow-primary/20 dark:hover:border-primary transition-all cursor-pointer dark:bg-card dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-foreground">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-primary" />
                Leaderboard
              </CardTitle>
              <CardDescription className="dark:text-muted-foreground">
                See top contributors across regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full dark:border-border dark:text-foreground dark:hover:bg-background">View Rankings</Button>
            </CardContent>
          </Card>
        </Link>

        {!isViewer && (
          <Link href="/dashboard/my-cases">
            <Card role="article" className="hover:shadow-lg hover:shadow-primary/20 dark:hover:border-primary transition-all cursor-pointer dark:bg-card dark:border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-foreground">
                  <Award className="h-5 w-5 text-green-600 dark:text-primary" />
                  My Progress
                </CardTitle>
                <CardDescription className="dark:text-muted-foreground">
                  View your submissions and badges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm dark:text-foreground">
                    <span>Points:</span>
                    <span className="font-bold text-wa-green-600 dark:text-primary">{totalPoints}</span>
                  </div>
                  <div className="flex justify-between text-sm dark:text-foreground">
                    <span>Submissions:</span>
                    <span className="font-bold text-green-600 dark:text-foreground">{totalSubmissions}</span>
                  </div>
                  <div className="flex justify-between text-sm dark:text-foreground">
                    <span>Badges:</span>
                    <span className="font-bold text-purple-600 dark:text-foreground">{badges.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {isViewer && (
          <Link href="/dashboard/saved">
            <Card role="article" className="hover:shadow-lg hover:shadow-primary/20 dark:hover:border-primary transition-all cursor-pointer dark:bg-card dark:border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-foreground">
                  <Bookmark className="h-5 w-5 text-green-600 dark:text-primary" />
                  Saved Cases
                </CardTitle>
                <CardDescription className="dark:text-muted-foreground">
                  Access your saved case studies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm dark:text-foreground">
                    <span>Saved Cases:</span>
                    <span className="font-bold text-green-600 dark:text-primary">{totalSaved}</span>
                  </div>
                  <Button variant="outline" className="w-full mt-2 dark:border-border dark:text-foreground dark:hover:bg-background">View Saved</Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Recent Activity */}
      <ActivityFeed limit={5} />

      {/* Getting Started */}
      <Card role="article" className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="dark:text-foreground">Getting Started</CardTitle>
          <CardDescription className="dark:text-muted-foreground">
            {isViewer ? 'Quick tips to explore case studies' : 'Quick tips to start contributing'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isViewer ? (
            <>
              <div className="flex items-start gap-3">
                <div className="bg-wa-green-100 text-wa-green-600 dark:bg-accent dark:text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-semibold dark:text-foreground">Browse the Case Library</h4>
                  <p className="text-sm text-muted-foreground">
                    Explore approved industrial solutions and best practices
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-wa-green-100 text-wa-green-600 dark:bg-accent dark:text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-semibold dark:text-foreground">Save Cases for Quick Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Bookmark relevant case studies to your saved collection
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-wa-green-100 text-wa-green-600 dark:bg-accent dark:text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-semibold dark:text-foreground">Compare Similar Solutions</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the compare feature to analyze different approaches
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <div className="bg-wa-green-100 text-wa-green-600 dark:bg-accent dark:text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-semibold dark:text-foreground">Create Your First Case Study</h4>
                  <p className="text-sm text-muted-foreground">
                    Document a challenge you've solved - it takes less than 2 minutes!
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-wa-green-100 text-wa-green-600 dark:bg-accent dark:text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-semibold dark:text-foreground">Earn Points & Badges</h4>
                  <p className="text-sm text-muted-foreground">
                    Application (1pt), Tech (2pts), Star (3pts) case studies unlock badges
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-wa-green-100 text-wa-green-600 dark:bg-accent dark:text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-semibold dark:text-foreground">Climb the Leaderboard</h4>
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

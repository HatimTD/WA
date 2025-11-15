import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Plus, Target, TrendingUp, Award, BookOpen, Bookmark } from 'lucide-react';

// Async component for user stats
export async function UserStats({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  return { userRole, totalPoints, totalSubmissions, totalSaved, badges, isViewer };
}

// Quick Actions component
export function QuickActions({
  isViewer,
  totalPoints,
  totalSubmissions,
  badges,
  totalSaved
}: {
  isViewer: boolean;
  totalPoints: number;
  totalSubmissions: number;
  badges: string[];
  totalSaved: number;
}) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {!isViewer && (
        <Link href="/dashboard/new">
          <Card className="hover:shadow-lg hover:shadow-primary/20 dark:hover:border-primary transition-all cursor-pointer dark:bg-card dark:border-border">
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
          <Card className="hover:shadow-lg hover:shadow-primary/20 dark:hover:border-primary transition-all cursor-pointer dark:bg-card dark:border-border">
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
        <Card className="hover:shadow-lg hover:shadow-primary/20 dark:hover:border-primary transition-all cursor-pointer dark:bg-card dark:border-border">
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
          <Card className="hover:shadow-lg hover:shadow-primary/20 dark:hover:border-primary transition-all cursor-pointer dark:bg-card dark:border-border">
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
          <Card className="hover:shadow-lg hover:shadow-primary/20 dark:hover:border-primary transition-all cursor-pointer dark:bg-card dark:border-border">
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
  );
}

// Getting Started Tips component
export function GettingStartedTips({ isViewer }: { isViewer: boolean }) {
  return (
    <Card className="dark:bg-card dark:border-border">
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
                <p className="font-medium dark:text-foreground">Browse the Library</p>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Explore approved case studies and learn from successful solutions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-wa-green-100 text-wa-green-600 dark:bg-accent dark:text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-medium dark:text-foreground">Save Relevant Cases</p>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Save case studies that are relevant to your work for quick access
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-wa-green-100 text-wa-green-600 dark:bg-accent dark:text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-medium dark:text-foreground">Use Search & Filters</p>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Find specific solutions using our advanced search and filtering options
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
                <p className="font-medium dark:text-foreground">Document Real Cases</p>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Share actual field experiences with quantifiable results
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-wa-green-100 text-wa-green-600 dark:bg-accent dark:text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-medium dark:text-foreground">Include Details</p>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Provide technical specifications, cost savings, and service life improvements
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-wa-green-100 text-wa-green-600 dark:bg-accent dark:text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-medium dark:text-foreground">Earn Rewards</p>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Get points for submissions and climb the leaderboard
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
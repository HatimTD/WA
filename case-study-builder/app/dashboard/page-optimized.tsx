import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import BHAGProgress from '@/components/bhag-progress';
import ActivityFeed from '@/components/activity-feed';
import { DashboardSkeleton } from '@/components/loading-states';
import { UserStats, QuickActions, GettingStartedTips } from './dashboard-components';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your personal dashboard for managing case studies, tracking progress, and viewing analytics',
  robots: {
    index: false,
    follow: false,
  },
};

// Async wrapper for user stats
async function UserStatsWrapper({ userId }: { userId: string }) {
  const stats = await UserStats({ userId });
  return <QuickActions {...stats} />;
}

// Async wrapper for activity feed with its own data fetching
async function ActivityFeedWrapper() {
  return <ActivityFeed limit={5} />;
}

// Loading component for stats
function StatsLoading() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// Loading component for activity feed
function ActivityLoading() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch minimal user data synchronously for immediate rendering
  const userPromise = UserStats({ userId: session.user.id });
  const { isViewer } = await userPromise;

  return (
    <div className="space-y-8">
      {/* Welcome Header - Renders immediately */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-foreground">
          Welcome back, {session?.user.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 dark:text-muted-foreground mt-2">
          Track your contributions and explore case studies
        </p>
      </div>

      {/* BHAG Progress - Can stream independently */}
      <Suspense fallback={<div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />}>
        <BHAGProgress />
      </Suspense>

      {/* Quick Actions - Stream user stats */}
      <Suspense fallback={<StatsLoading />}>
        <UserStatsWrapper userId={session.user.id} />
      </Suspense>

      {/* Recent Activity - Stream activity feed */}
      <Suspense fallback={<ActivityLoading />}>
        <ActivityFeedWrapper />
      </Suspense>

      {/* Getting Started Tips - Renders immediately with minimal data */}
      <GettingStartedTips isViewer={isViewer} />
    </div>
  );
}
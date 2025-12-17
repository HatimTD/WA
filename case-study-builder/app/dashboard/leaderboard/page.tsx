import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import LeaderboardClient from '@/components/leaderboard-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'View top contributors and their achievements - Global and Regional rankings',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LeaderboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <LeaderboardClient />
    </div>
  );
}

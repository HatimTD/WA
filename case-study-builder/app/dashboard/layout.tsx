import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard-nav';
import { prisma } from '@/lib/prisma';
import { SessionProvider } from 'next-auth/react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch full user data from database to get updated name, points, role, and badges
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      role: true,
      totalPoints: true,
      badges: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <SessionProvider>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <DashboardNav user={user} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}

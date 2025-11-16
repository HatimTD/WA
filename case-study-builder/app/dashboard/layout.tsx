import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import { prisma } from '@/lib/prisma';
import { SessionProvider } from 'next-auth/react';
import AnnouncementBanner from '@/components/announcement-banner';
import MaintenanceRedirect from '@/components/maintenance-redirect';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch full user data from database including image and region
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      region: true,
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
      {/* Maintenance Mode Auto-Redirect - Temporarily disabled */}
      {/* <MaintenanceRedirect /> */}

      <div className="flex min-h-screen flex-col">
        {/* Announcement Banner */}
        <AnnouncementBanner />

        {/* Dashboard Shell with Sidebar, Top Bar, and Content */}
        <DashboardShell user={user}>
          {children}
        </DashboardShell>
      </div>
    </SessionProvider>
  );
}

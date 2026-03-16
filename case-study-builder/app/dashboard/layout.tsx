import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import { prisma } from '@/lib/prisma';
import { SessionProvider } from 'next-auth/react';
import AnnouncementBanner from '@/components/announcement-banner';
import MaintenanceRedirect from '@/components/maintenance-redirect';
import ConfidentialityAgreementDialog from '@/components/confidentiality-agreement-dialog';

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
      acceptedTermsAt: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  // Fetch user's assigned roles from WaUserRole table for multi-role support
  const userRoleRecords = await prisma.waUserRole.findMany({
    where: { userId: session.user.id },
    select: { role: true },
  });

  // Get list of assigned role strings (always include current primary role)
  const userRoles = userRoleRecords.map(ur => ur.role);
  if (!userRoles.includes(user.role)) {
    userRoles.push(user.role);
  }

  // Merge roles into user object for DashboardShell
  const userWithRoles = {
    ...user,
    roles: userRoles,
  };

  // Block ALL dashboard content until user accepts confidentiality terms
  if (!user.acceptedTermsAt) {
    return (
      <SessionProvider>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <ConfidentialityAgreementDialog />
        </div>
      </SessionProvider>
    );
  }

  return (
    <SessionProvider>
      {/* Maintenance Mode Auto-Redirect - Temporarily disabled */}
      {/* <MaintenanceRedirect /> */}

      <div className="flex min-h-screen flex-col">
        {/* Announcement Banner */}
        <AnnouncementBanner />

        {/* Dashboard Shell with Sidebar, Top Bar, and Content */}
        <DashboardShell user={userWithRoles}>
          {children}
        </DashboardShell>
      </div>
    </SessionProvider>
  );
}

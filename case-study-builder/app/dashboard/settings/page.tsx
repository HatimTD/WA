import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SettingsForm from '@/components/settings-form';
import type { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your account settings and preferences',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch user data with assigned roles
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      region: true,
      totalPoints: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  // Fetch user's assigned roles from WaUserRole table
  const userRoles = await prisma.waUserRole.findMany({
    where: { userId: session.user.id },
    select: { role: true },
  });

  // Get list of assigned role strings (always include current role)
  const assignedRoles = userRoles.map(ur => ur.role);
  if (!assignedRoles.includes(user.role)) {
    assignedRoles.push(user.role);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Settings</h1>
        <p className="text-gray-600 dark:text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <SettingsForm user={user} assignedRoles={assignedRoles} />
    </div>
  );
}

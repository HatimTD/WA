import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SystemSettingsForm from '@/components/system-settings-form';
import { OfflineSettings } from '@/components/offline-settings';

export const metadata = {
  title: 'System Settings - Case Study Builder',
  description: 'Configure system-wide settings and features',
};

export default async function SystemSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Check if user is an admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-foreground">System Settings</h1>
        <p className="text-muted-foreground dark:text-muted-foreground mt-2">
          Manage maintenance mode, email templates, notifications, announcements, and offline mode
        </p>
      </div>

      <SystemSettingsForm />

      <div className="pt-8 border-t dark:border-border">
        <div className="mb-6">
          <h2 className="text-2xl font-bold dark:text-foreground">Offline Mode & PWA Settings</h2>
          <p className="text-muted-foreground dark:text-muted-foreground mt-2">
            Configure offline functionality, cache durations, and synchronization settings
          </p>
        </div>
        <OfflineSettings />
      </div>
    </div>
  );
}

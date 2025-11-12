import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SystemConfigForm } from '@/components/system-config-form';
import { getSystemConfig } from '@/lib/actions/system-config-actions';

export const metadata = {
  title: 'System Configuration - Admin',
  description: 'Configure system settings',
};

export default async function SystemConfigPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Check if user is ADMIN
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch current configuration
  const result = await getSystemConfig();

  if (!result.success || !result.config) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
          <p className="text-gray-600 mt-2">
            Configure application-wide settings
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">Failed to load system configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
        <p className="text-gray-600 mt-2">
          Configure application-wide settings
        </p>
      </div>

      {/* Configuration Form */}
      <SystemConfigForm initialConfig={result.config} />
    </div>
  );
}

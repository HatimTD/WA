import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import NetSuiteTestPanel from '@/components/admin/netsuite-test-panel';

export default async function NetSuiteTestPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // Only Admins can access this page
  if (user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">NetSuite Integration Test</h1>
          <p className="text-gray-600 dark:text-muted-foreground mt-2">
            Test NetSuite RESTlet connection and OAuth 1.0 authentication
          </p>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
      </div>

      {/* Test Panel */}
      <NetSuiteTestPanel />
    </div>
  );
}

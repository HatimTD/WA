import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import MasterListManager from '@/components/admin/master-list-manager';

export default async function MasterListPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const listKeys = await prisma.waListKey.findMany({
    include: {
      masterListItems: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
      },
      _count: {
        select: { masterListItems: true },
      },
    },
    orderBy: { keyName: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
            Master List Management
          </h1>
          <p className="text-gray-600 dark:text-muted-foreground mt-2">
            Manage dropdown options for Industries, Wear Types, Units, and more
          </p>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Back to Admin
          </Button>
        </Link>
      </div>

      <MasterListManager initialListKeys={listKeys} />
    </div>
  );
}

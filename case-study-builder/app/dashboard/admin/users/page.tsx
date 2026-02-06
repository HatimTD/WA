import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import UserManagementTable from '@/components/user-management-table';

export default async function UserManagementPage() {
  const session = await auth();

  // Only ADMIN users can access this page
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch all users with their statistics, multiple roles, and subsidiaries
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      region: true,
      totalPoints: true,
      createdAt: true,
      userRoles: {
        select: {
          role: true,
        },
      },
      userSubsidiaries: {
        select: {
          source: true,
          assignedAt: true,
          subsidiary: {
            select: {
              id: true,
              name: true,
              region: true,
            },
          },
        },
        orderBy: {
          source: 'asc', // MANUAL first, then NETSUITE
        },
      },
      _count: {
        select: {
          caseStudies: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Transform data for client component
  const usersData = users.map((u) => {
    // Map subsidiaries
    const subsidiaries = u.userSubsidiaries.map((us) => ({
      id: us.subsidiary.id,
      name: us.subsidiary.name,
      region: us.subsidiary.region,
      source: us.source,
    }));

    // Compute unique regions from subsidiaries
    const regions = [...new Set(subsidiaries.map((s) => s.region))];

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      roles: u.userRoles.length > 0 ? u.userRoles.map((ur) => ur.role) : [u.role], // Use userRoles if available
      region: u.region,
      subsidiaries, // Add subsidiaries
      regions, // Add computed regions
      totalPoints: u.totalPoints,
      caseCount: u._count.caseStudies,
      createdAt: u.createdAt.toISOString(),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">User Management</h1>
        <p className="text-gray-600 dark:text-muted-foreground mt-2">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      <UserManagementTable users={usersData} />
    </div>
  );
}

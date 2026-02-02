import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get current user's subsidiary integration IDs for client-side filtering
 * GET /api/user/subsidiaries
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user with roles and subsidiaries
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        userRoles: {
          select: { role: true },
        },
        userSubsidiaries: {
          select: {
            subsidiary: {
              select: {
                integrationId: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Get all user roles (primary + assigned)
    const allRoles = user.userRoles.length > 0
      ? user.userRoles.map((ur) => ur.role)
      : [user.role];

    // Check if user has ADMIN or APPROVER role (bypass filtering)
    const hasAdminOrApprover = allRoles.some(
      (role) => role === 'ADMIN' || role === 'APPROVER'
    );

    // Get subsidiary integration IDs
    const subsidiaryIds = user.userSubsidiaries.map(
      (us) => us.subsidiary.integrationId
    );

    return NextResponse.json({
      success: true,
      data: {
        shouldFilter: !hasAdminOrApprover, // Only filter for CONTRIBUTOR
        subsidiaryIds,
        roles: allRoles
      }
    });
  } catch (error) {
    console.error('[User Subsidiaries API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch subsidiaries',
    }, { status: 500 });
  }
}

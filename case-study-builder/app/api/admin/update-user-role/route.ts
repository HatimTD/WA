import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

const VALID_ROLES: Role[] = ['VIEWER', 'CONTRIBUTOR', 'APPROVER', 'ADMIN', 'IT_DEPARTMENT', 'MARKETING'];

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is ADMIN
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - ADMIN role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role, roles } = body;

    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Handle multiple roles (new format)
    if (roles && Array.isArray(roles)) {
      // If admin is modifying their own roles, ensure ADMIN is still included
      if (userId === session.user.id && !roles.includes('ADMIN')) {
        return NextResponse.json(
          { success: false, error: 'You cannot remove ADMIN role from yourself' },
          { status: 400 }
        );
      }
      // Validate all roles
      const invalidRoles = roles.filter((r: string) => !VALID_ROLES.includes(r as Role));
      if (invalidRoles.length > 0) {
        return NextResponse.json(
          { success: false, error: `Invalid roles: ${invalidRoles.join(', ')}` },
          { status: 400 }
        );
      }

      // Must have at least one role
      if (roles.length === 0) {
        return NextResponse.json(
          { success: false, error: 'User must have at least one role' },
          { status: 400 }
        );
      }

      // Update in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete all existing roles for this user
        await tx.waUserRole.deleteMany({
          where: { userId },
        });

        // Add new roles
        await tx.waUserRole.createMany({
          data: roles.map((r: string) => ({
            userId,
            role: r as Role,
            assignedBy: session.user!.id,
          })),
        });

        // Update primary role (first in list, or highest privilege)
        const primaryRole = waGetPrimaryRole(roles as Role[]);
        await tx.user.update({
          where: { id: userId },
          data: { role: primaryRole },
        });
      });

      return NextResponse.json({
        success: true,
        message: `User roles updated to: ${roles.join(', ')}`,
        roles,
      });
    }

    // Handle single role (legacy format for backwards compatibility)
    if (!role || !VALID_ROLES.includes(role as Role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    // Prevent admin from removing ADMIN role from themselves
    if (userId === session.user.id && role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'You cannot remove ADMIN role from yourself. Use the multi-role selector to add additional roles.' },
        { status: 400 }
      );
    }

    // Update user role and also sync to WaUserRole table
    await prisma.$transaction(async (tx) => {
      // Update primary role
      await tx.user.update({
        where: { id: userId },
        data: { role: role as Role },
      });

      // Sync to WaUserRole table
      await tx.waUserRole.deleteMany({
        where: { userId },
      });
      await tx.waUserRole.create({
        data: {
          userId,
          role: role as Role,
          assignedBy: session.user!.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    console.error('[API] Update user role error:', error);

    // Handle user not found
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get the primary role from a list of roles (highest privilege)
 */
function waGetPrimaryRole(roles: Role[]): Role {
  const rolePriority: Record<Role, number> = {
    ADMIN: 100,
    IT_DEPARTMENT: 80,
    APPROVER: 60,
    MARKETING: 50,
    CONTRIBUTOR: 40,
    VIEWER: 20,
  };

  return roles.reduce((highest, role) => {
    return (rolePriority[role] || 0) > (rolePriority[highest] || 0) ? role : highest;
  }, roles[0]);
}

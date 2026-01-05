import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

const VALID_ROLES: Role[] = ['VIEWER', 'CONTRIBUTOR', 'APPROVER', 'ADMIN', 'IT_DEPARTMENT', 'MARKETING'];

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

/**
 * Dev endpoint to switch user roles for testing
 * Supports both single role (legacy) and multiple roles (new format)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { role, roles } = body;

    // Handle multiple roles (new format)
    if (roles && Array.isArray(roles)) {
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
          where: { userId: session.user!.id },
        });

        // Add new roles
        await tx.waUserRole.createMany({
          data: roles.map((r: string) => ({
            userId: session.user!.id,
            role: r as Role,
            assignedBy: session.user!.id,
          })),
        });

        // Update primary role (highest privilege)
        const primaryRole = waGetPrimaryRole(roles as Role[]);
        await tx.user.update({
          where: { id: session.user!.id },
          data: { role: primaryRole },
        });
      });

      console.log(`[DEV] User ${session.user.email} switched roles to: ${roles.join(', ')}`);

      return NextResponse.json({
        success: true,
        message: `Roles updated to: ${roles.join(', ')}`,
        roles,
        primaryRole: waGetPrimaryRole(roles as Role[]),
      });
    }

    // Handle single role (legacy format for backwards compatibility)
    if (!role || !VALID_ROLES.includes(role as Role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    // Update user role and sync to WaUserRole table
    await prisma.$transaction(async (tx) => {
      // Update primary role
      await tx.user.update({
        where: { id: session.user!.id },
        data: { role: role as Role },
      });

      // Sync to WaUserRole table
      await tx.waUserRole.deleteMany({
        where: { userId: session.user!.id },
      });
      await tx.waUserRole.create({
        data: {
          userId: session.user!.id,
          role: role as Role,
          assignedBy: session.user!.id,
        },
      });
    });

    console.log(`[DEV] User ${session.user.email} switched role to ${role}`);

    return NextResponse.json({
      success: true,
      message: `Role switched to ${role}`,
      role,
    });
  } catch (error) {
    console.error('[API] Dev role switch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

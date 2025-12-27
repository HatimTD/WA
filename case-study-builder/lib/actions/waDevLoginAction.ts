'use server';

import { signIn } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AuthError } from 'next-auth';
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
 * Update user roles in both User table (primary role) and WaUserRole table (all roles)
 */
async function waUpdateUserRoles(email: string, roles: string[]) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return;

  const validRoles = roles.filter(r => VALID_ROLES.includes(r as Role)) as Role[];
  if (validRoles.length === 0) return;

  const primaryRole = waGetPrimaryRole(validRoles);

  await prisma.$transaction(async (tx) => {
    // Update primary role in User table
    await tx.user.update({
      where: { email },
      data: { role: primaryRole },
    });

    // Clear and set roles in WaUserRole table
    await tx.waUserRole.deleteMany({
      where: { userId: user.id },
    });

    await tx.waUserRole.createMany({
      data: validRoles.map((role) => ({
        userId: user.id,
        role,
        assignedBy: user.id,
      })),
    });
  });
}

export async function waDevLogin(email: string, password: string, roles?: string | string[]) {
  // Normalize roles to array
  const rolesArray = Array.isArray(roles) ? roles : (roles ? [roles] : []);

  // Now available in production for testing
  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
      redirectTo: '/dashboard',
    });

    // If roles are provided, update the user's roles
    if (rolesArray.length > 0) {
      await waUpdateUserRoles(email, rolesArray);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Dev login error:', error);

    // NextAuth v5 throws NEXT_REDIRECT on successful login even with redirect: false
    // We need to re-throw it so Next.js can handle the redirect
    if (error.digest?.includes('NEXT_REDIRECT')) {
      // Update roles before redirect if needed
      if (rolesArray.length > 0) {
        try {
          await waUpdateUserRoles(email, rolesArray);
        } catch (e) {
          // Ignore role update errors, user can still login
        }
      }
      throw error;
    }

    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Invalid credentials' };
        default:
          return { success: false, error: 'Authentication error' };
      }
    }

    return { success: false, error: 'Login failed' };
  }
}

'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import type { Role } from '@prisma/client';

// All valid roles from Prisma schema
export type ValidRole = Role;

export async function waChangeUserRole(email: string, newRole: ValidRole) {
  const session = await auth();

  try {
    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true }
    });

    const user = await prisma.user.update({
      where: { email },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        totalPoints: true,
      },
    });

    revalidatePath('/dashboard');

    if (session?.user?.id) {
      logger.audit('USER_ROLE_CHANGED', session.user.id, user.id, {
        email: user.email,
        oldRole: targetUser?.role,
        newRole: newRole
      });
    }

    return { success: true, user };
  } catch (error: any) {
    if (session?.user?.id) {
      logger.error('User role change failed', {
        adminId: session.user.id,
        targetEmail: email,
        error: error.message
      });
    }
    console.error('Error changing user role:', error);
    return { success: false, error: 'Failed to change user role' };
  }
}

export async function waGetAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        totalPoints: true,
        badges: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, users };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Failed to fetch users', users: [] };
  }
}

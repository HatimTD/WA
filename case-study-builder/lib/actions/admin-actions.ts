'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function changeUserRole(email: string, newRole: 'CONTRIBUTOR' | 'APPROVER' | 'VIEWER') {
  try {
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

    return { success: true, user };
  } catch (error) {
    console.error('Error changing user role:', error);
    return { success: false, error: 'Failed to change user role' };
  }
}

export async function getAllUsers() {
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

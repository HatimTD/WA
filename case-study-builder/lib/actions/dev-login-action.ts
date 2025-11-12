'use server';

import { signIn } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function devLogin(email: string, password: string, role?: string) {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return { success: false, error: 'Dev login not available in production' };
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    // If role is provided, update the user's role
    if (role && ['VIEWER', 'CONTRIBUTOR', 'APPROVER', 'ADMIN'].includes(role)) {
      await prisma.user.update({
        where: { email },
        data: { role: role as any },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Dev login error:', error);

    if (error.type === 'CredentialsSignin') {
      return { success: false, error: 'Invalid credentials' };
    }

    return { success: false, error: 'Login failed' };
  }
}

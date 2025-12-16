'use server';

import { signIn } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AuthError } from 'next-auth';

export async function waDevLogin(email: string, password: string, role?: string) {
  // Now available in production for testing
  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
      redirectTo: '/dashboard',
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

    // NextAuth v5 throws NEXT_REDIRECT on successful login even with redirect: false
    // We need to re-throw it so Next.js can handle the redirect
    if (error.digest?.includes('NEXT_REDIRECT')) {
      // Update role before redirect if needed
      if (role && ['VIEWER', 'CONTRIBUTOR', 'APPROVER', 'ADMIN'].includes(role)) {
        try {
          await prisma.user.update({
            where: { email },
            data: { role: role as any },
          });
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

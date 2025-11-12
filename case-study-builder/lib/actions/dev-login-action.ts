'use server';

import { signIn } from '@/auth';

export async function devLogin(email: string, password: string) {
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

    return { success: true };
  } catch (error: any) {
    console.error('Dev login error:', error);

    if (error.type === 'CredentialsSignin') {
      return { success: false, error: 'Invalid credentials' };
    }

    return { success: false, error: 'Login failed' };
  }
}

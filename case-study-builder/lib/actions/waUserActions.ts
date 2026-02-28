'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function waAcceptTerms() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { acceptedTermsAt: new Date() },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to accept terms:', error);
    return { success: false, error: 'Failed to save acceptance' };
  }
}

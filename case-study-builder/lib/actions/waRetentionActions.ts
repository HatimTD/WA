'use server';

/**
 * Data Retention Server Actions
 *
 * Server actions for data retention management.
 * Admin-only functionality per WA Policy Section 7.5.4.
 *
 * @module waRetentionActions
 */

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  runRetentionCleanup,
  initializeRetentionPolicies,
} from '@/lib/data-retention';

/**
 * Checks if the current user is an admin
 */
async function waIsAdmin(): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { isAdmin: false, error: 'Not authenticated' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return { isAdmin: false, error: 'Admin access required' };
  }

  return { isAdmin: true, userId: session.user.id };
}

/**
 * Run the data retention cleanup process
 */
export async function waRunRetentionCleanup(): Promise<{
  success: boolean;
  error?: string;
  result?: {
    totalDeleted: number;
    totalArchived: number;
    notifications: { deleted: number };
    sessions: { deleted: number };
    comments: { deleted: number };
    caseStudies: { archived: number };
  };
}> {
  const { isAdmin, userId, error } = await waIsAdmin();

  if (!isAdmin || !userId) {
    return { success: false, error: error || 'Unauthorized' };
  }

  try {
    const rawResult = await runRetentionCleanup(userId);

    // Transform the result to match expected structure
    const result = {
      totalDeleted: rawResult.totalDeleted,
      totalArchived: rawResult.totalArchived,
      notifications: { deleted: rawResult.results.find((r) => r.dataType === 'Notification')?.deletedCount || 0 },
      sessions: { deleted: rawResult.results.find((r) => r.dataType === 'Session')?.deletedCount || 0 },
      comments: { deleted: rawResult.results.find((r) => r.dataType === 'Comment')?.deletedCount || 0 },
      caseStudies: { archived: rawResult.results.find((r) => r.dataType === 'CaseStudy')?.archivedCount || 0 },
    };

    revalidatePath('/dashboard/admin/retention');
    return { success: true, result };
  } catch (err) {
    console.error('[Retention Action] Cleanup error:', err);
    return { success: false, error: 'Failed to run retention cleanup' };
  }
}

/**
 * Initialize default retention policies
 */
export async function waInitializeRetentionPolicies(): Promise<{
  success: boolean;
  error?: string;
  count?: number;
}> {
  const { isAdmin, error } = await waIsAdmin();

  if (!isAdmin) {
    return { success: false, error: error || 'Unauthorized' };
  }

  try {
    const count = await initializeRetentionPolicies();

    revalidatePath('/dashboard/admin/retention');
    return { success: true, count };
  } catch (err) {
    console.error('[Retention Action] Initialize error:', err);
    return { success: false, error: 'Failed to initialize policies' };
  }
}

'use server';

/**
 * GDPR Admin Server Actions
 *
 * Server actions for managing GDPR deletion requests.
 * Admin-only functionality per WA Policy Section 7.5.
 *
 * @module waGdprAdminActions
 */

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { processDeletionRequest, cancelDeletionRequest } from '@/lib/gdpr-compliance';
import { createImmutableAuditLog } from '@/lib/immutable-audit-logger';

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
    select: { role: true, email: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return { isAdmin: false, error: 'Admin access required' };
  }

  return { isAdmin: true, userId: session.user.id };
}

/**
 * Process a verified GDPR deletion request
 */
export async function waProcessGdprRequest(requestId: string): Promise<{
  success: boolean;
  error?: string;
  deletedData?: Record<string, number>;
}> {
  const { isAdmin, userId, error } = await waIsAdmin();

  if (!isAdmin || !userId) {
    return { success: false, error: error || 'Unauthorized' };
  }

  try {
    const result = await processDeletionRequest(requestId, userId);

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to process request' };
    }

    revalidatePath('/dashboard/admin/gdpr');
    return {
      success: true,
      deletedData: result.deletedData as Record<string, number>,
    };
  } catch (err) {
    console.error('[GDPR Admin] Process error:', err);
    return { success: false, error: 'Failed to process deletion request' };
  }
}

/**
 * Reject a GDPR deletion request
 */
export async function waRejectGdprRequest(
  requestId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { isAdmin, userId, error } = await waIsAdmin();

  if (!isAdmin || !userId) {
    return { success: false, error: error || 'Unauthorized' };
  }

  try {
    const request = await prisma.waGdprDeletionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    if (request.status === 'COMPLETED' || request.status === 'CANCELLED') {
      return { success: false, error: 'Request already processed' };
    }

    await prisma.waGdprDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        processedAt: new Date(),
        processedBy: userId,
        notes: reason,
      },
    });

    // Log the rejection using DATA_DELETION_REQUEST action type
    await createImmutableAuditLog({
      actionType: 'DATA_DELETION_REQUEST',
      userId,
      userEmail: (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email || 'admin',
      resourceId: requestId,
      resourceType: 'GdprDeletionRequest',
      previousState: { status: request.status },
      newState: { status: 'REJECTED', reason, action: 'request_rejected' },
    });

    revalidatePath('/dashboard/admin/gdpr');
    return { success: true };
  } catch (err) {
    console.error('[GDPR Admin] Reject error:', err);
    return { success: false, error: 'Failed to reject request' };
  }
}

/**
 * Cancel a GDPR deletion request (admin action)
 */
export async function waCancelGdprRequest(
  requestId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const { isAdmin, userId, error } = await waIsAdmin();

  if (!isAdmin || !userId) {
    return { success: false, error: error || 'Unauthorized' };
  }

  try {
    const cancelled = await cancelDeletionRequest(requestId, userId);

    if (!cancelled) {
      return { success: false, error: 'Unable to cancel request' };
    }

    // Add admin note if provided
    if (reason) {
      await prisma.waGdprDeletionRequest.update({
        where: { id: requestId },
        data: {
          notes: `Admin cancelled: ${reason}`,
        },
      });
    }

    revalidatePath('/dashboard/admin/gdpr');
    return { success: true };
  } catch (err) {
    console.error('[GDPR Admin] Cancel error:', err);
    return { success: false, error: 'Failed to cancel request' };
  }
}

/**
 * Resend verification email for a pending GDPR request
 */
export async function waResendVerification(requestId: string): Promise<{
  success: boolean;
  error?: string;
  verificationToken?: string; // Only in dev mode
}> {
  const { isAdmin, userId, error } = await waIsAdmin();

  if (!isAdmin || !userId) {
    return { success: false, error: error || 'Unauthorized' };
  }

  try {
    const request = await prisma.waGdprDeletionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    if (request.status !== 'PENDING') {
      return { success: false, error: 'Can only resend verification for pending requests' };
    }

    // Generate new verification token
    const { randomBytes } = await import('crypto');
    const newToken = randomBytes(32).toString('hex');

    await prisma.waGdprDeletionRequest.update({
      where: { id: requestId },
      data: {
        verificationToken: newToken,
        notes: `Verification resent by admin at ${new Date().toISOString()}`,
      },
    });

    // Log the resend using DATA_DELETION_REQUEST action type
    await createImmutableAuditLog({
      actionType: 'DATA_DELETION_REQUEST',
      userId,
      userEmail: (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email || 'admin',
      resourceId: requestId,
      resourceType: 'GdprDeletionRequest',
      newState: { action: 'verification_resent' },
    });

    // TODO: In production, send email with verification link
    // For now, return token in dev mode for testing
    revalidatePath('/dashboard/admin/gdpr');

    if (process.env.NODE_ENV === 'development') {
      return { success: true, verificationToken: newToken };
    }

    return { success: true };
  } catch (err) {
    console.error('[GDPR Admin] Resend verification error:', err);
    return { success: false, error: 'Failed to resend verification' };
  }
}

/**
 * Get GDPR request details for admin view
 */
export async function waGetGdprRequestDetails(requestId: string): Promise<{
  success: boolean;
  data?: {
    id: string;
    userEmail: string;
    status: string;
    requestedAt: Date;
    verifiedAt?: Date | null;
    processedAt?: Date | null;
    processedBy?: string | null;
    deletedData?: Record<string, unknown> | null;
    anonymizedData?: Record<string, unknown> | null;
    notes?: string | null;
  };
  error?: string;
}> {
  const { isAdmin, error } = await waIsAdmin();

  if (!isAdmin) {
    return { success: false, error: error || 'Unauthorized' };
  }

  try {
    const request = await prisma.waGdprDeletionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    return {
      success: true,
      data: {
        id: request.id,
        userEmail: request.userEmail,
        status: request.status,
        requestedAt: request.requestedAt,
        verifiedAt: request.verifiedAt,
        processedAt: request.processedAt,
        processedBy: request.processedBy,
        deletedData: request.deletedData as Record<string, unknown> | null,
        anonymizedData: request.anonymizedData as Record<string, unknown> | null,
        notes: request.notes,
      },
    };
  } catch (err) {
    console.error('[GDPR Admin] Get details error:', err);
    return { success: false, error: 'Failed to get request details' };
  }
}

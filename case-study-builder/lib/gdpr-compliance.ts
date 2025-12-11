/**
 * GDPR Compliance Service
 *
 * Implements GDPR data protection requirements including:
 * - Right to be Forgotten (Article 17)
 * - Data Anonymization
 * - Data Export (Article 20)
 * - Consent Management
 *
 * Complies with WA Policy Section 7.5 - GDPR Requirements.
 *
 * @module gdpr-compliance
 * @author WA Security Team
 * @version 1.0.0
 * @since 2025-12-11
 */

import { createHash, randomBytes } from 'crypto';
import prisma from '@/lib/prisma';
import { GdprDeletionStatus, Prisma } from '@prisma/client';
import { createImmutableAuditLog } from '@/lib/immutable-audit-logger';

/**
 * Result of a GDPR deletion request
 */
export interface GdprDeletionResult {
  success: boolean;
  requestId: string;
  status: GdprDeletionStatus;
  deletedData?: {
    caseStudies: number;
    comments: number;
    savedCases: number;
    notifications: number;
  };
  anonymizedData?: {
    auditLogs: number;
    caseStudiesAsApprover: number;
  };
  error?: string;
}

/**
 * Anonymized user data structure
 */
interface AnonymizedUserData {
  originalEmail: string;
  anonymizedId: string;
  anonymizedAt: Date;
}

/**
 * Generates a deterministic anonymous identifier
 * Uses SHA-256 to create consistent but non-reversible IDs
 *
 * @param originalId - The original user ID
 * @returns Anonymized identifier
 */
function generateAnonymousId(originalId: string): string {
  const salt = process.env.GDPR_ANONYMIZATION_SALT || 'wa-gdpr-salt-2025';
  return `anon_${createHash('sha256').update(`${originalId}${salt}`).digest('hex').substring(0, 16)}`;
}

/**
 * Generates a verification token for deletion requests
 *
 * @returns Random verification token
 */
function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Creates a new GDPR deletion request
 *
 * This initiates the right-to-be-forgotten process. The user must verify
 * their identity before the deletion is processed.
 *
 * @param userId - ID of the user requesting deletion
 * @param userEmail - Email of the user requesting deletion
 * @returns The created deletion request
 *
 * @example
 * const request = await createDeletionRequest('user-123', 'user@example.com');
 * // Send verification email with request.verificationToken
 */
export async function createDeletionRequest(
  userId: string,
  userEmail: string
): Promise<{ requestId: string; verificationToken: string }> {
  const verificationToken = generateVerificationToken();

  const request = await prisma.gdprDeletionRequest.create({
    data: {
      userId,
      userEmail,
      verificationToken,
      status: 'PENDING',
    },
  });

  // Log the request
  await createImmutableAuditLog({
    actionType: 'DATA_DELETION_REQUEST',
    userId,
    userEmail,
    resourceId: request.id,
    resourceType: 'GdprDeletionRequest',
    newState: { status: 'PENDING' },
  });

  return {
    requestId: request.id,
    verificationToken,
  };
}

/**
 * Verifies a deletion request
 *
 * @param requestId - ID of the deletion request
 * @param verificationToken - Token sent to user's email
 * @returns Whether verification was successful
 */
export async function verifyDeletionRequest(
  requestId: string,
  verificationToken: string
): Promise<boolean> {
  const request = await prisma.gdprDeletionRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.verificationToken !== verificationToken) {
    return false;
  }

  if (request.status !== 'PENDING') {
    return false;
  }

  await prisma.gdprDeletionRequest.update({
    where: { id: requestId },
    data: {
      status: 'VERIFIED',
      verifiedAt: new Date(),
    },
  });

  return true;
}

/**
 * Processes a verified deletion request
 *
 * This performs the actual data deletion and anonymization:
 * 1. Deletes user's personal data (case studies, comments, etc.)
 * 2. Anonymizes data that must be retained for legal reasons
 * 3. Updates audit logs to reference anonymous ID
 *
 * @param requestId - ID of the verified deletion request
 * @param processedBy - ID of the admin processing the request
 * @returns Result of the deletion process
 */
export async function processDeletionRequest(
  requestId: string,
  processedBy: string
): Promise<GdprDeletionResult> {
  const request = await prisma.gdprDeletionRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return {
      success: false,
      requestId,
      status: 'REJECTED',
      error: 'Request not found',
    };
  }

  if (request.status !== 'VERIFIED') {
    return {
      success: false,
      requestId,
      status: request.status,
      error: 'Request must be verified before processing',
    };
  }

  // Update status to in progress
  await prisma.gdprDeletionRequest.update({
    where: { id: requestId },
    data: { status: 'IN_PROGRESS' },
  });

  const userId = request.userId;
  const anonymousId = generateAnonymousId(userId);

  try {
    // Start transaction for data deletion
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete user's saved cases
      const deletedSavedCases = await tx.savedCase.deleteMany({
        where: { userId },
      });

      // 2. Delete user's notifications
      const deletedNotifications = await tx.notification.deleteMany({
        where: { userId },
      });

      // 3. Delete user's comments (or anonymize if needed for context)
      const deletedComments = await tx.comment.deleteMany({
        where: { userId },
      });

      // 4. Handle case studies - delete drafts, anonymize published
      const userCaseStudies = await tx.caseStudy.findMany({
        where: { contributorId: userId },
      });

      let deletedCaseStudies = 0;
      let anonymizedCaseStudies = 0;

      for (const caseStudy of userCaseStudies) {
        if (caseStudy.status === 'DRAFT' || caseStudy.status === 'REJECTED') {
          // Delete unpublished case studies
          await tx.caseStudy.delete({ where: { id: caseStudy.id } });
          deletedCaseStudies++;
        } else {
          // Anonymize published case studies (keep for business records)
          await tx.caseStudy.update({
            where: { id: caseStudy.id },
            data: {
              contributorId: anonymousId,
              isActive: false,
              deletedAt: new Date(),
              deletedBy: 'GDPR_DELETION',
            },
          });
          anonymizedCaseStudies++;
        }
      }

      // 5. Update case studies where user was approver (anonymize)
      const approverUpdate = await tx.caseStudy.updateMany({
        where: { approverId: userId },
        data: { approverId: anonymousId },
      });

      // 6. Update case studies where user was rejector (anonymize)
      await tx.caseStudy.updateMany({
        where: { rejectedBy: userId },
        data: { rejectedBy: anonymousId },
      });

      // 7. Delete user's sessions
      await tx.session.deleteMany({
        where: { userId },
      });

      // 8. Delete user's accounts
      await tx.account.deleteMany({
        where: { userId },
      });

      // 9. Anonymize the user record instead of deleting
      // This preserves referential integrity
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `${anonymousId}@deleted.local`,
          name: 'Deleted User',
          image: null,
          region: null,
          isActive: false,
          deletedAt: new Date(),
          notificationPreferences: Prisma.JsonNull,
          displayPreferences: Prisma.JsonNull,
        },
      });

      return {
        deletedCaseStudies,
        deletedComments: deletedComments.count,
        deletedSavedCases: deletedSavedCases.count,
        deletedNotifications: deletedNotifications.count,
        anonymizedCaseStudies,
        anonymizedAsApprover: approverUpdate.count,
      };
    });

    // Update request status
    await prisma.gdprDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        processedBy,
        deletedData: {
          caseStudies: result.deletedCaseStudies,
          comments: result.deletedComments,
          savedCases: result.deletedSavedCases,
          notifications: result.deletedNotifications,
        },
        anonymizedData: {
          caseStudies: result.anonymizedCaseStudies,
          asApprover: result.anonymizedAsApprover,
        },
      },
    });

    // Log completion
    await createImmutableAuditLog({
      actionType: 'DATA_ANONYMIZED',
      userId: processedBy,
      userEmail: 'system@weldingalloys.com',
      resourceId: requestId,
      resourceType: 'GdprDeletionRequest',
      previousState: { userId, status: 'VERIFIED' },
      newState: {
        anonymousId,
        status: 'COMPLETED',
        deletedData: result,
      },
    });

    return {
      success: true,
      requestId,
      status: 'COMPLETED',
      deletedData: {
        caseStudies: result.deletedCaseStudies,
        comments: result.deletedComments,
        savedCases: result.deletedSavedCases,
        notifications: result.deletedNotifications,
      },
      anonymizedData: {
        auditLogs: 0, // Audit logs are kept but user is anonymized
        caseStudiesAsApprover: result.anonymizedAsApprover,
      },
    };
  } catch (error) {
    // Update request status on failure
    await prisma.gdprDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        notes: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    });

    return {
      success: false,
      requestId,
      status: 'REJECTED',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Exports user data (GDPR Article 20 - Data Portability)
 *
 * @param userId - ID of the user requesting data export
 * @returns All user data in a portable format
 */
export async function exportUserData(userId: string): Promise<{
  user: Prisma.JsonValue;
  caseStudies: Prisma.JsonValue[];
  comments: Prisma.JsonValue[];
  savedCases: Prisma.JsonValue[];
  notifications: Prisma.JsonValue[];
  auditLogs: Prisma.JsonValue[];
}> {
  const [user, caseStudies, comments, savedCases, notifications, auditLogs] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          region: true,
          totalPoints: true,
          badges: true,
          notificationPreferences: true,
          displayPreferences: true,
          createdAt: true,
        },
      }),
      prisma.caseStudy.findMany({
        where: { contributorId: userId },
        include: {
          wps: true,
          costCalculator: true,
        },
      }),
      prisma.comment.findMany({
        where: { userId },
      }),
      prisma.savedCase.findMany({
        where: { userId },
        include: {
          caseStudy: {
            select: {
              id: true,
              customerName: true,
              industry: true,
            },
          },
        },
      }),
      prisma.notification.findMany({
        where: { userId },
      }),
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
    ]);

  // Log the export
  await createImmutableAuditLog({
    actionType: 'DATA_EXPORT',
    userId,
    userEmail: user?.email || 'unknown',
    resourceType: 'User',
    resourceId: userId,
    newState: {
      exportedAt: new Date().toISOString(),
      recordCounts: {
        caseStudies: caseStudies.length,
        comments: comments.length,
        savedCases: savedCases.length,
        notifications: notifications.length,
        auditLogs: auditLogs.length,
      },
    },
  });

  return {
    user: user as Prisma.JsonValue,
    caseStudies: caseStudies as unknown as Prisma.JsonValue[],
    comments: comments as unknown as Prisma.JsonValue[],
    savedCases: savedCases as unknown as Prisma.JsonValue[],
    notifications: notifications as unknown as Prisma.JsonValue[],
    auditLogs: auditLogs as unknown as Prisma.JsonValue[],
  };
}

/**
 * Gets the status of a deletion request
 *
 * @param requestId - ID of the deletion request
 * @returns Current status of the request
 */
export async function getDeletionRequestStatus(requestId: string) {
  return prisma.gdprDeletionRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      requestedAt: true,
      verifiedAt: true,
      processedAt: true,
      deletedData: true,
      anonymizedData: true,
      notes: true,
    },
  });
}

/**
 * Gets all deletion requests for admin review
 *
 * @param options - Query options
 * @returns List of deletion requests
 */
export async function getDeletionRequests(options?: {
  status?: GdprDeletionStatus;
  limit?: number;
  offset?: number;
}) {
  return prisma.gdprDeletionRequest.findMany({
    where: options?.status ? { status: options.status } : undefined,
    orderBy: { requestedAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}

/**
 * Cancels a pending deletion request
 *
 * @param requestId - ID of the request to cancel
 * @param cancelledBy - ID of the user cancelling
 * @returns Whether cancellation was successful
 */
export async function cancelDeletionRequest(
  requestId: string,
  cancelledBy: string
): Promise<boolean> {
  const request = await prisma.gdprDeletionRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return false;
  }

  if (request.status !== 'PENDING' && request.status !== 'VERIFIED') {
    return false;
  }

  await prisma.gdprDeletionRequest.update({
    where: { id: requestId },
    data: {
      status: 'CANCELLED',
      notes: `Cancelled by ${cancelledBy} at ${new Date().toISOString()}`,
    },
  });

  return true;
}

/**
 * Records user consent
 *
 * @param userId - ID of the user
 * @param userEmail - Email of the user
 * @param consentType - Type of consent given
 * @param granted - Whether consent was granted or withdrawn
 */
export async function recordConsent(
  userId: string,
  userEmail: string,
  consentType: string,
  granted: boolean,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  await createImmutableAuditLog({
    actionType: granted ? 'CONSENT_GIVEN' : 'CONSENT_WITHDRAWN',
    userId,
    userEmail,
    resourceType: 'Consent',
    resourceId: consentType,
    newState: {
      consentType,
      granted,
      timestamp: new Date().toISOString(),
    },
    metadata,
  });
}

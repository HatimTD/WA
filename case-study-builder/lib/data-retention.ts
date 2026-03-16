/**
 * Data Retention Policy Service
 *
 * Implements automated data lifecycle management including:
 * - Configurable retention periods per data type
 * - Automatic archival and cleanup
 * - Compliance with WA Policy Section 7.5.4
 *
 * @module data-retention
 * @author WA Security Team
 * @version 1.0.0
 * @since 2025-12-11
 */

import prisma from '@/lib/prisma';
import { createImmutableAuditLog } from '@/lib/immutable-audit-logger';

/**
 * Default retention policies (in days)
 * Based on WA Policy V2.3 Section 7.5.4
 */
export const DEFAULT_RETENTION_POLICIES = {
  // User data - 7 years after account deletion (legal requirement)
  User: {
    retentionDays: 2555, // ~7 years
    archiveAfterDays: 365,
    description: 'User account data retained for legal compliance',
    legalBasis: 'Legal obligation (tax/accounting records)',
  },

  // Case studies - 10 years (business records)
  CaseStudy: {
    retentionDays: 3650, // 10 years
    archiveAfterDays: 1825, // 5 years
    description: 'Business case studies retained for reference',
    legalBasis: 'Legitimate interest (business records)',
  },

  // Audit logs - 7 years (compliance requirement)
  AuditLog: {
    retentionDays: 2555, // ~7 years
    archiveAfterDays: null,
    description: 'Immutable audit trail for compliance',
    legalBasis: 'Legal obligation (audit requirements)',
  },

  // Notifications - 90 days
  Notification: {
    retentionDays: 90,
    archiveAfterDays: null,
    description: 'User notifications',
    legalBasis: 'Consent',
  },

  // Sessions - 30 days after expiry
  Session: {
    retentionDays: 30,
    archiveAfterDays: null,
    description: 'User sessions',
    legalBasis: 'Legitimate interest (security)',
  },

  // Comments - 5 years
  Comment: {
    retentionDays: 1825, // 5 years
    archiveAfterDays: 365,
    description: 'Case study comments',
    legalBasis: 'Legitimate interest (business context)',
  },

  // GDPR deletion requests - 3 years after completion
  GdprDeletionRequest: {
    retentionDays: 1095, // 3 years
    archiveAfterDays: null,
    description: 'GDPR request records for compliance proof',
    legalBasis: 'Legal obligation (GDPR compliance proof)',
  },
};

/**
 * Retention policy configuration
 */
export interface RetentionPolicy {
  dataType: string;
  retentionDays: number;
  archiveAfterDays: number | null;
  description: string | null;
  legalBasis: string | null;
}

/**
 * Result of a retention cleanup operation
 */
export interface RetentionCleanupResult {
  success: boolean;
  dataType: string;
  deletedCount: number;
  archivedCount: number;
  errors: string[];
  executedAt: Date;
}

/**
 * Initializes default retention policies in the database
 *
 * @returns Number of policies created/updated
 */
export async function initializeRetentionPolicies(): Promise<number> {
  let count = 0;

  for (const [dataType, policy] of Object.entries(DEFAULT_RETENTION_POLICIES)) {
    await prisma.waDataRetentionPolicy.upsert({
      where: { dataType },
      create: {
        dataType,
        retentionDays: policy.retentionDays,
        archiveAfterDays: policy.archiveAfterDays,
        description: policy.description,
        legalBasis: policy.legalBasis,
      },
      update: {
        retentionDays: policy.retentionDays,
        archiveAfterDays: policy.archiveAfterDays,
        description: policy.description,
        legalBasis: policy.legalBasis,
      },
    });
    count++;
  }

  return count;
}

/**
 * Gets the retention policy for a specific data type
 *
 * @param dataType - The data type to get policy for
 * @returns The retention policy or null if not found
 */
export async function getRetentionPolicy(
  dataType: string
): Promise<RetentionPolicy | null> {
  return prisma.waDataRetentionPolicy.findUnique({
    where: { dataType },
  });
}

/**
 * Gets all retention policies
 *
 * @returns All configured retention policies
 */
export async function getAllRetentionPolicies(): Promise<RetentionPolicy[]> {
  return prisma.waDataRetentionPolicy.findMany({
    orderBy: { dataType: 'asc' },
  });
}

/**
 * Updates a retention policy
 *
 * @param dataType - The data type to update
 * @param updates - The updates to apply
 * @param updatedBy - ID of the user making the update
 */
export async function updateRetentionPolicy(
  dataType: string,
  updates: Partial<Omit<RetentionPolicy, 'dataType'>>,
  updatedBy: string
): Promise<RetentionPolicy> {
  const previous = await getRetentionPolicy(dataType);

  const updated = await prisma.waDataRetentionPolicy.update({
    where: { dataType },
    data: updates,
  });

  await createImmutableAuditLog({
    actionType: 'SYSTEM_CONFIG_CHANGED',
    userId: updatedBy,
    userEmail: 'system@weldingalloys.com',
    resourceType: 'DataRetentionPolicy',
    resourceId: dataType,
    previousState: previous ? JSON.parse(JSON.stringify(previous)) : null,
    newState: JSON.parse(JSON.stringify(updated)),
  });

  return updated;
}

/**
 * Calculates the cutoff date for a retention policy
 *
 * @param retentionDays - Number of days to retain
 * @returns The cutoff date
 */
function calculateCutoffDate(retentionDays: number): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  return cutoff;
}

/**
 * Runs retention cleanup for expired notifications
 */
async function cleanupNotifications(
  policy: RetentionPolicy
): Promise<RetentionCleanupResult> {
  const cutoffDate = calculateCutoffDate(policy.retentionDays);
  const result: RetentionCleanupResult = {
    success: true,
    dataType: 'Notification',
    deletedCount: 0,
    archivedCount: 0,
    errors: [],
    executedAt: new Date(),
  };

  try {
    const deleted = await prisma.waNotification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        read: true, // Only delete read notifications
      },
    });
    result.deletedCount = deleted.count;
  } catch (error) {
    result.success = false;
    result.errors.push(
      `Failed to cleanup notifications: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}

/**
 * Runs retention cleanup for expired sessions
 */
async function cleanupSessions(
  policy: RetentionPolicy
): Promise<RetentionCleanupResult> {
  const cutoffDate = calculateCutoffDate(policy.retentionDays);
  const result: RetentionCleanupResult = {
    success: true,
    dataType: 'Session',
    deletedCount: 0,
    archivedCount: 0,
    errors: [],
    executedAt: new Date(),
  };

  try {
    const deleted = await prisma.session.deleteMany({
      where: {
        expires: { lt: cutoffDate },
      },
    });
    result.deletedCount = deleted.count;
  } catch (error) {
    result.success = false;
    result.errors.push(
      `Failed to cleanup sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}

/**
 * Runs retention cleanup for completed GDPR requests
 */
async function cleanupGdprRequests(
  policy: RetentionPolicy
): Promise<RetentionCleanupResult> {
  const cutoffDate = calculateCutoffDate(policy.retentionDays);
  const result: RetentionCleanupResult = {
    success: true,
    dataType: 'GdprDeletionRequest',
    deletedCount: 0,
    archivedCount: 0,
    errors: [],
    executedAt: new Date(),
  };

  try {
    // Only delete completed or cancelled requests
    const deleted = await prisma.waGdprDeletionRequest.deleteMany({
      where: {
        processedAt: { lt: cutoffDate },
        status: { in: ['COMPLETED', 'CANCELLED', 'REJECTED'] },
      },
    });
    result.deletedCount = deleted.count;
  } catch (error) {
    result.success = false;
    result.errors.push(
      `Failed to cleanup GDPR requests: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}

/**
 * Runs retention cleanup for soft-deleted users
 */
async function cleanupDeletedUsers(
  policy: RetentionPolicy
): Promise<RetentionCleanupResult> {
  const cutoffDate = calculateCutoffDate(policy.retentionDays);
  const result: RetentionCleanupResult = {
    success: true,
    dataType: 'User',
    deletedCount: 0,
    archivedCount: 0,
    errors: [],
    executedAt: new Date(),
  };

  try {
    // Only permanently delete users that have been soft-deleted
    // and are past retention period
    const usersToDelete = await prisma.user.findMany({
      where: {
        isActive: false,
        deletedAt: { lt: cutoffDate },
      },
      select: { id: true },
    });

    // Delete related data first
    for (const user of usersToDelete) {
      await prisma.$transaction([
        prisma.account.deleteMany({ where: { userId: user.id } }),
        prisma.session.deleteMany({ where: { userId: user.id } }),
        prisma.waNotification.deleteMany({ where: { userId: user.id } }),
        prisma.waSavedCase.deleteMany({ where: { userId: user.id } }),
        prisma.user.delete({ where: { id: user.id } }),
      ]);
      result.deletedCount++;
    }
  } catch (error) {
    result.success = false;
    result.errors.push(
      `Failed to cleanup deleted users: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}

/**
 * Archives old case studies (soft delete)
 */
async function archiveCaseStudies(
  policy: RetentionPolicy
): Promise<RetentionCleanupResult> {
  const result: RetentionCleanupResult = {
    success: true,
    dataType: 'CaseStudy',
    deletedCount: 0,
    archivedCount: 0,
    errors: [],
    executedAt: new Date(),
  };

  if (!policy.archiveAfterDays) {
    return result;
  }

  const archiveCutoff = calculateCutoffDate(policy.archiveAfterDays);

  try {
    const archived = await prisma.waCaseStudy.updateMany({
      where: {
        createdAt: { lt: archiveCutoff },
        isActive: true,
        status: { in: ['APPROVED', 'PUBLISHED'] },
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedBy: 'RETENTION_ARCHIVE',
      },
    });
    result.archivedCount = archived.count;
  } catch (error) {
    result.success = false;
    result.errors.push(
      `Failed to archive case studies: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}

/**
 * Runs all retention cleanup operations
 *
 * This should be called by a scheduled job (e.g., daily cron)
 *
 * @param executedBy - ID of the user or system running the cleanup
 * @returns Results of all cleanup operations
 */
export async function runRetentionCleanup(
  executedBy: string = 'system'
): Promise<{
  results: RetentionCleanupResult[];
  totalDeleted: number;
  totalArchived: number;
  success: boolean;
}> {
  const results: RetentionCleanupResult[] = [];
  const policies = await getAllRetentionPolicies();

  // Run cleanup for each data type
  for (const policy of policies) {
    let result: RetentionCleanupResult | null = null;

    switch (policy.dataType) {
      case 'Notification':
        result = await cleanupNotifications(policy);
        break;
      case 'Session':
        result = await cleanupSessions(policy);
        break;
      case 'GdprDeletionRequest':
        result = await cleanupGdprRequests(policy);
        break;
      case 'User':
        result = await cleanupDeletedUsers(policy);
        break;
      case 'CaseStudy':
        result = await archiveCaseStudies(policy);
        break;
      // AuditLog and Comment are not cleaned up automatically
    }

    if (result) {
      results.push(result);
    }
  }

  const totalDeleted = results.reduce((sum, r) => sum + r.deletedCount, 0);
  const totalArchived = results.reduce((sum, r) => sum + r.archivedCount, 0);
  const success = results.every((r) => r.success);

  // Log the cleanup operation
  await createImmutableAuditLog({
    actionType: 'RETENTION_CLEANUP',
    userId: executedBy,
    userEmail: 'system@weldingalloys.com',
    resourceType: 'System',
    newState: {
      results: results.map((r) => ({
        dataType: r.dataType,
        deleted: r.deletedCount,
        archived: r.archivedCount,
        success: r.success,
      })),
      totalDeleted,
      totalArchived,
      success,
    },
  });

  return {
    results,
    totalDeleted,
    totalArchived,
    success,
  };
}

/**
 * Gets retention statistics
 *
 * @returns Statistics about data subject to retention
 */
export async function getRetentionStats() {
  const policies = await getAllRetentionPolicies();
  const stats: Array<{
    dataType: string;
    retentionDays: number;
    totalRecords: number;
    expiredRecords: number;
    archivableRecords: number;
  }> = [];

  for (const policy of policies) {
    const cutoffDate = calculateCutoffDate(policy.retentionDays);
    const archiveCutoff = policy.archiveAfterDays
      ? calculateCutoffDate(policy.archiveAfterDays)
      : null;

    let totalRecords = 0;
    let expiredRecords = 0;
    let archivableRecords = 0;

    switch (policy.dataType) {
      case 'Notification':
        totalRecords = await prisma.waNotification.count();
        expiredRecords = await prisma.waNotification.count({
          where: { createdAt: { lt: cutoffDate }, read: true },
        });
        break;
      case 'Session':
        totalRecords = await prisma.session.count();
        expiredRecords = await prisma.session.count({
          where: { expires: { lt: cutoffDate } },
        });
        break;
      case 'User':
        totalRecords = await prisma.user.count({ where: { isActive: false } });
        expiredRecords = await prisma.user.count({
          where: { isActive: false, deletedAt: { lt: cutoffDate } },
        });
        break;
      case 'CaseStudy':
        totalRecords = await prisma.waCaseStudy.count();
        if (archiveCutoff) {
          archivableRecords = await prisma.waCaseStudy.count({
            where: {
              createdAt: { lt: archiveCutoff },
              isActive: true,
              status: { in: ['APPROVED', 'PUBLISHED'] },
            },
          });
        }
        break;
      case 'AuditLog':
        totalRecords = await prisma.waAuditLog.count();
        break;
    }

    stats.push({
      dataType: policy.dataType,
      retentionDays: policy.retentionDays,
      totalRecords,
      expiredRecords,
      archivableRecords,
    });
  }

  return stats;
}

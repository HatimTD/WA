/**
 * Immutable Audit Logger
 *
 * Provides tamper-proof audit logging with hash chain verification.
 * Implements WA Policy Section 5.2 - Immutable Audit Trail Requirements.
 *
 * Features:
 * - SHA-256 content hashing for integrity verification
 * - Hash chain linking (blockchain-like) to detect tampering
 * - Write-once audit records that cannot be modified
 * - Verification functions to validate audit trail integrity
 *
 * @module immutable-audit-logger
 * @author WA Security Team
 * @version 2.0.0
 * @since 2025-12-11
 */

import { createHash } from 'crypto';
import prisma from '@/lib/prisma';
import { AuditActionType, Prisma } from '@prisma/client';

/**
 * Metadata for audit log entries
 */
export interface AuditLogMetadata {
  /** User agent string from the request */
  userAgent?: string;
  /** IP address of the requester */
  ipAddress?: string;
  /** Session ID for correlation */
  sessionId?: string;
  /** Additional context-specific data */
  additionalData?: Record<string, unknown>;
}

/**
 * Options for creating an audit log entry
 */
export interface CreateAuditLogOptions {
  /** Type of action being logged */
  actionType: AuditActionType;
  /** ID of the user performing the action */
  userId: string;
  /** Email of the user performing the action */
  userEmail: string;
  /** ID of the affected resource (if applicable) */
  resourceId?: string;
  /** Type of the affected resource (e.g., 'CaseStudy', 'User') */
  resourceType?: string;
  /** Previous state before the action */
  previousState?: Prisma.JsonValue;
  /** New state after the action */
  newState?: Prisma.JsonValue;
  /** Additional metadata */
  metadata?: AuditLogMetadata;
}

/**
 * Result of audit trail verification
 */
export interface VerificationResult {
  /** Whether the verification passed */
  valid: boolean;
  /** Total number of entries checked */
  totalEntries: number;
  /** Number of valid entries */
  validEntries: number;
  /** Number of invalid entries */
  invalidEntries: number;
  /** Details of any invalid entries found */
  invalidDetails: Array<{
    id: string;
    reason: string;
    expectedHash?: string;
    actualHash?: string;
  }>;
}

/**
 * Generates a SHA-256 hash of the audit log content
 *
 * @param content - The content to hash
 * @returns SHA-256 hash as hex string
 */
function generateContentHash(content: {
  actionType: AuditActionType;
  userId: string;
  userEmail: string;
  resourceId?: string | null;
  resourceType?: string | null;
  previousState?: Prisma.JsonValue | null;
  newState?: Prisma.JsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  createdAt: Date;
}): string {
  const hashInput = JSON.stringify({
    actionType: content.actionType,
    userId: content.userId,
    userEmail: content.userEmail,
    resourceId: content.resourceId || null,
    resourceType: content.resourceType || null,
    previousState: content.previousState || null,
    newState: content.newState || null,
    ipAddress: content.ipAddress || null,
    userAgent: content.userAgent || null,
    sessionId: content.sessionId || null,
    createdAt: content.createdAt.toISOString(),
  });

  return createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Gets the hash of the most recent audit log entry
 *
 * @returns The previous hash or null if no entries exist
 */
async function getPreviousHash(): Promise<string | null> {
  const lastEntry = await prisma.auditLog.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { contentHash: true },
  });

  return lastEntry?.contentHash || null;
}

/**
 * Creates an immutable audit log entry
 *
 * This function creates a permanent, tamper-proof record of system actions.
 * Each entry includes a SHA-256 hash of its content and links to the
 * previous entry's hash, forming an unbreakable chain.
 *
 * @param options - The audit log options
 * @returns The created audit log entry
 *
 * @example
 * await createImmutableAuditLog({
 *   actionType: 'CASE_APPROVED',
 *   userId: 'user-123',
 *   userEmail: 'admin@weldingalloys.com',
 *   resourceId: 'case-456',
 *   resourceType: 'CaseStudy',
 *   previousState: { status: 'SUBMITTED' },
 *   newState: { status: 'APPROVED' },
 *   metadata: {
 *     ipAddress: '192.168.1.1',
 *     userAgent: 'Mozilla/5.0...'
 *   }
 * });
 */
export async function createImmutableAuditLog(
  options: CreateAuditLogOptions
): Promise<{ id: string; contentHash: string }> {
  const createdAt = new Date();

  // Get the previous hash for chain linking
  const previousHash = await getPreviousHash();

  // Prepare the content for hashing
  const contentForHash = {
    actionType: options.actionType,
    userId: options.userId,
    userEmail: options.userEmail,
    resourceId: options.resourceId || null,
    resourceType: options.resourceType || null,
    previousState: options.previousState || null,
    newState: options.newState || null,
    ipAddress: options.metadata?.ipAddress || null,
    userAgent: options.metadata?.userAgent || null,
    sessionId: options.metadata?.sessionId || null,
    createdAt,
  };

  // Generate the content hash
  const contentHash = generateContentHash(contentForHash);

  // Create the audit log entry
  // Handle Json fields - convert null to undefined for Prisma
  const previousStateData = options.previousState === null ? undefined : options.previousState;
  const newStateData = options.newState === null ? undefined : options.newState;

  const auditLog = await prisma.auditLog.create({
    data: {
      actionType: options.actionType,
      userId: options.userId,
      userEmail: options.userEmail,
      resourceId: options.resourceId,
      resourceType: options.resourceType,
      previousState: previousStateData as Prisma.InputJsonValue | undefined,
      newState: newStateData as Prisma.InputJsonValue | undefined,
      ipAddress: options.metadata?.ipAddress,
      userAgent: options.metadata?.userAgent,
      sessionId: options.metadata?.sessionId,
      contentHash,
      previousHash,
      createdAt,
    },
    select: {
      id: true,
      contentHash: true,
    },
  });

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Immutable Audit Log]', {
      id: auditLog.id,
      actionType: options.actionType,
      userId: options.userId,
      contentHash: contentHash.substring(0, 16) + '...',
      chainedTo: previousHash ? previousHash.substring(0, 16) + '...' : 'GENESIS',
    });
  }

  return auditLog;
}

/**
 * Verifies the integrity of a single audit log entry
 *
 * @param entryId - The ID of the entry to verify
 * @returns Whether the entry's hash is valid
 */
export async function verifyAuditLogEntry(entryId: string): Promise<{
  valid: boolean;
  reason?: string;
}> {
  const entry = await prisma.auditLog.findUnique({
    where: { id: entryId },
  });

  if (!entry) {
    return { valid: false, reason: 'Entry not found' };
  }

  // Recalculate the hash
  const expectedHash = generateContentHash({
    actionType: entry.actionType,
    userId: entry.userId,
    userEmail: entry.userEmail,
    resourceId: entry.resourceId,
    resourceType: entry.resourceType,
    previousState: entry.previousState,
    newState: entry.newState,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    sessionId: entry.sessionId,
    createdAt: entry.createdAt,
  });

  if (entry.contentHash !== expectedHash) {
    return {
      valid: false,
      reason: `Hash mismatch: expected ${expectedHash}, got ${entry.contentHash}`,
    };
  }

  return { valid: true };
}

/**
 * Verifies the integrity of the entire audit trail
 *
 * Checks both content hashes and chain integrity to detect any tampering.
 *
 * @param options - Verification options
 * @returns Detailed verification results
 *
 * @example
 * const result = await verifyAuditTrailIntegrity({ limit: 1000 });
 * if (!result.valid) {
 *   console.error('Audit trail tampering detected!', result.invalidDetails);
 * }
 */
export async function verifyAuditTrailIntegrity(options?: {
  /** Maximum number of entries to verify */
  limit?: number;
  /** Start from a specific date */
  fromDate?: Date;
  /** End at a specific date */
  toDate?: Date;
}): Promise<VerificationResult> {
  const limit = options?.limit || 10000;

  const entries = await prisma.auditLog.findMany({
    where: {
      ...(options?.fromDate && { createdAt: { gte: options.fromDate } }),
      ...(options?.toDate && { createdAt: { lte: options.toDate } }),
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  const result: VerificationResult = {
    valid: true,
    totalEntries: entries.length,
    validEntries: 0,
    invalidEntries: 0,
    invalidDetails: [],
  };

  let previousHash: string | null = null;

  for (const entry of entries) {
    let isValid = true;
    const reasons: string[] = [];

    // Verify content hash
    const expectedHash = generateContentHash({
      actionType: entry.actionType,
      userId: entry.userId,
      userEmail: entry.userEmail,
      resourceId: entry.resourceId,
      resourceType: entry.resourceType,
      previousState: entry.previousState,
      newState: entry.newState,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      sessionId: entry.sessionId,
      createdAt: entry.createdAt,
    });

    if (entry.contentHash !== expectedHash) {
      isValid = false;
      reasons.push(`Content hash mismatch`);
      result.invalidDetails.push({
        id: entry.id,
        reason: 'Content hash mismatch - data may have been tampered',
        expectedHash,
        actualHash: entry.contentHash,
      });
    }

    // Verify chain integrity (skip first entry)
    if (previousHash !== null && entry.previousHash !== previousHash) {
      isValid = false;
      reasons.push(`Chain integrity broken`);
      result.invalidDetails.push({
        id: entry.id,
        reason: 'Chain integrity broken - entry may have been inserted or deleted',
        expectedHash: previousHash,
        actualHash: entry.previousHash || 'null',
      });
    }

    if (isValid) {
      result.validEntries++;
    } else {
      result.invalidEntries++;
      result.valid = false;
    }

    previousHash = entry.contentHash;
  }

  return result;
}

/**
 * Retrieves audit logs for a specific user
 *
 * @param userId - ID of the user to retrieve logs for
 * @param options - Query options
 * @returns Array of audit log entries
 */
export async function getAuditLogsByUser(
  userId: string,
  options?: { limit?: number; offset?: number }
) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 100,
    skip: options?.offset || 0,
  });
}

/**
 * Retrieves audit logs for a specific resource
 *
 * @param resourceId - ID of the resource
 * @param resourceType - Type of the resource
 * @param options - Query options
 * @returns Array of audit log entries
 */
export async function getAuditLogsByResource(
  resourceId: string,
  resourceType?: string,
  options?: { limit?: number; offset?: number }
) {
  return prisma.auditLog.findMany({
    where: {
      resourceId,
      ...(resourceType && { resourceType }),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });
}

/**
 * Retrieves audit logs by action type
 *
 * @param actionType - The action type to filter by
 * @param options - Query options
 * @returns Array of audit log entries
 */
export async function getAuditLogsByActionType(
  actionType: AuditActionType,
  options?: { limit?: number; offset?: number; fromDate?: Date; toDate?: Date }
) {
  return prisma.auditLog.findMany({
    where: {
      actionType,
      ...(options?.fromDate && { createdAt: { gte: options.fromDate } }),
      ...(options?.toDate && { createdAt: { lte: options.toDate } }),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 100,
    skip: options?.offset || 0,
  });
}

/**
 * Gets audit trail statistics
 *
 * @returns Statistics about the audit trail
 */
export async function getAuditTrailStats() {
  const [totalCount, actionCounts, recentActivity] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.groupBy({
      by: ['actionType'],
      _count: { id: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        actionType: true,
        userId: true,
        userEmail: true,
        resourceType: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    totalEntries: totalCount,
    entriesByAction: actionCounts.reduce(
      (acc, curr) => {
        acc[curr.actionType] = curr._count.id;
        return acc;
      },
      {} as Record<string, number>
    ),
    recentActivity,
  };
}

// Re-export types for convenience
export { AuditActionType } from '@prisma/client';

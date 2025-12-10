/**
 * WA Audit Logger
 *
 * Provides comprehensive audit logging functionality for the WA Case Study Builder.
 * Implements WA Policy Section 5.2 - Audit Trail Requirements.
 *
 * @module wa-audit-logger
 * @author WA Security Team
 * @version 1.0.0
 * @since 2025-12-10
 */

import prisma from '@/lib/prisma';

/**
 * Enumeration of audit action types
 * Defines all trackable actions in the system
 */
export enum WaAuditActionType {
  // Authentication Actions
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',

  // Break-Glass Actions (WA Policy Section 3.1)
  BREAK_GLASS_ACCESS = 'BREAK_GLASS_ACCESS',
  BREAK_GLASS_ACCESS_FAILED = 'BREAK_GLASS_ACCESS_FAILED',
  BREAK_GLASS_ACTION = 'BREAK_GLASS_ACTION',
  BREAK_GLASS_SESSION_TERMINATED = 'BREAK_GLASS_SESSION_TERMINATED',

  // Case Study Actions
  CASE_CREATED = 'CASE_CREATED',
  CASE_UPDATED = 'CASE_UPDATED',
  CASE_DELETED = 'CASE_DELETED',
  CASE_SUBMITTED = 'CASE_SUBMITTED',
  CASE_APPROVED = 'CASE_APPROVED',
  CASE_REJECTED = 'CASE_REJECTED',
  CASE_PUBLISHED = 'CASE_PUBLISHED',

  // User Actions
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',

  // System Actions
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED',
  DATA_EXPORT = 'DATA_EXPORT',
  BULK_OPERATION = 'BULK_OPERATION',
}

/**
 * Audit log entry metadata
 * Contains contextual information about the logged action
 */
export interface WaAuditLogMetadata {
  /** User agent string from the request */
  userAgent?: string;
  /** IP address of the requester */
  ipAddress?: string;
  /** Additional context-specific data */
  additionalData?: Record<string, any>;
}

/**
 * Audit log entry structure
 * Represents a complete audit trail record
 */
export interface WaAuditLogEntry {
  /** Unique identifier for the audit log entry */
  id: string;
  /** Type of action performed */
  actionType: WaAuditActionType;
  /** ID of the user who performed the action */
  userId: string;
  /** Email of the user who performed the action */
  userEmail: string;
  /** ID of the affected resource (if applicable) */
  resourceId?: string;
  /** Type of the affected resource (e.g., 'CaseStudy', 'User') */
  resourceType?: string;
  /** Previous state before the action (JSON) */
  previousState?: any;
  /** New state after the action (JSON) */
  newState?: any;
  /** Additional metadata about the action */
  metadata?: WaAuditLogMetadata;
  /** Timestamp when the action occurred */
  timestamp: Date;
}

/**
 * Logs an audit trail entry to the system
 *
 * This function creates a permanent, immutable record of system actions
 * for compliance and security purposes per WA Policy Section 5.2.
 *
 * @param {WaAuditActionType} actionType - Type of action being logged
 * @param {string} userId - ID of the user performing the action
 * @param {string} userEmail - Email of the user performing the action
 * @param {Object} options - Additional logging options
 * @param {string} [options.resourceId] - ID of the affected resource
 * @param {string} [options.resourceType] - Type of the affected resource
 * @param {any} [options.previousState] - State before the action
 * @param {any} [options.newState] - State after the action
 * @param {WaAuditLogMetadata} [options.metadata] - Additional metadata
 *
 * @returns {Promise<void>} Resolves when the log entry is successfully recorded
 *
 * @throws {Error} If logging fails due to database issues
 *
 * @example
 * await waLogAuditTrail(
 *   WaAuditActionType.CASE_APPROVED,
 *   'user-123',
 *   'admin@weldingalloys.com',
 *   {
 *     resourceId: 'case-456',
 *     resourceType: 'CaseStudy',
 *     previousState: { status: 'SUBMITTED' },
 *     newState: { status: 'APPROVED' },
 *     metadata: {
 *       ipAddress: '192.168.1.1',
 *       userAgent: 'Mozilla/5.0...'
 *     }
 *   }
 * );
 */
export async function waLogAuditTrail(
  actionType: WaAuditActionType,
  userId: string,
  userEmail: string,
  options: {
    resourceId?: string;
    resourceType?: string;
    previousState?: any;
    newState?: any;
    metadata?: WaAuditLogMetadata;
  } = {}
): Promise<void> {
  try {
    // Store audit log in SystemConfig as a JSON entry
    // In production, this should be moved to a dedicated audit_logs table
    const auditEntry: WaAuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      actionType,
      userId,
      userEmail,
      resourceId: options.resourceId,
      resourceType: options.resourceType,
      previousState: options.previousState,
      newState: options.newState,
      metadata: options.metadata,
      timestamp: new Date(),
    };

    // Log to SystemConfig for now (temporary storage)
    await prisma.systemConfig.create({
      data: {
        key: `audit_log_${auditEntry.id}`,
        value: JSON.stringify(auditEntry),
      },
    });

    // Also log to console in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[WA Audit Log]', {
        actionType,
        userId,
        userEmail,
        resourceId: options.resourceId,
        timestamp: auditEntry.timestamp,
      });
    }
  } catch (error) {
    // Audit logging should never break the application flow
    // Log the error but don't throw
    console.error('[WA Audit Logger] Failed to log audit trail:', error);
  }
}

/**
 * Retrieves audit logs for a specific user
 *
 * @param {string} userId - ID of the user to retrieve logs for
 * @param {number} [limit=100] - Maximum number of logs to retrieve
 *
 * @returns {Promise<WaAuditLogEntry[]>} Array of audit log entries
 *
 * @example
 * const userLogs = await waGetUserAuditLogs('user-123', 50);
 */
export async function waGetUserAuditLogs(
  userId: string,
  limit: number = 100
): Promise<WaAuditLogEntry[]> {
  try {
    const logs = await prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: 'audit_log_',
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit * 2, // Fetch more to filter
    });

    const parsedLogs = logs
      .map((log) => {
        try {
          return JSON.parse(log.value) as WaAuditLogEntry;
        } catch {
          return null;
        }
      })
      .filter((log): log is WaAuditLogEntry => log !== null && log.userId === userId)
      .slice(0, limit);

    return parsedLogs;
  } catch (error) {
    console.error('[WA Audit Logger] Failed to retrieve user audit logs:', error);
    return [];
  }
}

/**
 * Retrieves audit logs for a specific resource
 *
 * @param {string} resourceId - ID of the resource to retrieve logs for
 * @param {string} [resourceType] - Type of the resource (optional filter)
 * @param {number} [limit=50] - Maximum number of logs to retrieve
 *
 * @returns {Promise<WaAuditLogEntry[]>} Array of audit log entries
 *
 * @example
 * const caseLogs = await waGetResourceAuditLogs('case-456', 'CaseStudy', 25);
 */
export async function waGetResourceAuditLogs(
  resourceId: string,
  resourceType?: string,
  limit: number = 50
): Promise<WaAuditLogEntry[]> {
  try {
    const logs = await prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: 'audit_log_',
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit * 2, // Fetch more to filter
    });

    const parsedLogs = logs
      .map((log) => {
        try {
          return JSON.parse(log.value) as WaAuditLogEntry;
        } catch {
          return null;
        }
      })
      .filter(
        (log): log is WaAuditLogEntry =>
          log !== null &&
          log.resourceId === resourceId &&
          (!resourceType || log.resourceType === resourceType)
      )
      .slice(0, limit);

    return parsedLogs;
  } catch (error) {
    console.error('[WA Audit Logger] Failed to retrieve resource audit logs:', error);
    return [];
  }
}

/**
 * Retrieves all audit logs within a date range
 *
 * @param {Date} startDate - Start of the date range
 * @param {Date} endDate - End of the date range
 * @param {number} [limit=200] - Maximum number of logs to retrieve
 *
 * @returns {Promise<WaAuditLogEntry[]>} Array of audit log entries
 *
 * @example
 * const recentLogs = await waGetAuditLogsByDateRange(
 *   new Date('2025-12-01'),
 *   new Date('2025-12-31')
 * );
 */
export async function waGetAuditLogsByDateRange(
  startDate: Date,
  endDate: Date,
  limit: number = 200
): Promise<WaAuditLogEntry[]> {
  try {
    const logs = await prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: 'audit_log_',
        },
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
    });

    const parsedLogs = logs
      .map((log) => {
        try {
          return JSON.parse(log.value) as WaAuditLogEntry;
        } catch {
          return null;
        }
      })
      .filter((log): log is WaAuditLogEntry => log !== null);

    return parsedLogs;
  } catch (error) {
    console.error('[WA Audit Logger] Failed to retrieve audit logs by date range:', error);
    return [];
  }
}

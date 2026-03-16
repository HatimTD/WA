/**
 * Break-Glass Admin Module
 *
 * Implements emergency admin access per WA Software Development Policy Section 3.1.
 * Break-glass access provides emergency authentication when normal auth systems fail.
 *
 * Security Features:
 * - Environment variable controlled (disabled by default)
 * - Time-limited sessions (configurable, default 1 hour)
 * - Full audit logging of all actions
 * - Requires special cryptographic key
 * - Can only be enabled by system administrators
 *
 * @module break-glass-admin
 * @author WA Security Team
 * @version 1.0.0
 * @since 2025-12-10
 */

import * as crypto from 'crypto';
import { waLogAuditTrail, WaAuditActionType } from './wa-audit-logger';

/**
 * Break-glass session configuration
 */
export interface BreakGlassConfig {
  /** Whether break-glass is enabled (env: BREAK_GLASS_ENABLED) */
  enabled: boolean;
  /** The secret key for break-glass access (env: BREAK_GLASS_ADMIN_KEY) */
  secretKey: string | null;
  /** Session timeout in minutes (env: BREAK_GLASS_SESSION_TIMEOUT_MINUTES, default: 60) */
  sessionTimeoutMinutes: number;
  /** Email for break-glass admin (env: BREAK_GLASS_ADMIN_EMAIL) */
  adminEmail: string | null;
}

/**
 * Break-glass session data stored in JWT
 */
export interface BreakGlassSession {
  /** Session identifier */
  sessionId: string;
  /** Admin email */
  email: string;
  /** Session creation timestamp */
  createdAt: number;
  /** Session expiration timestamp */
  expiresAt: number;
  /** IP address of requester */
  ipAddress: string;
  /** Whether this is a break-glass session */
  isBreakGlass: true;
}

/**
 * Get break-glass configuration from environment variables
 */
export function waGetBreakGlassConfig(): BreakGlassConfig {
  return {
    enabled: process.env.BREAK_GLASS_ENABLED === 'true',
    secretKey: process.env.BREAK_GLASS_ADMIN_KEY || null,
    sessionTimeoutMinutes: parseInt(process.env.BREAK_GLASS_SESSION_TIMEOUT_MINUTES || '60', 10),
    adminEmail: process.env.BREAK_GLASS_ADMIN_EMAIL || null,
  };
}

/**
 * Validate break-glass access attempt
 *
 * @param providedKey - The key provided by the user
 * @param ipAddress - IP address of the requester
 * @param userAgent - User agent of the requester
 * @returns Object containing validation result and error message if failed
 */
export async function waValidateBreakGlassAccess(
  providedKey: string,
  ipAddress: string,
  userAgent: string
): Promise<{ valid: boolean; error?: string; session?: BreakGlassSession }> {
  const config = waGetBreakGlassConfig();

  // Check if break-glass is enabled
  if (!config.enabled) {
    await waLogBreakGlassAttempt('disabled', null, ipAddress, userAgent, false);
    return { valid: false, error: 'Break-glass access is not enabled' };
  }

  // Check if secret key is configured
  if (!config.secretKey) {
    await waLogBreakGlassAttempt('no_key_configured', null, ipAddress, userAgent, false);
    return { valid: false, error: 'Break-glass is not properly configured' };
  }

  // Check if admin email is configured
  if (!config.adminEmail) {
    await waLogBreakGlassAttempt('no_email_configured', null, ipAddress, userAgent, false);
    return { valid: false, error: 'Break-glass admin email is not configured' };
  }

  // Validate the provided key using constant-time comparison
  const isValidKey = crypto.timingSafeEqual(
    Buffer.from(providedKey),
    Buffer.from(config.secretKey)
  );

  if (!isValidKey) {
    await waLogBreakGlassAttempt('invalid_key', config.adminEmail, ipAddress, userAgent, false);
    return { valid: false, error: 'Invalid break-glass key' };
  }

  // Create break-glass session
  const now = Date.now();
  const sessionId = `bg-${crypto.randomBytes(16).toString('hex')}`;
  const session: BreakGlassSession = {
    sessionId,
    email: config.adminEmail,
    createdAt: now,
    expiresAt: now + (config.sessionTimeoutMinutes * 60 * 1000),
    ipAddress,
    isBreakGlass: true,
  };

  // Log successful break-glass access
  await waLogBreakGlassAttempt('success', config.adminEmail, ipAddress, userAgent, true, sessionId);

  return { valid: true, session };
}

/**
 * Log break-glass access attempt
 */
async function waLogBreakGlassAttempt(
  status: string,
  email: string | null,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  sessionId?: string
): Promise<void> {
  // Log to console for immediate visibility
  console.warn('[BREAK-GLASS ATTEMPT]', {
    status,
    email,
    ipAddress,
    userAgent: userAgent.substring(0, 100),
    success,
    sessionId,
    timestamp: new Date().toISOString(),
  });

  // Log to audit trail
  await waLogAuditTrail(
    success ? WaAuditActionType.LOGIN : WaAuditActionType.LOGIN_FAILED,
    sessionId || 'unknown',
    email || 'unknown',
    {
      resourceType: 'BreakGlassAccess',
      newState: {
        status,
        success,
        isBreakGlass: true,
      },
      metadata: {
        ipAddress,
        userAgent,
        additionalData: {
          breakGlassAttempt: true,
          sessionId,
        },
      },
    }
  );
}

/**
 * Validate if a break-glass session is still valid
 *
 * @param session - The break-glass session to validate
 * @returns Whether the session is valid
 */
export function waIsBreakGlassSessionValid(session: BreakGlassSession): boolean {
  if (!session.isBreakGlass) return false;
  if (Date.now() > session.expiresAt) return false;
  return true;
}

/**
 * Get remaining session time in minutes
 *
 * @param session - The break-glass session
 * @returns Remaining time in minutes, or 0 if expired
 */
export function waGetBreakGlassRemainingTime(session: BreakGlassSession): number {
  const remaining = session.expiresAt - Date.now();
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / 60000);
}

/**
 * Log break-glass action for audit trail
 *
 * @param session - The break-glass session
 * @param action - Description of the action performed
 * @param resourceId - ID of affected resource
 * @param resourceType - Type of affected resource
 */
export async function waLogBreakGlassAction(
  session: BreakGlassSession,
  action: string,
  resourceId?: string,
  resourceType?: string
): Promise<void> {
  console.warn('[BREAK-GLASS ACTION]', {
    sessionId: session.sessionId,
    email: session.email,
    action,
    resourceId,
    resourceType,
    timestamp: new Date().toISOString(),
  });

  await waLogAuditTrail(
    WaAuditActionType.SYSTEM_CONFIG_CHANGED,
    session.sessionId,
    session.email,
    {
      resourceId,
      resourceType,
      newState: {
        action,
        isBreakGlass: true,
        sessionId: session.sessionId,
      },
      metadata: {
        ipAddress: session.ipAddress,
        additionalData: {
          breakGlassSession: true,
          remainingTimeMinutes: waGetBreakGlassRemainingTime(session),
        },
      },
    }
  );
}

/**
 * Terminate a break-glass session
 *
 * @param session - The session to terminate
 * @param reason - Reason for termination
 */
export async function waTerminateBreakGlassSession(
  session: BreakGlassSession,
  reason: string
): Promise<void> {
  console.warn('[BREAK-GLASS SESSION TERMINATED]', {
    sessionId: session.sessionId,
    email: session.email,
    reason,
    timestamp: new Date().toISOString(),
  });

  await waLogAuditTrail(
    WaAuditActionType.LOGOUT,
    session.sessionId,
    session.email,
    {
      resourceType: 'BreakGlassSession',
      previousState: {
        active: true,
        sessionId: session.sessionId,
      },
      newState: {
        active: false,
        terminationReason: reason,
        isBreakGlass: true,
      },
      metadata: {
        ipAddress: session.ipAddress,
        additionalData: {
          breakGlassSession: true,
        },
      },
    }
  );
}

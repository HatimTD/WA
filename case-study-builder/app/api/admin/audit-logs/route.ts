/**
 * Admin Audit Logs API
 *
 * Provides access to immutable audit logs for administrators.
 * Implements WA Policy Section 5.2.
 *
 * GET - List audit logs with filtering
 * POST - Verify audit trail integrity
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getAuditLogsByUser,
  getAuditLogsByResource,
  getAuditLogsByActionType,
  verifyAuditTrailIntegrity,
  getAuditTrailStats,
  AuditActionType,
} from '@/lib/immutable-audit-logger';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/audit-logs
 * Lists audit logs with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const resourceId = searchParams.get('resourceId');
    const resourceType = searchParams.get('resourceType');
    const actionType = searchParams.get('actionType') as AuditActionType | null;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let logs;

    if (userId) {
      logs = await getAuditLogsByUser(userId, { limit, offset });
    } else if (resourceId) {
      logs = await getAuditLogsByResource(resourceId, resourceType || undefined, {
        limit,
        offset,
      });
    } else if (actionType) {
      logs = await getAuditLogsByActionType(actionType, { limit, offset });
    } else {
      // Get recent logs
      logs = await prisma.waAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    }

    return NextResponse.json({
      logs,
      pagination: {
        limit,
        offset,
        count: logs.length,
      },
    });
  } catch (error) {
    console.error('[Audit Logs API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve audit logs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/audit-logs
 * Verifies audit trail integrity or gets stats
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, fromDate, toDate, limit } = body;

    if (action === 'verify') {
      const result = await verifyAuditTrailIntegrity({
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
        limit: limit || 10000,
      });

      return NextResponse.json({
        action: 'verify',
        result,
        verifiedAt: new Date(),
      });
    }

    if (action === 'stats') {
      const stats = await getAuditTrailStats();
      return NextResponse.json({
        action: 'stats',
        stats,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "verify" or "stats"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Audit Logs API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

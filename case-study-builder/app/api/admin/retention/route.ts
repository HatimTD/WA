/**
 * Admin Data Retention API
 *
 * Manages data retention policies and cleanup operations.
 * Implements WA Policy Section 7.5.4.
 *
 * GET - List retention policies and stats
 * POST - Run retention cleanup or update policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getAllRetentionPolicies,
  getRetentionStats,
  updateRetentionPolicy,
  runRetentionCleanup,
  initializeRetentionPolicies,
} from '@/lib/data-retention';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/retention
 * Lists retention policies and statistics
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

    const [policies, stats] = await Promise.all([
      getAllRetentionPolicies(),
      getRetentionStats(),
    ]);

    return NextResponse.json({
      policies,
      stats,
    });
  } catch (error) {
    console.error('[Retention API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve retention data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/retention
 * Run cleanup or update policies
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

    // Handle both form data and JSON
    const contentType = request.headers.get('content-type') || '';
    let action = '';
    let dataType = '';
    let updates: Record<string, unknown> = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      action = formData.get('action')?.toString() || '';
      dataType = formData.get('dataType')?.toString() || '';
    } else {
      const body = await request.json().catch(() => ({}));
      action = body.action || '';
      dataType = body.dataType || '';
      updates = body.updates || {};
    }

    if (action === 'initialize') {
      const count = await initializeRetentionPolicies();
      return NextResponse.json({
        action: 'initialize',
        message: `Initialized ${count} retention policies`,
      });
    }

    if (action === 'cleanup') {
      const result = await runRetentionCleanup(session.user.id);
      return NextResponse.json({
        action: 'cleanup',
        result,
      });
    }

    if (action === 'update' && dataType && updates) {
      const updated = await updateRetentionPolicy(
        dataType,
        updates,
        session.user.id
      );
      return NextResponse.json({
        action: 'update',
        policy: updated,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "initialize", "cleanup", or "update"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Retention API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

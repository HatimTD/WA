/**
 * NetSuite Auto-Sync Cron API
 *
 * Vercel Cron job endpoint for automatic NetSuite customer sync.
 * Implements BRD 5.9.3 - NetSuite Auto-Sync.
 *
 * Schedule: Daily at 2:00 AM UTC (configured in vercel.json)
 *
 * @module api/cron/netsuite-sync
 * @author WA Development Team
 * @version 1.0.0
 * @since 2025-12-13
 */

import { NextRequest, NextResponse } from 'next/server';
import { runNetSuiteSync, getSyncStats } from '@/lib/integrations/netsuite-sync';

/**
 * Verify the request is from Vercel Cron
 */
function verifyCronRequest(request: NextRequest): boolean {
  // In production, verify the CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow in development without secret
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // In production, require the CRON_SECRET
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Also allow Vercel's internal cron requests
  const isVercelCron = request.headers.get('x-vercel-cron') === 'true';
  if (isVercelCron) {
    return true;
  }

  return false;
}

/**
 * POST /api/cron/netsuite-sync
 *
 * Triggered by Vercel Cron or manually for testing.
 */
export async function POST(request: NextRequest) {
  console.log('[NetSuite Cron] Sync triggered');

  // Verify request
  if (!verifyCronRequest(request)) {
    console.warn('[NetSuite Cron] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if NetSuite is configured
    if (!process.env.NETSUITE_ACCOUNT_ID) {
      console.log('[NetSuite Cron] NetSuite not configured, running with mock data');
    }

    // Run the sync
    const result = await runNetSuiteSync();

    console.log('[NetSuite Cron] Sync completed:', result);

    return NextResponse.json({
      ...result,
      message: result.success ? 'Sync completed successfully' : 'Sync completed with errors',
    });
  } catch (error) {
    console.error('[NetSuite Cron] Sync failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/netsuite-sync
 *
 * Get sync status and statistics.
 */
export async function GET(request: NextRequest) {
  // Allow status check without authentication
  try {
    const stats = await getSyncStats();

    return NextResponse.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    console.error('[NetSuite Cron] Error getting stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats',
      },
      { status: 500 }
    );
  }
}

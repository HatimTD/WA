/**
 * NetSuite Auto-Sync Cron API
 *
 * Vercel Cron job endpoint for automatic NetSuite data sync.
 * Implements BRD 5.9.3 - NetSuite Auto-Sync.
 *
 * Schedule: Daily at 10:00 PM UTC / 11:00 PM Paris (CET) (configured in vercel.json)
 *
 * Syncs:
 * - Customers: To Redis cache for fast search (~37k records)
 * - Employees: To WaNetsuiteEmployee table for user auto-population on login (~400 records)
 * - Items: To Redis cache for product search (~70k records)
 *
 * @module api/cron/netsuite-sync
 * @author WA Development Team
 * @version 1.2.0
 * @since 2025-12-13
 */

import { NextRequest, NextResponse } from 'next/server';
import { runNetSuiteSync, getSyncStats, waSyncNetSuiteEmployees, waSyncNetSuiteItems, waSyncNetSuiteSubsidiaries } from '@/lib/integrations/netsuite-sync';
import { waAutoAssignSubsidiaryFromNetSuite } from '@/lib/actions/waUserSubsidiaryActions';
import prisma from '@/lib/prisma';

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

    // Run customer sync
    console.log('[NetSuite Cron] Starting customer sync...');
    const customerResult = await runNetSuiteSync();
    console.log('[NetSuite Cron] Customer sync completed:', customerResult);

    // Run employee sync (for auto-population on login)
    console.log('[NetSuite Cron] Starting employee sync...');
    const employeeResult = await waSyncNetSuiteEmployees();
    console.log('[NetSuite Cron] Employee sync completed:', employeeResult);

    // Run items sync (refresh Redis cache)
    console.log('[NetSuite Cron] Starting items sync...');
    const itemsResult = await waSyncNetSuiteItems();
    console.log('[NetSuite Cron] Items sync completed:', itemsResult);

    // Run subsidiary sync (populate Subsidiary table for admin dropdown)
    console.log('[NetSuite Cron] Starting subsidiary sync...');
    const subsidiaryResult = await waSyncNetSuiteSubsidiaries();
    console.log('[NetSuite Cron] Subsidiary sync completed:', subsidiaryResult);

    // Re-assign subsidiaries for users who are missing them
    console.log('[NetSuite Cron] Checking for users missing subsidiary assignment...');
    let subsidiaryAssignCount = 0;
    try {
      // Find users with no subsidiary assigned
      const usersWithoutSub = await prisma.user.findMany({
        where: {
          userSubsidiaries: { none: {} },
          email: { not: undefined },
        },
        select: { id: true, email: true },
      });

      for (const user of usersWithoutSub) {
        if (!user.email) continue;
        const nsEmployee = await prisma.waNetsuiteEmployee.findUnique({
          where: { email: user.email.toLowerCase().trim() },
          select: { netsuiteInternalId: true, subsidiarynohierarchy: true },
        });
        if (nsEmployee?.netsuiteInternalId && nsEmployee?.subsidiarynohierarchy) {
          const result = await waAutoAssignSubsidiaryFromNetSuite(user.id, nsEmployee.netsuiteInternalId);
          if (result.success && result.subsidiary) {
            subsidiaryAssignCount++;
            console.log(`[NetSuite Cron] Auto-assigned subsidiary "${result.subsidiary.name}" to ${user.email}`);
          }
        }
      }
      console.log(`[NetSuite Cron] Subsidiary re-assignment: ${subsidiaryAssignCount} users fixed out of ${usersWithoutSub.length} missing`);
    } catch (assignError) {
      console.error('[NetSuite Cron] Subsidiary re-assignment failed:', assignError);
    }

    // Combine results
    const overallSuccess = customerResult.success && employeeResult.success && itemsResult.success && subsidiaryResult.success;

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess ? 'All syncs completed successfully' : 'Some syncs completed with errors',
      customers: {
        success: customerResult.success,
        totalRecords: customerResult.totalRecords,
        newRecords: customerResult.newRecords,
        updatedRecords: customerResult.updatedRecords,
        failedRecords: customerResult.failedRecords,
        error: customerResult.error,
      },
      employees: {
        success: employeeResult.success,
        totalEmployees: employeeResult.totalEmployees,
        newEmployees: employeeResult.newEmployees,
        updatedEmployees: employeeResult.updatedEmployees,
        error: employeeResult.error,
      },
      items: {
        success: itemsResult.success,
        totalItems: itemsResult.totalItems,
        error: itemsResult.error,
      },
      subsidiaries: {
        success: subsidiaryResult.success,
        totalSubsidiaries: subsidiaryResult.totalSubsidiaries,
        newSubsidiaries: subsidiaryResult.newSubsidiaries,
        updatedSubsidiaries: subsidiaryResult.updatedSubsidiaries,
        error: subsidiaryResult.error,
      },
      subsidiaryAssignments: {
        usersFixed: subsidiaryAssignCount,
      },
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

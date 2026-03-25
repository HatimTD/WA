import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { redisCache } from '@/lib/cache/redis-client';

/**
 * Clear NetSuite cache
 * POST /api/admin/netsuite/clear-cache
 *
 * Deletes all NetSuite cache keys from Redis.
 * Requires ADMIN role.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is ADMIN
    const { prisma } = await import('@/lib/prisma');
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden - ADMIN role required' }, { status: 403 });
    }

    if (!redisCache) {
      return NextResponse.json({
        success: false,
        error: 'Redis not configured'
      }, { status: 500 });
    }

    // Clear ALL NetSuite caches (customers, employees, subsidiaries, items)
    const { netsuiteClient } = await import('@/lib/integrations/netsuite');
    await netsuiteClient.clearCache();

    console.log('[Clear Cache] Cleared ALL NetSuite caches (customers, employees, subsidiaries, items)');

    return NextResponse.json({
      success: true,
      message: 'All NetSuite caches cleared. Next sync/search will fetch fresh data from NetSuite.',
    });
  } catch (error) {
    console.error('[Clear Cache] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cache',
    }, { status: 500 });
  }
}

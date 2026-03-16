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

    // Delete NetSuite customer cache (including all chunks)
    const baseKey = 'netsuite:customers:all';
    const keysToDelete = [baseKey];

    // Delete all chunks (try up to 20 chunks to be safe)
    for (let i = 0; i < 20; i++) {
      keysToDelete.push(`${baseKey}:chunk:${i}`);
    }

    let deletedCount = 0;
    for (const key of keysToDelete) {
      try {
        await redisCache.del(key);
        deletedCount++;
      } catch (err) {
        // Ignore errors for non-existent keys
      }
    }

    console.log(`[Clear Cache] Deleted ${deletedCount} NetSuite cache keys (including all chunks)`);

    return NextResponse.json({
      success: true,
      message: `Cleared ${deletedCount} cache keys. Next customer search will fetch fresh data from NetSuite.`,
      deletedKeys: deletedCount,
      note: 'Cleared base key + up to 20 chunks'
    });
  } catch (error) {
    console.error('[Clear Cache] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cache',
    }, { status: 500 });
  }
}

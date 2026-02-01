import { NextResponse } from 'next/server';
import { redisCache } from '@/lib/cache/redis-client';

export async function POST() {
  try {
    console.log('[Clear Cache] Clearing NetSuite customer cache from Redis...');

    // Clear the chunked cache
    const cacheKey = 'netsuite:customers:all';
    const deleted = await redisCache.delChunked(cacheKey);

    console.log(`[Clear Cache] Cleared cache from Redis`);

    return NextResponse.json({
      success: true,
      message: deleted ? 'NetSuite cache cleared successfully' : 'No cache found to clear',
      cleared: deleted,
    });
  } catch (error) {
    console.error('[Clear Cache] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear cache',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}

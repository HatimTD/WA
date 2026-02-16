/**
 * Next.js Instrumentation - Runs on server startup
 * Used to preload NetSuite cache in background
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Server] Initializing...');

    // Check if Redis cache already has data before triggering a preload.
    // This prevents every Vercel cold start from hitting the NetSuite API.
    const { redisCache } = await import('./lib/cache/redis-client');
    const existingCache = await redisCache.get<{ chunkCount: number }>('netsuite:customers:meta');

    if (existingCache) {
      console.log(`[Server] NetSuite cache already exists in Redis (${existingCache.chunkCount} chunks), skipping preload`);
    } else {
      const { netsuiteClient } = await import('./lib/integrations/netsuite');
      netsuiteClient.preloadCache().catch((error) => {
        console.error('[Server] Background cache preload failed:', error);
      });
      console.log('[Server] Background cache preload started');
    }

    console.log('[Server] Server is ready to accept requests');
  }
}

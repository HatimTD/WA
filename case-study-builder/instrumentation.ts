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

    // Always sync employees to DB (needed for login auto-assign).
    // This is lightweight (~418 records) and ensures the waNetsuiteEmployee
    // table is populated even if the daily cron hasn't run yet.
    const { waSyncNetSuiteEmployees } = await import('./lib/integrations/netsuite-sync');
    waSyncNetSuiteEmployees().then((result) => {
      if (result.success) {
        console.log(`[Server] Employee DB sync: ${result.totalEmployees} employees (${result.newEmployees} new, ${result.updatedEmployees} updated)`);
      } else {
        console.log(`[Server] Employee DB sync skipped: ${result.error || 'no data'}`);
      }
    }).catch((error) => {
      console.error('[Server] Employee DB sync failed:', error);
    });

    console.log('[Server] Server is ready to accept requests');
  }
}

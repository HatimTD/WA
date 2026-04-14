/**
 * Next.js Instrumentation - Runs on server startup
 * - Loads Sentry configuration for the active runtime
 * - Preloads NetSuite cache in background (nodejs runtime only)
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import type { Instrumentation } from 'next';

export async function register() {
  // Load Sentry for the active runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }

  // Only run NetSuite preload on server side
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

    // Wait 5 seconds before syncing to allow Neon DB to warm up on cold start.
    // Without this delay, the first few DB calls can fail with "Can't reach database server"
    // because Neon serverless suspends compute after inactivity.
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Sync employees then subsidiaries SEQUENTIALLY to avoid connection pool exhaustion.
    // Running in parallel caused "Timed out fetching a new connection from the connection pool"
    // because both loops compete for the 5-connection Prisma pool limit.
    const { waSyncNetSuiteEmployees, waSyncNetSuiteSubsidiaries } = await import('./lib/integrations/netsuite-sync');

    console.log('[Server] Server is ready to accept requests');

    // Run in background but sequentially — employee sync first, then subsidiary sync
    (async () => {
      try {
        const empResult = await waSyncNetSuiteEmployees();
        if (empResult.success) {
          console.log(`[Server] Employee DB sync: ${empResult.totalEmployees} employees (${empResult.newEmployees} new, ${empResult.updatedEmployees} updated)`);
        } else {
          console.log(`[Server] Employee DB sync skipped: ${empResult.error || 'no data'}`);
        }
      } catch (error) {
        console.error('[Server] Employee DB sync failed:', error);
      }

      try {
        const subResult = await waSyncNetSuiteSubsidiaries();
        if (subResult.success) {
          console.log(`[Server] Subsidiary DB sync: ${subResult.totalSubsidiaries} subsidiaries (${subResult.newSubsidiaries} new, ${subResult.updatedSubsidiaries} updated)`);
        } else {
          console.log(`[Server] Subsidiary DB sync skipped: ${subResult.error || 'no data'}`);
        }
      } catch (error) {
        console.error('[Server] Subsidiary DB sync failed:', error);
      }
    })();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(err, request, context);
};

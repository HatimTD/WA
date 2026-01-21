/**
 * Next.js Instrumentation - Runs on server startup
 * Used to preload NetSuite cache in background
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Server] Initializing...');

    // Import NetSuite client
    const { netsuiteClient } = await import('./lib/integrations/netsuite');

    // Start cache preload in background (non-blocking)
    // This runs asynchronously and doesn't block server startup
    netsuiteClient.preloadCache().catch((error) => {
      console.error('[Server] Background cache preload failed:', error);
    });

    console.log('[Server] Background cache preload started');
    console.log('[Server] Server is ready to accept requests');
  }
}

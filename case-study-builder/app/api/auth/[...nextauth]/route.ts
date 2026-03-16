import { handlers } from '@/auth';
import { NextRequest } from 'next/server';

// Allow more time for OAuth callback (Prisma cold start + DB operations)
export const maxDuration = 30;

// Wrap handlers to catch and log errors
export async function GET(request: NextRequest) {
  try {
    return await handlers.GET(request);
  } catch (error: any) {
    console.error('[AUTH ROUTE ERROR - GET]', {
      url: request.url,
      message: error?.message,
      cause: error?.cause?.message || error?.cause,
      stack: error?.stack?.substring(0, 500),
    });
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    return await handlers.POST(request);
  } catch (error: any) {
    console.error('[AUTH ROUTE ERROR - POST]', {
      url: request.url,
      message: error?.message,
      cause: error?.cause?.message || error?.cause,
      stack: error?.stack?.substring(0, 500),
    });
    throw error;
  }
}

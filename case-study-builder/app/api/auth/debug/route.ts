import { NextResponse } from 'next/server';

// Temporary debug endpoint - REMOVE before production handover
export async function GET() {
  return NextResponse.json({
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    googleClientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 10) || 'MISSING',
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    googleClientSecretPrefix: process.env.GOOGLE_CLIENT_SECRET?.substring(0, 10) || 'MISSING',
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'MISSING',
    hasAuthGoogleId: !!process.env.AUTH_GOOGLE_ID,
    hasAuthGoogleSecret: !!process.env.AUTH_GOOGLE_SECRET,
    nodeEnv: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL || 'NOT_VERCEL',
  });
}

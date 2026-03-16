import { NextResponse } from 'next/server';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';

// Temporary debug endpoint - REMOVE before production handover
export async function GET() {
  const baseAdapter = PrismaAdapter(prisma);
  const adapterMethods = Object.keys(baseAdapter);

  // Check what the spread produces
  const spread = { ...baseAdapter };
  const spreadMethods = Object.keys(spread);

  return NextResponse.json({
    envVars: {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      googleClientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 12) || 'MISSING',
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      googleSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'MISSING',
    },
    adapter: {
      originalMethods: adapterMethods,
      spreadMethods: spreadMethods,
      hasCreateUser: !!baseAdapter.createUser,
      hasGetUser: !!baseAdapter.getUser,
      hasGetUserByEmail: !!baseAdapter.getUserByEmail,
      hasGetUserByAccount: !!baseAdapter.getUserByAccount,
      hasLinkAccount: !!baseAdapter.linkAccount,
      hasCreateSession: !!baseAdapter.createSession,
      // Check if methods survive spread
      spreadHasCreateUser: !!spread.createUser,
      spreadHasGetUserByAccount: !!(spread as any).getUserByAccount,
      spreadHasLinkAccount: !!(spread as any).linkAccount,
    },
  });
}

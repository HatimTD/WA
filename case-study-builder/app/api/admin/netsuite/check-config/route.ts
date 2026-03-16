import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if NetSuite credentials are configured
    const config = {
      accountId: process.env.NETSUITE_ACCOUNT_ID || '',
      consumerKey: process.env.NETSUITE_CONSUMER_KEY || '',
      consumerSecret: process.env.NETSUITE_CONSUMER_SECRET || '',
      tokenId: process.env.NETSUITE_TOKEN_ID || '',
      tokenSecret: process.env.NETSUITE_TOKEN_SECRET || '',
      restletUrl: process.env.NETSUITE_RESTLET_URL || '',
    };

    const configured =
      !!config.accountId &&
      !!config.consumerKey &&
      !!config.consumerSecret &&
      !!config.tokenId &&
      !!config.tokenSecret;

    return NextResponse.json({
      configured,
      accountId: config.accountId || 'Not set',
      hasConsumerKey: !!config.consumerKey,
      hasConsumerSecret: !!config.consumerSecret,
      hasTokenId: !!config.tokenId,
      hasTokenSecret: !!config.tokenSecret,
      restletUrl: config.restletUrl || 'Not set',
    });
  } catch (error) {
    console.error('[API] Check NetSuite config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

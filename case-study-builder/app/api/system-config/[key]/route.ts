import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Await params in Next.js 16 - MUST await before accessing properties
    const resolvedParams = await context.params;
    const key = resolvedParams.key;

    if (!key) {
      return NextResponse.json({ error: 'Key parameter is required' }, { status: 400 });
    }

    const config = await prisma.waSystemConfig.findUnique({
      where: { key },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error('[System Config API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system config' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // Upsert system config
    const config = await prisma.waSystemConfig.upsert({
      where: { key },
      update: {
        value,
        updatedBy: session.user.id,
      },
      create: {
        key,
        value,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error('[System Config API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save system config' },
      { status: 500 }
    );
  }
}

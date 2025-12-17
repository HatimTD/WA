/**
 * Admin Master List API
 *
 * Manages master list items for dropdown options.
 * Implements Data Model V1.6 Master List structure.
 *
 * GET - List master list items (filterable by listKeyId or keyName)
 * POST - Create a new master list item
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/master-list
 * Lists master list items, optionally filtered by list key
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listKeyId = searchParams.get('listKeyId');
    const keyName = searchParams.get('keyName');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };

    if (listKeyId) {
      where.listKeyId = listKeyId;
    } else if (keyName) {
      where.listKey = { keyName };
    }

    const items = await prisma.waMasterList.findMany({
      where,
      include: { listKey: true },
      orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('[Master List API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve master list items' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/master-list
 * Creates a new master list item
 */
export async function POST(request: Request) {
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

    const body = await request.json();
    const { listKeyId, value, sortOrder, netsuiteInternalId } = body;

    if (!listKeyId || !value) {
      return NextResponse.json(
        { error: 'listKeyId and value are required' },
        { status: 400 }
      );
    }

    const item = await prisma.waMasterList.create({
      data: {
        listKeyId,
        value,
        sortOrder: sortOrder || 0,
        netsuiteInternalId,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('[Master List API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create master list item' },
      { status: 500 }
    );
  }
}

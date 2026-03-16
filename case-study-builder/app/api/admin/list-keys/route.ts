/**
 * Admin List Keys API
 *
 * Manages list key categories for master lists.
 * Implements Data Model V1.6 Master List structure.
 *
 * GET - List all list keys with item counts
 * POST - Create a new list key
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/list-keys
 * Lists all list keys with their master list item counts
 */
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

    const listKeys = await prisma.waListKey.findMany({
      include: {
        _count: {
          select: { masterListItems: true },
        },
      },
      orderBy: { keyName: 'asc' },
    });

    return NextResponse.json(listKeys);
  } catch (error) {
    console.error('[List Keys API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve list keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/list-keys
 * Creates a new list key category
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
    const { keyName, description } = body;

    if (!keyName) {
      return NextResponse.json({ error: 'keyName is required' }, { status: 400 });
    }

    const listKey = await prisma.waListKey.create({
      data: { keyName, description },
    });

    return NextResponse.json(listKey, { status: 201 });
  } catch (error) {
    console.error('[List Keys API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create list key' },
      { status: 500 }
    );
  }
}

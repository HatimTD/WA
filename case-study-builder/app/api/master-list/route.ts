/**
 * Public Master List API
 *
 * Fetches master list items for form dropdowns.
 * This endpoint is PUBLIC - no authentication required.
 * Master list items (Industries, Wear Types, etc.) are not sensitive data.
 *
 * GET - List master list items by keyName
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/master-list?keyName=Industry
 * GET /api/master-list?keyName=WearType
 * Returns active items for the specified list key
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyName = searchParams.get('keyName');

    if (!keyName) {
      // Return all list keys with their items
      const listKeys = await prisma.waListKey.findMany({
        include: {
          masterListItems: {
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
            select: {
              id: true,
              value: true,
              sortOrder: true,
            },
          },
        },
        orderBy: { keyName: 'asc' },
      });

      return NextResponse.json(listKeys, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    // Return items for specific key
    const items = await prisma.waMasterList.findMany({
      where: {
        isActive: true,
        listKey: { keyName },
      },
      orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
      select: {
        id: true,
        value: true,
        sortOrder: true,
      },
    });

    return NextResponse.json(items, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[Master List API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve master list items' },
      { status: 500 }
    );
  }
}

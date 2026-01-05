/**
 * Admin Master List Item API
 *
 * Manages individual master list items.
 * Implements Data Model V1.6 Master List structure.
 *
 * PATCH - Update a master list item
 * DELETE - Soft delete (deactivate) a master list item
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/admin/master-list/[id]
 * Updates a master list item
 */
export async function PATCH(request: Request, { params }: RouteParams) {
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

    const { id } = await params;
    const body = await request.json();
    const { value, sortOrder, isActive, netsuiteInternalId } = body;

    const item = await prisma.waMasterList.update({
      where: { id },
      data: {
        ...(value !== undefined && { value }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        ...(netsuiteInternalId !== undefined && { netsuiteInternalId }),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('[Master List API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update master list item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/master-list/[id]
 * Soft deletes a master list item by setting isActive to false
 */
export async function DELETE(request: Request, { params }: RouteParams) {
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

    const { id } = await params;

    // Soft delete by setting isActive to false
    await prisma.waMasterList.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Master List API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete master list item' },
      { status: 500 }
    );
  }
}

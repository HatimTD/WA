import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch user preferences
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        notificationPreferences: true,
        displayPreferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      notificationPreferences: user.notificationPreferences || {},
      displayPreferences: user.displayPreferences || {},
    });
  } catch (error) {
    console.error('[API] Get preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update user preferences
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationPreferences, displayPreferences } = body;

    // Build update data object
    const updateData: any = {};
    if (notificationPreferences !== undefined) {
      updateData.notificationPreferences = notificationPreferences;
    }
    if (displayPreferences !== undefined) {
      updateData.displayPreferences = displayPreferences;
    }

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        notificationPreferences: true,
        displayPreferences: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[API] Update preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Dev-only endpoint to switch user roles for testing
 * IMPORTANT: This should only be available in development mode
 */
export async function PUT(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !['VIEWER', 'CONTRIBUTOR', 'APPROVER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be VIEWER, CONTRIBUTOR, APPROVER, or ADMIN' },
        { status: 400 }
      );
    }

    // Update user role
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role },
    });

    console.log(`[DEV] User ${session.user.email} switched role to ${role}`);

    return NextResponse.json({
      success: true,
      message: `Role switched to ${role}`,
      role,
    });
  } catch (error) {
    console.error('[API] Dev role switch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

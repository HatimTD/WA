import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is ADMIN
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - ADMIN role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role } = body;

    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!role || !['CONTRIBUTOR', 'APPROVER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be CONTRIBUTOR, APPROVER, or ADMIN' },
        { status: 400 }
      );
    }

    // Prevent admin from changing their own role
    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot change your own role' },
        { status: 400 }
      );
    }

    // Update user role
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    console.error('[API] Update user role error:', error);

    // Handle user not found
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

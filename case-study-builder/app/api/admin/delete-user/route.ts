import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createImmutableAuditLog, AuditActionType } from '@/lib/immutable-audit-logger';

export async function DELETE(request: NextRequest) {
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
    const { userId } = body;

    // Validate input
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Look up the user being deleted so we can log their email
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true },
    });

    // Soft delete: deactivate user instead of hard delete
    // Preserves case study relationships (foreign key constraints)
    // Anonymizes name and email to comply with data privacy
    const inactiveCount = await prisma.user.count({ where: { status: 'INACTIVE' } });
    const anonymizedName = `Inactive User ${inactiveCount + 1}`;

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'INACTIVE',
        name: anonymizedName,
        email: `inactive-${userId}@deactivated.local`,
        image: null,
      },
    });

    // Remove subsidiary assignments and role assignments
    await prisma.waUserSubsidiary.deleteMany({ where: { userId } });
    await prisma.waUserRole.deleteMany({ where: { userId } });

    // Remove auth accounts so the user cannot log in
    await prisma.account.deleteMany({ where: { userId } });

    // Audit log — must never block deletion response
    try {
      await createImmutableAuditLog({
        actionType: AuditActionType.USER_DELETED,
        userId: session.user.id,
        userEmail: session.user.email || '',
        resourceId: userId,
        resourceType: 'User',
        metadata: { additionalData: { deletedEmail: targetUser?.email, deletedRole: targetUser?.role } },
      });
    } catch {
      // Audit logging must never block the main action
    }

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('[API] Delete user error:', error);

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

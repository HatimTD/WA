import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * POST /api/admin/create-user
 * Creates a new user (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, roles, region } = body;

    // Validate required fields
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'A user with this email already exists' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['VIEWER', 'CONTRIBUTOR', 'APPROVER', 'ADMIN', 'IT_DEPARTMENT', 'MARKETING'];
    const primaryRole = role || 'CONTRIBUTOR';
    if (!validRoles.includes(primaryRole)) {
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
    }

    // Validate password if provided
    if (password && password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        name: name?.trim() || null,
        email: email.toLowerCase().trim(),
        role: primaryRole as any,
        region: region?.trim() || null,
        status: 'ACTIVE',
        emailVerified: password ? new Date() : null, // Mark as verified if using password
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        region: true,
        totalPoints: true,
        createdAt: true,
      },
    });

    // If password provided, create a credentials account
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.account.create({
        data: {
          userId: newUser.id,
          type: 'credentials',
          provider: 'credentials',
          providerAccountId: newUser.id, // Use user ID as provider account ID
          access_token: hashedPassword, // Store hashed password in access_token field
        },
      });
    }

    // If multiple roles provided, create WaUserRole entries
    if (roles && Array.isArray(roles) && roles.length > 0) {
      const validatedRoles = roles.filter(r => validRoles.includes(r));
      if (validatedRoles.length > 0) {
        await prisma.waUserRole.createMany({
          data: validatedRoles.map(r => ({
            userId: newUser.id,
            role: r as any,
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        ...newUser,
        roles: roles || [primaryRole],
        caseCount: 0,
        createdAt: newUser.createdAt.toISOString(),
      },
      hasPassword: !!password,
    });
  } catch (error) {
    console.error('[API] Create user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

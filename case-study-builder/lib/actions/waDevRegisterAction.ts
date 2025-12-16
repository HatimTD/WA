'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { Role } from '@prisma/client';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: Role;
  region?: string;
}

export async function waDevRegister(data: RegisterData) {
  // Available in production for testing
  try {
    const { email, password, name, role, region } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: 'User with this email already exists' };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        region: region || 'Global',
        emailVerified: new Date(), // Mark as verified for testing
      },
    });

    // Create credentials account for the user
    await prisma.account.create({
      data: {
        userId: user.id,
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: email,
        // Store hashed password in access_token field (as per existing pattern)
        access_token: hashedPassword,
      },
    });

    return {
      success: true,
      message: `User ${email} created successfully with role ${role}`
    };
  } catch (error: any) {
    console.error('Dev register error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create user'
    };
  }
}

export async function waListTestUsers() {
  // Function to list all test users (for debugging/testing)
  try {
    const users = await prisma.user.findMany({
      where: {
        accounts: {
          some: {
            provider: 'credentials',
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        region: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, users };
  } catch (error) {
    console.error('List users error:', error);
    return { success: false, error: 'Failed to list users' };
  }
}
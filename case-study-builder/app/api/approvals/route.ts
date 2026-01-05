import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

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

    // Only Approvers and Admins can access this
    if (user?.role !== 'APPROVER' && user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch pending cases
    const pendingCases = await prisma.waCaseStudy.findMany({
      where: {
        status: 'SUBMITTED',
      },
      include: {
        contributor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    // Get unique contributors for filter dropdown
    const contributors = await prisma.user.findMany({
      where: {
        caseStudies: {
          some: {
            status: 'SUBMITTED',
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Fetch recently reviewed by this user
    const recentlyReviewed = await prisma.waCaseStudy.findMany({
      where: {
        status: {
          in: ['APPROVED', 'REJECTED'],
        },
        approverId: session.user.id,
      },
      include: {
        contributor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        approvedAt: 'desc',
      },
      take: 5,
    });

    // Calculate stats
    const stats = {
      pending: pendingCases.length,
      totalPending: pendingCases.length,
      approvedByMe: await prisma.waCaseStudy.count({
        where: {
          status: 'APPROVED',
          approverId: session.user.id,
        },
      }),
      rejectedByMe: await prisma.waCaseStudy.count({
        where: {
          status: 'REJECTED',
          approverId: session.user.id,
        },
      }),
    };

    return NextResponse.json({
      pendingCases,
      contributors,
      recentlyReviewed,
      stats,
    });
  } catch (error) {
    console.error('Error fetching approvals data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

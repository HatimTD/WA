import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch user's saved cases
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const savedCases = await prisma.waSavedCase.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        caseStudy: {
          select: {
            id: true,
            customerName: true,
            industry: true,
            location: true,
            componentWorkpiece: true,
            type: true,
            waProduct: true,
            problemDescription: true,
            status: true,
            approvedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ savedCases });
  } catch (error) {
    console.error('[API] Get saved cases error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save a case study
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { caseStudyId } = body;

    if (!caseStudyId) {
      return NextResponse.json(
        { error: 'Case study ID is required' },
        { status: 400 }
      );
    }

    // Check if case study exists and is approved
    const caseStudy = await prisma.waCaseStudy.findUnique({
      where: { id: caseStudyId },
      select: { id: true, status: true },
    });

    if (!caseStudy) {
      return NextResponse.json(
        { error: 'Case study not found' },
        { status: 404 }
      );
    }

    if (caseStudy.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Only approved case studies can be saved' },
        { status: 400 }
      );
    }

    // Check if already saved
    const existingSave = await prisma.waSavedCase.findUnique({
      where: {
        userId_caseStudyId: {
          userId: session.user.id,
          caseStudyId,
        },
      },
    });

    if (existingSave) {
      return NextResponse.json(
        { error: 'Case study already saved' },
        { status: 400 }
      );
    }

    // Create saved case
    const savedCase = await prisma.waSavedCase.create({
      data: {
        userId: session.user.id,
        caseStudyId,
      },
    });

    return NextResponse.json(
      { message: 'Case study saved successfully', savedCase },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Save case error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Unsave a case study
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const caseStudyId = searchParams.get('caseStudyId');

    if (!caseStudyId) {
      return NextResponse.json(
        { error: 'Case study ID is required' },
        { status: 400 }
      );
    }

    // Delete the saved case
    await prisma.waSavedCase.deleteMany({
      where: {
        userId: session.user.id,
        caseStudyId,
      },
    });

    return NextResponse.json(
      { message: 'Case study unsaved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Unsave case error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

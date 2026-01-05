import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId, type } = await request.json();

    if (!commentId || !type) {
      return NextResponse.json({ success: false, error: 'Missing commentId or type' }, { status: 400 });
    }

    // Check if user already reacted with this type
    const existingReaction = await prisma.waCommentReaction.findUnique({
      where: {
        commentId_userId_type: {
          commentId,
          userId: session.user.id,
          type,
        },
      },
    });

    if (existingReaction) {
      // Remove the reaction (toggle off)
      await prisma.waCommentReaction.delete({
        where: { id: existingReaction.id },
      });

      return NextResponse.json({ success: true, added: false });
    } else {
      // Add the reaction
      await prisma.waCommentReaction.create({
        data: {
          commentId,
          userId: session.user.id,
          type,
        },
      });

      return NextResponse.json({ success: true, added: true });
    }
  } catch (error) {
    console.error('[API Comments React] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process reaction' },
      { status: 500 }
    );
  }
}

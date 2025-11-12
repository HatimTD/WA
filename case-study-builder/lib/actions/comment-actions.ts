'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function getComments(caseStudyId: string) {
  try {
    const comments = await prisma.comment.findMany({
      where: { caseStudyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        reactions: {
          select: {
            id: true,
            userId: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, comments };
  } catch (error) {
    console.error('[Comment Actions] Error fetching comments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch comments',
      comments: [],
    };
  }
}

export async function createComment(caseStudyId: string, content: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!content || content.trim().length === 0) {
      return { success: false, error: 'Comment cannot be empty' };
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        caseStudyId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    revalidatePath(`/dashboard/cases/${caseStudyId}`);

    return { success: true, comment };
  } catch (error) {
    console.error('[Comment Actions] Error creating comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create comment',
    };
  }
}

export async function likeComment(commentId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        likes: {
          increment: 1,
        },
      },
    });

    revalidatePath(`/dashboard/cases/${comment.caseStudyId}`);

    return { success: true, comment };
  } catch (error) {
    console.error('[Comment Actions] Error liking comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to like comment',
    };
  }
}

export async function deleteComment(commentId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user owns the comment or is an approver
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: true,
      },
    });

    if (!comment) {
      return { success: false, error: 'Comment not found' };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Only allow deletion if user owns the comment or is an APPROVER
    if (comment.userId !== session.user.id && user.role !== 'APPROVER') {
      return { success: false, error: 'Not authorized to delete this comment' };
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    revalidatePath(`/dashboard/cases/${comment.caseStudyId}`);

    return { success: true };
  } catch (error) {
    console.error('[Comment Actions] Error deleting comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete comment',
    };
  }
}

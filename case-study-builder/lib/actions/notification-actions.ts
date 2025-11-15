'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { NotificationType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { sendEmailNotification } from '@/lib/email';

/**
 * Create a new notification for a user
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  emailMetadata,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  emailMetadata?: {
    caseTitle?: string;
    rejectionReason?: string;
    commenterName?: string;
    commentPreview?: string;
    milestone?: string;
    currentCount?: string;
    targetCount?: string;
    badgeName?: string;
    badgeDescription?: string;
  };
}) {
  try {
    // Check user's notification preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        notificationPreferences: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const prefs = user.notificationPreferences as any || {};

    // In-app notification handling
    let notification = null;
    const inAppEnabled = prefs.inAppNotifications !== false;

    if (inAppEnabled) {
      // Check individual notification type preferences for in-app
      const inAppTypePreferenceMap = {
        CASE_APPROVED: 'inAppCaseApproval',
        CASE_REJECTED: 'inAppCaseRejection',
        NEW_COMMENT: 'inAppNewComment',
        BHAG_MILESTONE: 'inAppBhagMilestones',
        BADGE_EARNED: 'inAppCaseApproval', // Badge earned uses same as case approval
      };

      const inAppPreferenceKey = inAppTypePreferenceMap[type as keyof typeof inAppTypePreferenceMap];
      const shouldCreateInApp = !inAppPreferenceKey || prefs[inAppPreferenceKey] !== false;

      if (shouldCreateInApp) {
        notification = await prisma.notification.create({
          data: {
            userId,
            type,
            title,
            message,
            link,
          },
        });
      }
    }

    // Email notification handling
    const emailEnabled = prefs.emailNotifications === true;

    if (emailEnabled && user.email) {
      // Check individual notification type preferences for email
      const emailTypePreferenceMap = {
        CASE_APPROVED: 'caseApprovalNotif',
        CASE_REJECTED: 'caseRejectionNotif',
        NEW_COMMENT: 'newCommentNotif',
        BHAG_MILESTONE: 'bhagMilestones',
        BADGE_EARNED: 'caseApprovalNotif', // Badge earned uses same as case approval
      };

      const emailPreferenceKey = emailTypePreferenceMap[type as keyof typeof emailTypePreferenceMap];
      const shouldSendEmail = !emailPreferenceKey || prefs[emailPreferenceKey] !== false;

      if (shouldSendEmail) {
        // Send email notification asynchronously (don't wait for it)
        sendEmailNotification({
          to: user.email,
          userName: user.name || 'User',
          type,
          title,
          message,
          link: link ? `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${link}` : undefined,
          metadata: emailMetadata,
        }).catch((error) => {
          console.error('[Notification Actions] Email send failed:', error);
        });
      }
    }

    revalidatePath('/dashboard');
    return { success: true, notification };
  } catch (error) {
    console.error('[Notification Actions] Error creating notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create notification',
    };
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      data: {
        read: true,
      },
    });

    revalidatePath('/dashboard');
    return { success: true, notification };
  } catch (error) {
    console.error('[Notification Actions] Error marking notification as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update notification',
    };
  }
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllNotificationsAsRead() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Notification Actions] Error marking all as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update notifications',
    };
  }
}

/**
 * Get unread notification count for current user
 */
export async function getUnreadNotificationCount() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return 0;
    }

    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    });

    return count;
  } catch (error) {
    console.error('[Notification Actions] Error getting unread count:', error);
    return 0;
  }
}

/**
 * Get recent notifications for current user
 */
export async function getRecentNotifications(limit = 10) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return notifications;
  } catch (error) {
    console.error('[Notification Actions] Error fetching notifications:', error);
    return [];
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('[Notification Actions] Error deleting notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete notification',
    };
  }
}

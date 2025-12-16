'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { EmailTemplateType } from '@prisma/client';

/**
 * Verify admin access
 */
async function verifyAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }

  return session.user.id;
}

// ============================================================================
// MAINTENANCE MODE
// ============================================================================

/**
 * Toggle maintenance mode
 */
export async function waToggleMaintenanceMode(enabled: boolean) {
  try {
    await verifyAdmin();

    await prisma.systemConfig.upsert({
      where: { key: 'maintenance_mode' },
      update: { value: enabled ? 'true' : 'false' },
      create: {
        key: 'maintenance_mode',
        value: enabled ? 'true' : 'false',
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[System Settings] Error toggling maintenance mode:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle maintenance mode',
    };
  }
}

/**
 * Update maintenance message
 */
export async function waUpdateMaintenanceMessage(message: string) {
  try {
    await verifyAdmin();

    await prisma.systemConfig.upsert({
      where: { key: 'maintenance_message' },
      update: { value: message },
      create: {
        key: 'maintenance_message',
        value: message,
      },
    });

    revalidatePath('/maintenance');
    return { success: true };
  } catch (error) {
    console.error('[System Settings] Error updating maintenance message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update maintenance message',
    };
  }
}

/**
 * Get maintenance mode status
 */
export async function waGetMaintenanceMode() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'maintenance_mode' },
    });

    const messageConfig = await prisma.systemConfig.findUnique({
      where: { key: 'maintenance_message' },
    });

    return {
      enabled: config?.value === 'true',
      message:
        messageConfig?.value ||
        'We are currently performing scheduled maintenance to improve your experience.',
    };
  } catch (error) {
    console.error('[System Settings] Error getting maintenance mode:', error);
    return {
      enabled: false,
      message: 'We are currently performing scheduled maintenance.',
    };
  }
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Get all email templates
 */
export async function waGetEmailTemplates() {
  try {
    await verifyAdmin();

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { type: 'asc' },
    });

    return { success: true, templates };
  } catch (error) {
    console.error('[System Settings] Error getting email templates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get email templates',
      templates: [],
    };
  }
}

/**
 * Get single email template by type
 */
export async function getEmailTemplate(type: EmailTemplateType) {
  try {
    await verifyAdmin();

    const template = await prisma.emailTemplate.findUnique({
      where: { type },
    });

    return { success: true, template };
  } catch (error) {
    console.error('[System Settings] Error getting email template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get email template',
      template: null,
    };
  }
}

/**
 * Create or update email template
 */
export async function upsertEmailTemplate({
  type,
  name,
  subject,
  htmlContent,
  textContent,
  logoUrl,
  variables,
  isActive,
}: {
  type: EmailTemplateType;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  logoUrl?: string;
  variables: string[];
  isActive: boolean;
}) {
  try {
    await verifyAdmin();

    const template = await prisma.emailTemplate.upsert({
      where: { type },
      update: {
        name,
        subject,
        htmlContent,
        textContent,
        logoUrl,
        variables,
        isActive,
      },
      create: {
        type,
        name,
        subject,
        htmlContent,
        textContent,
        logoUrl,
        variables,
        isActive,
      },
    });

    revalidatePath('/dashboard/system-settings');
    return { success: true, template };
  } catch (error) {
    console.error('[System Settings] Error upserting email template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save email template',
    };
  }
}

/**
 * Delete email template
 */
export async function waDeleteEmailTemplate(type: EmailTemplateType) {
  try {
    await verifyAdmin();

    await prisma.emailTemplate.delete({
      where: { type },
    });

    revalidatePath('/dashboard/system-settings');
    return { success: true };
  } catch (error) {
    console.error('[System Settings] Error deleting email template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete email template',
    };
  }
}

/**
 * Initialize default email templates
 */
export async function initializeDefaultTemplates() {
  try {
    await verifyAdmin();

    const defaultTemplates = [
      {
        type: 'CASE_APPROVED' as EmailTemplateType,
        name: 'Case Approved',
        subject: 'Your Case Study Has Been Approved!',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            {{#if logoUrl}}
            <img src="{{logoUrl}}" alt="Logo" style="max-width: 200px; margin-bottom: 20px;">
            {{/if}}
            <h1 style="color: #10b981;">Congratulations, {{userName}}!</h1>
            <p>Your case study "<strong>{{caseTitle}}</strong>" has been approved and published.</p>
            <p>Thank you for your valuable contribution to our knowledge base.</p>
            <a href="{{link}}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Case Study</a>
          </div>
        `,
        textContent: 'Congratulations {{userName}}! Your case study "{{caseTitle}}" has been approved.',
        variables: ['userName', 'caseTitle', 'link', 'logoUrl'],
        isActive: true,
      },
      {
        type: 'CASE_REJECTED' as EmailTemplateType,
        name: 'Case Rejected',
        subject: 'Case Study Requires Revision',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            {{#if logoUrl}}
            <img src="{{logoUrl}}" alt="Logo" style="max-width: 200px; margin-bottom: 20px;">
            {{/if}}
            <h1 style="color: #ef4444;">Revision Needed</h1>
            <p>Hello {{userName}},</p>
            <p>Your case study "<strong>{{caseTitle}}</strong>" requires some revisions before it can be published.</p>
            <div style="background-color: #fee2e2; padding: 16px; border-radius: 6px; margin: 16px 0;">
              <p style="margin: 0;"><strong>Reason:</strong> {{rejectionReason}}</p>
            </div>
            <p>Please review the feedback and resubmit your case study.</p>
            <a href="{{link}}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">Edit Case Study</a>
          </div>
        `,
        textContent: 'Hello {{userName}}, your case study "{{caseTitle}}" requires revision: {{rejectionReason}}',
        variables: ['userName', 'caseTitle', 'rejectionReason', 'link', 'logoUrl'],
        isActive: true,
      },
      {
        type: 'NEW_COMMENT' as EmailTemplateType,
        name: 'New Comment',
        subject: 'New Comment on Your Case Study',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            {{#if logoUrl}}
            <img src="{{logoUrl}}" alt="Logo" style="max-width: 200px; margin-bottom: 20px;">
            {{/if}}
            <h1 style="color: #3b82f6;">New Comment</h1>
            <p>Hello {{userName}},</p>
            <p><strong>{{commenterName}}</strong> commented on your case study "<strong>{{caseTitle}}</strong>".</p>
            <div style="background-color: #eff6ff; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #3b82f6;">
              <p style="margin: 0;">{{commentPreview}}</p>
            </div>
            <a href="{{link}}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Comment</a>
          </div>
        `,
        textContent: '{{commenterName}} commented on your case study "{{caseTitle}}": {{commentPreview}}',
        variables: ['userName', 'caseTitle', 'commenterName', 'commentPreview', 'link', 'logoUrl'],
        isActive: true,
      },
      {
        type: 'BADGE_EARNED' as EmailTemplateType,
        name: 'Badge Earned',
        subject: 'Achievement Unlocked: New Badge!',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
            {{#if logoUrl}}
            <img src="{{logoUrl}}" alt="Logo" style="max-width: 200px; margin-bottom: 20px;">
            {{/if}}
            <h1 style="color: #f59e0b;">🎉 Achievement Unlocked!</h1>
            <p style="font-size: 18px;">Congratulations {{userName}}!</p>
            <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 32px; border-radius: 12px; margin: 24px 0;">
              <p style="font-size: 24px; font-weight: bold; color: white; margin: 0;">{{badgeName}}</p>
            </div>
            <p>{{badgeDescription}}</p>
            <a href="{{link}}" style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Profile</a>
          </div>
        `,
        textContent: 'Congratulations {{userName}}! You earned the {{badgeName}} badge.',
        variables: ['userName', 'badgeName', 'badgeDescription', 'link', 'logoUrl'],
        isActive: true,
      },
      {
        type: 'BHAG_MILESTONE' as EmailTemplateType,
        name: 'BHAG Milestone',
        subject: 'BHAG Milestone Reached!',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            {{#if logoUrl}}
            <img src="{{logoUrl}}" alt="Logo" style="max-width: 200px; margin-bottom: 20px;">
            {{/if}}
            <h1 style="color: #8b5cf6;">🎯 Milestone Achieved!</h1>
            <p>Hello {{userName}},</p>
            <p>Great progress on the BHAG goal "<strong>{{milestone}}</strong>"!</p>
            <div style="background-color: #f3e8ff; padding: 16px; border-radius: 6px; margin: 16px 0;">
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #8b5cf6;">{{currentCount}} / {{targetCount}}</p>
            </div>
            <p>Keep up the excellent work!</p>
            <a href="{{link}}" style="display: inline-block; padding: 12px 24px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Progress</a>
          </div>
        `,
        textContent: 'Milestone achieved for {{milestone}}: {{currentCount}}/{{targetCount}}',
        variables: ['userName', 'milestone', 'currentCount', 'targetCount', 'link', 'logoUrl'],
        isActive: true,
      },
    ];

    for (const template of defaultTemplates) {
      await prisma.emailTemplate.upsert({
        where: { type: template.type },
        update: template,
        create: template,
      });
    }

    revalidatePath('/dashboard/system-settings');
    return { success: true };
  } catch (error) {
    console.error('[System Settings] Error initializing templates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize templates',
    };
  }
}

// ============================================================================
// GLOBAL NOTIFICATION MANAGEMENT
// ============================================================================

/**
 * Get global notification statistics
 */
export async function getNotificationStats() {
  try {
    await verifyAdmin();

    const totalUsers = await prisma.user.count();
    const totalNotifications = await prisma.notification.count();
    const unreadNotifications = await prisma.notification.count({
      where: { read: false },
    });

    // Count users with email notifications enabled
    // Note: Using findMany with select to avoid Prisma null query limitations
    const users = await prisma.user.findMany({
      select: { email: true },
    });
    const usersWithEmail = users.filter((u) => u.email !== null).length;

    return {
      success: true,
      stats: {
        totalUsers,
        totalNotifications,
        unreadNotifications,
        usersWithEmail,
      },
    };
  } catch (error) {
    console.error('[System Settings] Error getting notification stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get notification stats',
      stats: {
        totalUsers: 0,
        totalNotifications: 0,
        unreadNotifications: 0,
        usersWithEmail: 0,
      },
    };
  }
}

/**
 * Disable notifications for all users
 */
export async function disableGlobalNotifications(type: 'email' | 'inApp' | 'all') {
  try {
    await verifyAdmin();

    const users = await prisma.user.findMany({
      select: { id: true, notificationPreferences: true },
    });

    for (const user of users) {
      const prefs = (user.notificationPreferences as any) || {};

      if (type === 'email' || type === 'all') {
        prefs.emailNotifications = false;
        prefs.caseApprovalNotif = false;
        prefs.caseRejectionNotif = false;
        prefs.newCommentNotif = false;
        prefs.bhagMilestones = false;
      }

      if (type === 'inApp' || type === 'all') {
        prefs.inAppNotifications = false;
        prefs.inAppCaseApproval = false;
        prefs.inAppCaseRejection = false;
        prefs.inAppNewComment = false;
        prefs.inAppBhagMilestones = false;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { notificationPreferences: prefs },
      });
    }

    revalidatePath('/dashboard/system-settings');
    return { success: true };
  } catch (error) {
    console.error('[System Settings] Error disabling notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disable notifications',
    };
  }
}

/**
 * Enable notifications for all users
 */
export async function enableGlobalNotifications(type: 'email' | 'inApp' | 'all') {
  try {
    await verifyAdmin();

    const users = await prisma.user.findMany({
      select: { id: true, notificationPreferences: true },
    });

    for (const user of users) {
      const prefs = (user.notificationPreferences as any) || {};

      if (type === 'email' || type === 'all') {
        prefs.emailNotifications = true;
        prefs.caseApprovalNotif = true;
        prefs.caseRejectionNotif = true;
        prefs.newCommentNotif = true;
        prefs.bhagMilestones = true;
      }

      if (type === 'inApp' || type === 'all') {
        prefs.inAppNotifications = true;
        prefs.inAppCaseApproval = true;
        prefs.inAppCaseRejection = true;
        prefs.inAppNewComment = true;
        prefs.inAppBhagMilestones = true;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { notificationPreferences: prefs },
      });
    }

    revalidatePath('/dashboard/system-settings');
    return { success: true };
  } catch (error) {
    console.error('[System Settings] Error enabling notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enable notifications',
    };
  }
}

/**
 * Toggle specific notification type for all users
 */
export async function toggleSpecificNotification(notificationType: string, enable: boolean) {
  try {
    await verifyAdmin();

    const users = await prisma.user.findMany({
      select: { id: true, notificationPreferences: true },
    });

    for (const user of users) {
      const prefs = (user.notificationPreferences as any) || {};

      // Update the specific notification type
      prefs[notificationType] = enable;

      await prisma.user.update({
        where: { id: user.id },
        data: { notificationPreferences: prefs },
      });
    }

    revalidatePath('/dashboard/system-settings');
    return { success: true };
  } catch (error) {
    console.error('[System Settings] Error toggling specific notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle notification',
    };
  }
}

// ============================================================================
// ANNOUNCEMENT BANNER
// ============================================================================

/**
 * Get announcement banner
 */
export async function waGetAnnouncement() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'announcement' },
    });

    if (!config) {
      return {
        enabled: false,
        title: '',
        message: '',
        type: 'info',
      };
    }

    const announcement = JSON.parse(config.value);
    return announcement;
  } catch (error) {
    console.error('[System Settings] Error getting announcement:', error);
    return {
      enabled: false,
      title: '',
      message: '',
      type: 'info',
    };
  }
}

/**
 * Update announcement banner
 */
export async function waUpdateAnnouncement({
  enabled,
  title,
  message,
  type,
}: {
  enabled: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}) {
  try {
    await verifyAdmin();

    const announcement = {
      enabled,
      title,
      message,
      type,
    };

    await prisma.systemConfig.upsert({
      where: { key: 'announcement' },
      update: { value: JSON.stringify(announcement) },
      create: {
        key: 'announcement',
        value: JSON.stringify(announcement),
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('[System Settings] Error updating announcement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update announcement',
    };
  }
}

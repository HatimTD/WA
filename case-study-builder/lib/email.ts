import { Resend } from 'resend';
import { NotificationType } from '@prisma/client';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Case Study Builder <onboarding@resend.dev>';

/**
 * Email template for case approval notification
 */
function getCaseApprovedEmailHtml(userName: string, caseTitle: string, link: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #10b981; margin-top: 0;">✅ Case Study Approved!</h2>
          <p>Hi ${userName},</p>
          <p>Great news! Your case study <strong>"${caseTitle}"</strong> has been approved and is now published.</p>
          <p style="margin: 30px 0;">
            <a href="${link}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Case Study</a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            Keep up the great work! Your contributions help build our knowledge base.
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
          Case Study Builder - Sharing Knowledge, Building Excellence
        </p>
      </body>
    </html>
  `;
}

/**
 * Email template for case rejection notification
 */
function getCaseRejectedEmailHtml(userName: string, caseTitle: string, rejectionReason: string, link: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #ef4444; margin-top: 0;">❌ Case Study Needs Revision</h2>
          <p>Hi ${userName},</p>
          <p>Your case study <strong>"${caseTitle}"</strong> needs some revisions before it can be approved.</p>
          <div style="background-color: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Feedback:</p>
            <p style="margin: 10px 0 0 0;">${rejectionReason}</p>
          </div>
          <p style="margin: 30px 0;">
            <a href="${link}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Revise Case Study</a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            Don't worry! Make the suggested changes and resubmit your case study for approval.
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
          Case Study Builder - Sharing Knowledge, Building Excellence
        </p>
      </body>
    </html>
  `;
}

/**
 * Email template for new comment notification
 */
function getNewCommentEmailHtml(userName: string, commenterName: string, caseTitle: string, commentPreview: string, link: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #3b82f6; margin-top: 0;">💬 New Comment on Your Case Study</h2>
          <p>Hi ${userName},</p>
          <p><strong>${commenterName}</strong> commented on your case study <strong>"${caseTitle}"</strong>:</p>
          <div style="background-color: #e0f2fe; padding: 15px; border-left: 4px solid: #3b82f6; margin: 20px 0;">
            <p style="margin: 0; font-style: italic;">"${commentPreview}${commentPreview.length > 150 ? '...' : ''}"</p>
          </div>
          <p style="margin: 30px 0;">
            <a href="${link}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Comment</a>
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
          Case Study Builder - Sharing Knowledge, Building Excellence
        </p>
      </body>
    </html>
  `;
}

/**
 * Email template for BHAG milestone notification
 */
function getBhagMilestoneEmailHtml(userName: string, milestone: string, currentCount: string, targetCount: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #8b5cf6; margin-top: 0;">🎯 BHAG Milestone Reached!</h2>
          <p>Hi ${userName},</p>
          <p>Exciting news! We've reached a new milestone on our journey to <strong>${targetCount}</strong> case studies!</p>
          <div style="background-color: #ede9fe; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="font-size: 48px; margin: 0; color: #8b5cf6;">${milestone}</p>
            <p style="font-size: 20px; margin: 10px 0 0 0; color: #6b7280;">${currentCount} / ${targetCount} case studies</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Thank you for being part of this journey! Together we're building an incredible knowledge base.
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
          Case Study Builder - Sharing Knowledge, Building Excellence
        </p>
      </body>
    </html>
  `;
}

/**
 * Email template for badge earned notification
 */
function getBadgeEarnedEmailHtml(userName: string, badgeName: string, badgeDescription: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #f59e0b; margin-top: 0;">🏆 New Badge Earned!</h2>
          <p>Hi ${userName},</p>
          <p>Congratulations! You've earned a new badge:</p>
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="font-size: 64px; margin: 0;">🏆</p>
            <p style="font-size: 24px; margin: 10px 0; font-weight: bold; color: #f59e0b;">${badgeName}</p>
            <p style="margin: 0; color: #6b7280;">${badgeDescription}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Keep up the amazing work! Your contributions make a difference.
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
          Case Study Builder - Sharing Knowledge, Building Excellence
        </p>
      </body>
    </html>
  `;
}

/**
 * Send an email notification based on notification type
 */
export async function sendEmailNotification({
  to,
  userName,
  type,
  title,
  message,
  link,
  metadata,
}: {
  to: string;
  userName: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: {
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
    if (!process.env.RESEND_API_KEY) {
      console.log('[Email] RESEND_API_KEY not configured, skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    let htmlContent = '';
    let subject = title;

    // Generate email HTML based on notification type
    switch (type) {
      case 'CASE_APPROVED':
        htmlContent = getCaseApprovedEmailHtml(
          userName,
          metadata?.caseTitle || 'Your case study',
          link || '#'
        );
        break;

      case 'CASE_REJECTED':
        htmlContent = getCaseRejectedEmailHtml(
          userName,
          metadata?.caseTitle || 'Your case study',
          metadata?.rejectionReason || message,
          link || '#'
        );
        break;

      case 'NEW_COMMENT':
        htmlContent = getNewCommentEmailHtml(
          userName,
          metadata?.commenterName || 'Someone',
          metadata?.caseTitle || 'your case study',
          metadata?.commentPreview || message,
          link || '#'
        );
        break;

      case 'BHAG_MILESTONE':
        htmlContent = getBhagMilestoneEmailHtml(
          userName,
          metadata?.milestone || '🎉',
          metadata?.currentCount || '0',
          metadata?.targetCount || '1000'
        );
        break;

      case 'BADGE_EARNED':
        htmlContent = getBadgeEarnedEmailHtml(
          userName,
          metadata?.badgeName || 'Achievement',
          metadata?.badgeDescription || message
        );
        break;

      default:
        // Fallback for any other notification types
        htmlContent = `
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>${title}</h2>
              <p>${message}</p>
              ${link ? `<p><a href="${link}">View Details</a></p>` : ''}
            </body>
          </html>
        `;
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`[Email] Sent ${type} email to ${to}`, result);
    return { success: true, result };
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

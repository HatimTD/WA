'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { generateCaseStudyPDF, type CaseStudyPDFData } from '@/lib/pdf-export';
import { revalidatePath } from 'next/cache';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Case Study Builder <onboarding@resend.dev>';

/**
 * Email a case study PDF to a recipient
 */
export async function waEmailCaseStudyPDF({
  caseId,
  recipientEmail,
  message,
}: {
  caseId: string;
  recipientEmail: string;
  message?: string;
}) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return { success: false, error: 'Invalid email address' };
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' };
    }

    // Fetch case study with all required data
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id: caseId },
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
            name: true,
          },
        },
      },
    });

    if (!caseStudy) {
      return { success: false, error: 'Case study not found' };
    }

    // Check permissions - only approved/published cases can be shared, or owner can share their own
    const isOwner = caseStudy.contributorId === session.user.id;
    const isPublic = caseStudy.status === 'APPROVED' || caseStudy.status === 'PUBLISHED';

    if (!isOwner && !isPublic) {
      return { success: false, error: 'You do not have permission to share this case study' };
    }

    // Prepare PDF data
    const pdfData: CaseStudyPDFData = {
      id: caseStudy.id,
      type: caseStudy.type,
      customerName: caseStudy.customerName,
      industry: caseStudy.industry,
      componentWorkpiece: caseStudy.componentWorkpiece,
      workType: caseStudy.workType,
      wearType: caseStudy.wearType,
      problemDescription: caseStudy.problemDescription,
      previousSolution: caseStudy.previousSolution || undefined,
      previousServiceLife: caseStudy.previousServiceLife || undefined,
      competitorName: caseStudy.competitorName || undefined,
      baseMetal: caseStudy.baseMetal || undefined,
      generalDimensions: caseStudy.generalDimensions || undefined,
      waSolution: caseStudy.waSolution,
      waProduct: caseStudy.waProduct,
      technicalAdvantages: caseStudy.technicalAdvantages || undefined,
      expectedServiceLife: caseStudy.expectedServiceLife || undefined,
      solutionValueRevenue: caseStudy.solutionValueRevenue ? Number(caseStudy.solutionValueRevenue) : undefined,
      annualPotentialRevenue: caseStudy.annualPotentialRevenue ? Number(caseStudy.annualPotentialRevenue) : undefined,
      customerSavingsAmount: caseStudy.customerSavingsAmount ? Number(caseStudy.customerSavingsAmount) : undefined,
      location: caseStudy.location,
      country: caseStudy.country || undefined,
      contributor: {
        name: caseStudy.contributor.name || 'Unknown',
        email: caseStudy.contributor.email || '',
      },
      approver: caseStudy.approver ? {
        name: caseStudy.approver.name || 'Unknown',
      } : undefined,
      createdAt: caseStudy.createdAt,
      approvedAt: caseStudy.approvedAt || undefined,
    };

    // Generate PDF
    const doc = generateCaseStudyPDF(pdfData);
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const pdfBase64 = pdfBuffer.toString('base64');

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    const senderName = sender?.name || 'A colleague';
    const senderEmail = sender?.email || session.user.email || '';

    // Email subject and body
    const subject = `Case Study: ${caseStudy.customerName} - ${caseStudy.componentWorkpiece}`;
    const fileName = `${caseStudy.customerName.replace(/\s+/g, '_')}_${caseStudy.componentWorkpiece.replace(/\s+/g, '_')}_CaseStudy.pdf`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2563eb; margin-top: 0;">Case Study Shared With You</h2>
            <p>Hi there,</p>
            <p><strong>${senderName}</strong> (${senderEmail}) has shared a case study with you:</p>
            <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">${caseStudy.customerName} - ${caseStudy.componentWorkpiece}</h3>
              <p style="margin: 5px 0;"><strong>Industry:</strong> ${caseStudy.industry}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${caseStudy.location}${caseStudy.country ? `, ${caseStudy.country}` : ''}</p>
              <p style="margin: 5px 0;"><strong>WA Product:</strong> ${caseStudy.waProduct}</p>
            </div>
            ${message ? `
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Personal message:</p>
              <p style="margin: 10px 0 0 0; font-style: italic;">"${message}"</p>
            </div>
            ` : ''}
            <p style="color: #6b7280; font-size: 14px;">
              The full case study is attached as a PDF for your review.
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
            Welding Alloys - Case Study Builder
          </p>
        </body>
      </html>
    `;

    // Send email with PDF attachment
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      html: htmlContent,
      attachments: [
        {
          filename: fileName,
          content: pdfBase64,
        },
      ],
    });

    console.log(`[Email PDF] Sent case study ${caseId} to ${recipientEmail}`, result);

    // Create audit log (optional - you can add this to track shares)
    // Could create a new model for tracking shares or use existing notification system

    revalidatePath(`/dashboard/cases/${caseId}`);

    return { success: true, result };
  } catch (error) {
    console.error('[Email PDF] Error sending case study PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Tag users in a case study and notify them
 */
export async function waTagUsersInCaseStudy({
  caseId,
  userIds,
}: {
  caseId: string;
  userIds: string[];
}) {
  try {
    // Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch case study
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id: caseId },
      include: {
        contributor: {
          select: {
            name: true,
          },
        },
        taggedUsers: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!caseStudy) {
      return { success: false, error: 'Case study not found' };
    }

    // Check permissions - only owner or admin can tag users
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isOwner = caseStudy.contributorId === session.user.id;
    const isAdmin = currentUser?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return { success: false, error: 'You do not have permission to tag users in this case study' };
    }

    // Get currently tagged user IDs
    const currentTaggedIds = caseStudy.taggedUsers.map(u => u.id);

    // Find new tags (users being added)
    const newTaggedIds = userIds.filter(id => !currentTaggedIds.includes(id));

    // Update tagged users
    await prisma.caseStudy.update({
      where: { id: caseId },
      data: {
        taggedUsers: {
          set: userIds.map(id => ({ id })),
        },
      },
    });

    // Create notifications for newly tagged users
    const tagger = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });

    const taggerName = tagger?.name || 'Someone';
    const caseUrl = `/dashboard/cases/${caseId}`;

    // Send notifications to newly tagged users
    for (const userId of newTaggedIds) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'NEW_COMMENT', // Using existing type, you could add a new TAGGED_IN_CASE type
          title: 'Tagged in Case Study',
          message: `${taggerName} tagged you in "${caseStudy.customerName} - ${caseStudy.componentWorkpiece}"`,
          link: caseUrl,
        },
      });
    }

    revalidatePath(`/dashboard/cases/${caseId}`);

    return { success: true };
  } catch (error) {
    console.error('[Tag Users] Error tagging users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to tag users',
    };
  }
}

/**
 * Get users tagged in a case study
 */
export async function waGetTaggedUsers(caseId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized', users: [] };
    }

    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id: caseId },
      include: {
        taggedUsers: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!caseStudy) {
      return { success: false, error: 'Case study not found', users: [] };
    }

    return { success: true, users: caseStudy.taggedUsers };
  } catch (error) {
    console.error('[Get Tagged Users] Error fetching tagged users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tagged users',
      users: [],
    };
  }
}

/**
 * Search users for tagging (by name or email)
 */
export async function waSearchUsersForTagging(query: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized', users: [] };
    }

    if (!query || query.length < 2) {
      return { success: true, users: [] };
    }

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      take: 10,
    });

    return { success: true, users };
  } catch (error) {
    console.error('[Search Users] Error searching users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search users',
      users: [],
    };
  }
}

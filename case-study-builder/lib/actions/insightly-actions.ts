'use server';

import { insightlyClient, type InsightlyOrganization, type InsightlyContact } from '@/lib/integrations/insightly';
import { prisma } from '@/lib/prisma';

/**
 * BRD 3.4D - PDF Push to CRM on Publication
 *
 * When a case study is published (approved), this action:
 * 1. Generates the PDF
 * 2. Syncs the case study data to Insightly
 * 3. Attaches the PDF to the CRM opportunity
 */

/**
 * Search Insightly organizations (customers)
 */
export async function searchInsightlyOrganizations(query: string): Promise<{
  success: boolean;
  organizations?: InsightlyOrganization[];
  error?: string;
}> {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, organizations: [] };
    }

    const organizations = await insightlyClient.searchOrganizations(query.trim());
    return { success: true, organizations };
  } catch (error) {
    console.error('[Insightly Actions] Search organizations error:', error);
    return {
      success: false,
      error: 'Failed to search Insightly organizations',
    };
  }
}

/**
 * Search Insightly contacts
 */
export async function searchInsightlyContacts(query: string): Promise<{
  success: boolean;
  contacts?: InsightlyContact[];
  error?: string;
}> {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, contacts: [] };
    }

    const contacts = await insightlyClient.searchContacts(query.trim());
    return { success: true, contacts };
  } catch (error) {
    console.error('[Insightly Actions] Search contacts error:', error);
    return {
      success: false,
      error: 'Failed to search Insightly contacts',
    };
  }
}

/**
 * Sync a case study to Insightly CRM
 */
export async function syncCaseStudyToInsightly(caseStudyId: string): Promise<{
  success: boolean;
  opportunityId?: number;
  error?: string;
}> {
  try {
    // Fetch the case study
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id: caseStudyId },
      select: {
        id: true,
        customerName: true,
        componentWorkpiece: true,
        industry: true,
        location: true,
        solutionValueRevenue: true,
        status: true,
        insightlyOpportunityId: true,
      },
    });

    if (!caseStudy) {
      return { success: false, error: 'Case study not found' };
    }

    // Derive title from customer + component
    const derivedTitle = `${caseStudy.customerName} - ${caseStudy.componentWorkpiece}`;

    // Sync to Insightly
    const result = await insightlyClient.syncCaseStudy({
      id: caseStudy.id,
      customerName: caseStudy.customerName,
      title: derivedTitle,
      industry: caseStudy.industry,
      location: caseStudy.location,
      financialImpact: caseStudy.solutionValueRevenue ? Number(caseStudy.solutionValueRevenue) : undefined,
      status: caseStudy.status,
    });

    if (result.synced && result.opportunityId) {
      // Update case study with Insightly opportunity ID
      await prisma.caseStudy.update({
        where: { id: caseStudyId },
        data: { insightlyOpportunityId: result.opportunityId },
      });

      return { success: true, opportunityId: result.opportunityId };
    }

    return { success: false, error: 'Failed to sync to Insightly' };
  } catch (error) {
    console.error('[Insightly Actions] Sync case study error:', error);
    return {
      success: false,
      error: 'Failed to sync case study to Insightly',
    };
  }
}

/**
 * Test Insightly connection
 */
export async function testInsightlyConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  return insightlyClient.testConnection();
}

/**
 * Batch sync approved case studies to Insightly
 */
export async function batchSyncToInsightly(limit: number = 50): Promise<{
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;
  let failed = 0;

  try {
    // Get approved case studies without Insightly opportunity ID
    const caseStudies = await prisma.caseStudy.findMany({
      where: {
        status: 'APPROVED',
        insightlyOpportunityId: null,
      },
      take: limit,
      select: {
        id: true,
        customerName: true,
        componentWorkpiece: true,
        industry: true,
        location: true,
        solutionValueRevenue: true,
        status: true,
      },
    });

    for (const cs of caseStudies) {
      try {
        // Derive title from customer + component
        const derivedTitle = `${cs.customerName} - ${cs.componentWorkpiece}`;

        const result = await insightlyClient.syncCaseStudy({
          id: cs.id,
          customerName: cs.customerName,
          title: derivedTitle,
          industry: cs.industry,
          location: cs.location,
          financialImpact: cs.solutionValueRevenue ? Number(cs.solutionValueRevenue) : undefined,
          status: cs.status,
        });

        if (result.synced && result.opportunityId) {
          await prisma.caseStudy.update({
            where: { id: cs.id },
            data: { insightlyOpportunityId: result.opportunityId },
          });
          synced++;
        } else {
          failed++;
          errors.push(`Failed to sync: ${cs.id}`);
        }
      } catch (error) {
        failed++;
        errors.push(`Error syncing ${cs.id}: ${(error as Error).message}`);
      }
    }

    return { success: true, synced, failed, errors };
  } catch (error) {
    console.error('[Insightly Actions] Batch sync error:', error);
    return {
      success: false,
      synced,
      failed,
      errors: [...errors, (error as Error).message],
    };
  }
}

/**
 * Push PDF to CRM on case study publication (BRD 3.4D)
 *
 * This is called when a case study is approved/published.
 * It syncs the case study to Insightly and attaches the generated PDF.
 */
export async function pushPDFToCRM(
  caseStudyId: string,
  pdfBase64: string
): Promise<{
  success: boolean;
  opportunityId?: number;
  fileId?: number;
  error?: string;
}> {
  try {
    // Fetch the case study
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id: caseStudyId },
      select: {
        id: true,
        customerName: true,
        componentWorkpiece: true,
        industry: true,
        location: true,
        solutionValueRevenue: true,
        status: true,
        insightlyOpportunityId: true,
      },
    });

    if (!caseStudy) {
      return { success: false, error: 'Case study not found' };
    }

    if (caseStudy.status !== 'APPROVED') {
      return { success: false, error: 'Case study must be approved before pushing to CRM' };
    }

    // Derive title from customer + component
    const derivedTitle = `${caseStudy.customerName} - ${caseStudy.componentWorkpiece}`;

    // Convert base64 PDF to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const fileName = `CaseStudy_${caseStudy.id.slice(-8)}_${caseStudy.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    // Sync to Insightly with PDF
    const result = await insightlyClient.syncCaseStudyWithPDF(
      {
        id: caseStudy.id,
        customerName: caseStudy.customerName,
        title: derivedTitle,
        industry: caseStudy.industry,
        location: caseStudy.location,
        financialImpact: caseStudy.solutionValueRevenue
          ? Number(caseStudy.solutionValueRevenue)
          : undefined,
        status: caseStudy.status,
      },
      pdfBuffer,
      fileName
    );

    if (result.synced) {
      // Update case study with Insightly IDs
      await prisma.caseStudy.update({
        where: { id: caseStudyId },
        data: {
          insightlyOpportunityId: result.opportunityId,
          insightlySyncedAt: new Date(),
        },
      });

      return {
        success: true,
        opportunityId: result.opportunityId,
        fileId: result.fileId,
      };
    }

    return { success: false, error: 'Failed to sync to CRM' };
  } catch (error) {
    console.error('[Insightly Actions] Push PDF to CRM error:', error);
    return {
      success: false,
      error: 'Failed to push PDF to CRM',
    };
  }
}

/**
 * Check if a case study is synced to CRM
 */
export async function getCRMSyncStatus(caseStudyId: string): Promise<{
  isSynced: boolean;
  opportunityId?: number;
  syncedAt?: Date;
}> {
  try {
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id: caseStudyId },
      select: {
        insightlyOpportunityId: true,
        insightlySyncedAt: true,
      },
    });

    if (!caseStudy) {
      return { isSynced: false };
    }

    return {
      isSynced: !!caseStudy.insightlyOpportunityId,
      opportunityId: caseStudy.insightlyOpportunityId ?? undefined,
      syncedAt: caseStudy.insightlySyncedAt ?? undefined,
    };
  } catch (error) {
    console.error('[Insightly Actions] Get sync status error:', error);
    return { isSynced: false };
  }
}

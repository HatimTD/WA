'use server';

import { insightlyClient, type InsightlyOrganization, type InsightlyContact } from '@/lib/integrations/insightly';
import { prisma } from '@/lib/prisma';

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
        title: true,
        industry: true,
        location: true,
        financialImpact: true,
        status: true,
        insightlyOpportunityId: true,
      },
    });

    if (!caseStudy) {
      return { success: false, error: 'Case study not found' };
    }

    // Sync to Insightly
    const result = await insightlyClient.syncCaseStudy({
      id: caseStudy.id,
      customerName: caseStudy.customerName,
      title: caseStudy.title,
      industry: caseStudy.industry,
      location: caseStudy.location,
      financialImpact: caseStudy.financialImpact ? Number(caseStudy.financialImpact) : undefined,
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
        title: true,
        industry: true,
        location: true,
        financialImpact: true,
        status: true,
      },
    });

    for (const cs of caseStudies) {
      try {
        const result = await insightlyClient.syncCaseStudy({
          id: cs.id,
          customerName: cs.customerName,
          title: cs.title,
          industry: cs.industry,
          location: cs.location,
          financialImpact: cs.financialImpact ? Number(cs.financialImpact) : undefined,
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

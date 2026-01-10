'use server';

import { netsuiteClient, NetSuiteCustomer } from '@/lib/integrations/netsuite';
import { waSearchCustomers, waGetCustomer } from '@/lib/integrations/netsuite-dual-source';
import { prisma } from '@/lib/prisma';

// Extended customer type with case study info
export type NetSuiteCustomerWithCases = NetSuiteCustomer & {
  caseStudyCount: number;
  recentCaseStudies: Array<{
    id: string;
    title: string | null;
    type: string;
    status: string;
    createdAt: Date;
  }>;
};

export async function waSearchNetSuiteCustomers(
  query: string
): Promise<{ success: boolean; customers?: NetSuiteCustomerWithCases[]; error?: string }> {
  try {
    if (!query || query.length < 2) {
      return { success: true, customers: [] };
    }

    // Use dual-source service (automatically uses NetSuite or mock data based on config)
    const customers = await waSearchCustomers(query);

    // Enrich with case study data from our database
    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const caseStudies = await prisma.waCaseStudy.findMany({
          where: {
            customerName: {
              equals: customer.companyName,
              mode: 'insensitive',
            },
          },
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        });

        return {
          ...customer,
          caseStudyCount: caseStudies.length,
          recentCaseStudies: caseStudies,
        };
      })
    );

    return { success: true, customers: enrichedCustomers };
  } catch (error) {
    console.error('NetSuite search failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search customers',
    };
  }
}

export async function waGetNetSuiteCustomer(
  customerId: string
): Promise<{ success: boolean; customer?: NetSuiteCustomer; error?: string }> {
  try {
    if (!customerId) {
      return { success: false, error: 'Customer ID is required' };
    }

    // Use dual-source service (automatically uses NetSuite or mock data based on config)
    const customer = await waGetCustomer(customerId);

    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }

    return { success: true, customer };
  } catch (error) {
    console.error('NetSuite get customer failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch customer details',
    };
  }
}

export async function waSyncCustomerToNetSuite(
  caseStudyId: string,
  netsuiteCustomerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { prisma } = await import('@/lib/prisma');

    await prisma.waCaseStudy.update({
      where: { id: caseStudyId },
      data: {
        netsuiteCustomerId,
        netsuiteSyncedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to sync customer to NetSuite:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync customer',
    };
  }
}

/**
 * Push published case study PDF to NetSuite customer record
 * Called when a case study is published (status = PUBLISHED)
 */
export async function waPushCaseStudyToNetSuite(
  caseStudyId: string
): Promise<{ success: boolean; fileId?: string; error?: string }> {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Fetch case study with all required data
    const caseStudy = await prisma.waCaseStudy.findUnique({
      where: { id: caseStudyId },
      include: {
        contributor: { select: { name: true, email: true } },
      },
    });

    if (!caseStudy) {
      return { success: false, error: 'Case study not found' };
    }

    if (!caseStudy.netsuiteCustomerId) {
      return { success: false, error: 'No NetSuite customer linked to this case study' };
    }

    // Generate PDF URL (case studies don't store pdfUrl - PDF is generated on demand)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const pdfApiUrl = `${baseUrl}/api/pdf/${caseStudyId}`;

    // Fetch the PDF file from the API
    const pdfResponse = await fetch(pdfApiUrl);
    if (!pdfResponse.ok) {
      return { success: false, error: 'Failed to generate/fetch PDF file' };
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    // Generate filename with fallback for null title
    const displayTitle = caseStudy.title || `${caseStudy.customerName}_${caseStudy.componentWorkpiece}`;
    const sanitizedTitle = displayTitle
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    const fileName = `CaseStudy_${sanitizedTitle}_${caseStudy.id.substring(0, 8)}.pdf`;

    // Upload to NetSuite
    const result = await netsuiteClient.waUploadPdfToCustomer(
      caseStudy.netsuiteCustomerId,
      pdfBuffer,
      fileName,
      {
        caseStudyId: caseStudy.id,
        caseStudyTitle: displayTitle,
        caseType: caseStudy.type,
        publishedAt: caseStudy.approvedAt?.toISOString() || new Date().toISOString(),
        createdBy: caseStudy.contributor?.name || caseStudy.contributor?.email || 'Unknown',
      }
    );

    if (result.success) {
      // Update case study with NetSuite file reference
      await prisma.waCaseStudy.update({
        where: { id: caseStudyId },
        data: {
          netsuiteFileId: result.fileId,
          netsuiteSyncedAt: new Date(),
        },
      });

      console.log(`Case study ${caseStudyId} pushed to NetSuite: fileId=${result.fileId}`);
    }

    return result;
  } catch (error) {
    console.error('Failed to push case study to NetSuite:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to push to NetSuite',
    };
  }
}

/**
 * Update NetSuite customer record with case study metadata
 * Alternative to file upload - just updates custom fields
 */
export async function waUpdateNetSuiteCustomerMetadata(
  caseStudyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { prisma } = await import('@/lib/prisma');

    const caseStudy = await prisma.waCaseStudy.findUnique({
      where: { id: caseStudyId },
    });

    if (!caseStudy) {
      return { success: false, error: 'Case study not found' };
    }

    if (!caseStudy.netsuiteCustomerId) {
      return { success: false, error: 'No NetSuite customer linked' };
    }

    // Generate URL for the case study
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const caseStudyUrl = `${baseUrl}/dashboard/cases/${caseStudy.id}`;
    const displayTitle = caseStudy.title || `${caseStudy.customerName} - ${caseStudy.componentWorkpiece}`;

    const result = await netsuiteClient.waUpdateCustomerCaseStudyMetadata(
      caseStudy.netsuiteCustomerId,
      {
        caseStudyId: caseStudy.id,
        caseStudyTitle: displayTitle,
        caseStudyUrl: caseStudyUrl,
        publishedAt: caseStudy.approvedAt?.toISOString() || new Date().toISOString(),
      }
    );

    if (result.success) {
      await prisma.waCaseStudy.update({
        where: { id: caseStudyId },
        data: { netsuiteSyncedAt: new Date() },
      });
    }

    return result;
  } catch (error) {
    console.error('Failed to update NetSuite metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update metadata',
    };
  }
}

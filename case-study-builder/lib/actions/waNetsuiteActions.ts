'use server';

import { netsuiteClient, NetSuiteCustomer } from '@/lib/integrations/netsuite';
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

    // Check if NetSuite is configured
    const isNetSuiteConfigured = !!(
      process.env.NETSUITE_ACCOUNT_ID &&
      process.env.NETSUITE_CONSUMER_KEY &&
      process.env.NETSUITE_REST_URL
    );

    let enrichedCustomers: NetSuiteCustomerWithCases[] = [];

    if (isNetSuiteConfigured) {
      // Production: Get customers from NetSuite
      const customers = await netsuiteClient.searchCustomers(query);

      // Enrich with case study data from our database
      enrichedCustomers = await Promise.all(
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
    } else {
      // Development: Search from existing case studies in database
      // Only show customers from APPROVED or PUBLISHED case studies
      const caseStudies = await prisma.waCaseStudy.findMany({
        where: {
          customerName: {
            contains: query,
            mode: 'insensitive',
          },
          status: {
            in: ['APPROVED', 'PUBLISHED'],
          },
        },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          createdAt: true,
          customerName: true,
          industry: true,
          location: true,
          country: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Group case studies by customer name
      const customerMap = new Map<string, {
        customerName: string;
        industry: string | null;
        location: string | null;
        country: string | null;
        caseStudies: typeof caseStudies;
      }>();

      caseStudies.forEach((cs) => {
        const key = cs.customerName.toLowerCase();
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            customerName: cs.customerName,
            industry: cs.industry,
            location: cs.location,
            country: cs.country,
            caseStudies: [],
          });
        }
        customerMap.get(key)!.caseStudies.push(cs);
      });

      // Convert to customer format
      let index = 1;
      customerMap.forEach((data) => {
        enrichedCustomers.push({
          id: `db-${index}`,
          internalId: `db-${index}`,
          entityId: `LOCAL-${index.toString().padStart(4, '0')}`,
          companyName: data.customerName,
          displayName: data.customerName,
          address: '',
          city: data.location || '',
          country: data.country || '',
          industry: data.industry || '',
          caseStudyCount: data.caseStudies.length,
          recentCaseStudies: data.caseStudies.slice(0, 3).map((cs) => ({
            id: cs.id,
            title: cs.title,
            type: cs.type,
            status: cs.status,
            createdAt: cs.createdAt,
          })),
        });
        index++;
      });
    }

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

    const customer = await netsuiteClient.getCustomer(customerId);

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

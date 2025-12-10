'use server';

import { netsuiteClient, NetSuiteCustomer } from '@/lib/integrations/netsuite';

export async function searchNetSuiteCustomers(
  query: string
): Promise<{ success: boolean; customers?: NetSuiteCustomer[]; error?: string }> {
  try {
    if (!query || query.length < 2) {
      return { success: true, customers: [] };
    }

    const customers = await netsuiteClient.searchCustomers(query);
    return { success: true, customers };
  } catch (error) {
    console.error('NetSuite search failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search customers',
    };
  }
}

export async function getNetSuiteCustomer(
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

export async function syncCustomerToNetSuite(
  caseStudyId: string,
  netsuiteCustomerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { prisma } = await import('@/lib/prisma');

    await prisma.caseStudy.update({
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

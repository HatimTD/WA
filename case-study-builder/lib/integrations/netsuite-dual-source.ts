/**
 * Dual-source NetSuite service
 * Fetches from NetSuite OR mock database based on configuration
 * Allows testing while NetSuite permissions are being fixed
 */

import { prisma } from '@/lib/prisma';
import { netsuiteClient, type NetSuiteCustomer } from './netsuite';

export type DataSource = 'netsuite' | 'mock' | 'auto';

export interface NetSuiteItem {
  id: string;
  internalId: string;
  itemId: string;
  itemName: string;
  displayName: string;
  description?: string;
  category?: string;
  type?: string;
  diameter?: string;
  composition?: string;
  process?: string;
  application?: string;
  hardness?: string;
}

/**
 * Get configured data source
 * Priority: Environment variable > Auto-detection
 */
function waGetDataSource(): DataSource {
  const configured = (process.env.NETSUITE_DATA_SOURCE || 'auto').toLowerCase() as DataSource;
  return configured;
}

/**
 * Check if NetSuite is properly configured
 */
function waIsNetSuiteConfigured(): boolean {
  return !!(
    process.env.NETSUITE_ACCOUNT_ID &&
    process.env.NETSUITE_CONSUMER_KEY &&
    process.env.NETSUITE_TOKEN_ID &&
    process.env.NETSUITE_RESTLET_URL
  );
}

/**
 * Automatically detect which source to use
 * NetSuite if configured and working, otherwise mock data
 */
async function waAutoDetectSource(): Promise<'netsuite' | 'mock'> {
  if (!waIsNetSuiteConfigured()) {
    console.log('[NetSuite Dual-Source] Not configured, using mock data');
    return 'mock';
  }

  // Check if we have mock data available
  const mockCount = await prisma.waMockCustomer.count();
  if (mockCount === 0) {
    console.log('[NetSuite Dual-Source] No mock data, attempting NetSuite');
    return 'netsuite';
  }

  // Default to mock for safety during testing
  console.log('[NetSuite Dual-Source] Auto-detected: using mock data (safe default)');
  return 'mock';
}

/**
 * Search customers from NetSuite or mock database
 */
export async function waSearchCustomers(query: string): Promise<NetSuiteCustomer[]> {
  const configuredSource = waGetDataSource();
  let actualSource: 'netsuite' | 'mock' = configuredSource === 'auto'
    ? await waAutoDetectSource()
    : configuredSource as 'netsuite' | 'mock';

  console.log(`[NetSuite Dual-Source] Searching customers with source: ${actualSource}`);

  if (actualSource === 'netsuite') {
    try {
      const results = await netsuiteClient.searchCustomers(query);
      console.log(`[NetSuite] Found ${results.length} customers`);
      return results;
    } catch (error) {
      console.error('[NetSuite] Search failed, falling back to mock data:', error);
      actualSource = 'mock';
    }
  }

  // Use mock data
  if (!query || query.length < 2) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  const mockCustomers = await prisma.waMockCustomer.findMany({
    where: {
      isActive: true,
      OR: [
        { companyName: { contains: lowerQuery, mode: 'insensitive' } },
        { entityId: { contains: lowerQuery, mode: 'insensitive' } },
        { city: { contains: lowerQuery, mode: 'insensitive' } },
        { industry: { contains: lowerQuery, mode: 'insensitive' } },
      ],
    },
    take: 10,
    orderBy: { companyName: 'asc' },
  });

  console.log(`[Mock DB] Found ${mockCustomers.length} customers`);

  // Transform to NetSuiteCustomer format
  return mockCustomers.map((customer) => ({
    id: customer.netsuiteId,
    internalId: customer.netsuiteId,
    entityId: customer.entityId,
    companyName: customer.companyName,
    displayName: customer.displayName,
    address: customer.address || '',
    city: customer.city || '',
    country: customer.country || '',
    industry: customer.industry || '',
  }));
}

/**
 * Get customer by ID from NetSuite or mock database
 */
export async function waGetCustomer(id: string): Promise<NetSuiteCustomer | null> {
  const configuredSource = waGetDataSource();
  let actualSource: 'netsuite' | 'mock' = configuredSource === 'auto'
    ? await waAutoDetectSource()
    : configuredSource as 'netsuite' | 'mock';

  console.log(`[NetSuite Dual-Source] Getting customer ${id} from source: ${actualSource}`);

  if (actualSource === 'netsuite') {
    try {
      const result = await netsuiteClient.getCustomer(id);
      if (result) {
        console.log(`[NetSuite] Found customer ${id}`);
        return result;
      }
    } catch (error) {
      console.error('[NetSuite] Get customer failed, falling back to mock data:', error);
      actualSource = 'mock';
    }
  }

  // Use mock data
  const mockCustomer = await prisma.waMockCustomer.findUnique({
    where: { netsuiteId: id, isActive: true },
  });

  if (!mockCustomer) {
    console.log(`[Mock DB] Customer ${id} not found`);
    return null;
  }

  console.log(`[Mock DB] Found customer ${id}`);

  return {
    id: mockCustomer.netsuiteId,
    internalId: mockCustomer.netsuiteId,
    entityId: mockCustomer.entityId,
    companyName: mockCustomer.companyName,
    displayName: mockCustomer.displayName,
    address: mockCustomer.address || '',
    city: mockCustomer.city || '',
    country: mockCustomer.country || '',
    industry: mockCustomer.industry || '',
  };
}

/**
 * Search items (products) from NetSuite or mock database
 */
export async function waSearchItems(query: string): Promise<NetSuiteItem[]> {
  const configuredSource = waGetDataSource();
  let actualSource: 'netsuite' | 'mock' = configuredSource === 'auto'
    ? await waAutoDetectSource()
    : configuredSource as 'netsuite' | 'mock';

  console.log(`[NetSuite Dual-Source] Searching items with source: ${actualSource}`);

  if (actualSource === 'netsuite') {
    // TODO: Implement NetSuite item search when RESTlet is working
    console.log('[NetSuite] Item search not yet implemented, using mock data');
    actualSource = 'mock';
  }

  // Use mock data
  if (!query || query.length < 2) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  const mockItems = await prisma.waMockItem.findMany({
    where: {
      isActive: true,
      OR: [
        { itemName: { contains: lowerQuery, mode: 'insensitive' } },
        { itemId: { contains: lowerQuery, mode: 'insensitive' } },
        { description: { contains: lowerQuery, mode: 'insensitive' } },
        { category: { contains: lowerQuery, mode: 'insensitive' } },
      ],
    },
    take: 10,
    orderBy: { itemName: 'asc' },
  });

  console.log(`[Mock DB] Found ${mockItems.length} items`);

  return mockItems.map((item) => ({
    id: item.netsuiteId,
    internalId: item.netsuiteId,
    itemId: item.itemId,
    itemName: item.itemName,
    displayName: item.displayName,
    description: item.description || undefined,
    category: item.category || undefined,
    type: item.type || undefined,
    diameter: item.diameter || undefined,
    composition: item.composition || undefined,
    process: item.process || undefined,
    application: item.application || undefined,
    hardness: item.hardness || undefined,
  }));
}

/**
 * Get item by ID from NetSuite or mock database
 */
export async function waGetItem(id: string): Promise<NetSuiteItem | null> {
  const configuredSource = waGetDataSource();
  let actualSource: 'netsuite' | 'mock' = configuredSource === 'auto'
    ? await waAutoDetectSource()
    : configuredSource as 'netsuite' | 'mock';

  console.log(`[NetSuite Dual-Source] Getting item ${id} from source: ${actualSource}`);

  if (actualSource === 'netsuite') {
    // TODO: Implement NetSuite item get when RESTlet is working
    console.log('[NetSuite] Item get not yet implemented, using mock data');
    actualSource = 'mock';
  }

  // Use mock data
  const mockItem = await prisma.waMockItem.findUnique({
    where: { netsuiteId: id, isActive: true },
  });

  if (!mockItem) {
    console.log(`[Mock DB] Item ${id} not found`);
    return null;
  }

  console.log(`[Mock DB] Found item ${id}`);

  return {
    id: mockItem.netsuiteId,
    internalId: mockItem.netsuiteId,
    itemId: mockItem.itemId,
    itemName: mockItem.itemName,
    displayName: mockItem.displayName,
    description: mockItem.description || undefined,
    category: mockItem.category || undefined,
    type: mockItem.type || undefined,
    diameter: mockItem.diameter || undefined,
    composition: mockItem.composition || undefined,
    process: mockItem.process || undefined,
    application: mockItem.application || undefined,
    hardness: mockItem.hardness || undefined,
  };
}

/**
 * Get current data source status
 */
export async function waGetDataSourceStatus() {
  const configured = waGetDataSource();
  const netsuiteConfigured = waIsNetSuiteConfigured();
  const mockCustomerCount = await prisma.waMockCustomer.count();
  const mockItemCount = await prisma.waMockItem.count();

  let activeSource: 'netsuite' | 'mock' | 'unknown' = 'unknown';
  if (configured === 'auto') {
    activeSource = await waAutoDetectSource();
  } else {
    activeSource = configured as 'netsuite' | 'mock';
  }

  return {
    configured,
    activeSource,
    netsuiteConfigured,
    mockData: {
      customers: mockCustomerCount,
      items: mockItemCount,
    },
  };
}

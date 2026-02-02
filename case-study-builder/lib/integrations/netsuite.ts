import crypto from 'crypto';
import { redisCache } from '@/lib/cache/redis-client';

interface NetSuiteConfig {
  accountId: string;
  consumerKey: string;
  consumerSecret: string;
  tokenId: string;
  tokenSecret: string;
}

export interface NetSuiteCustomer {
  id: string;           // Numeric internal ID from NetSuite
  internalId: string;   // Numeric internal ID (same as id)
  entityId: string;     // Customer UID like "E9008y" or "CUST-001"
  companyName: string;  // Company name
  displayName: string;  // Combined: "CompanyName (EntityId)"
  address: string;
  city: string;
  country: string;
  industry: string;
  subsidiarynohierarchy?: string;  // Subsidiary ID for filtering (CRITICAL for multi-subsidiary support)
}

export interface NetSuiteEmployee {
  id: string;                      // netsuiteInternalId
  internalId: string;              // Same as id
  email: string | null;            // For Google OAuth matching
  firstname: string | null;
  middlename: string | null;
  lastname: string | null;
  phone: string | null;
  // Subsidiary assignment (CRITICAL for multi-subsidiary support)
  subsidiarynohierarchy?: string;  // Subsidiary ID
  subsidiarynohierarchyname?: string; // Subsidiary name
  department?: string;
  location?: string;
}

class NetSuiteClient {
  private config: NetSuiteConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      accountId: process.env.NETSUITE_ACCOUNT_ID || '',
      consumerKey: process.env.NETSUITE_CONSUMER_KEY || '',
      consumerSecret: process.env.NETSUITE_CONSUMER_SECRET || '',
      tokenId: process.env.NETSUITE_TOKEN_ID || '',
      tokenSecret: process.env.NETSUITE_TOKEN_SECRET || '',
    };
    this.baseUrl = process.env.NETSUITE_REST_URL || '';
  }

  private generateOAuthHeader(method: string, url: string): string {
    // OAuth 1.0 signature generation per NetSuite TBA specification
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    // Parse URL to extract base URL and query parameters
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

    // OAuth parameters
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: this.config.consumerKey,
      oauth_token: this.config.tokenId,
      oauth_signature_method: 'HMAC-SHA256',
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_version: '1.0',
    };

    // Combine OAuth params with URL query params for signature base string
    // Per OAuth 1.0 spec, all parameters must be included and sorted
    const allParams: Record<string, string> = { ...oauthParams };
    urlObj.searchParams.forEach((value, key) => {
      allParams[key] = value;
    });

    // Build the parameter string (sorted alphabetically)
    const paramString = Object.keys(allParams)
      .sort()
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
      .join('&');

    // Signature base string: METHOD&BASE_URL&PARAMS (all URL-encoded)
    const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;

    // Generate signing key: consumerSecret&tokenSecret (URL-encoded)
    const signingKey = `${encodeURIComponent(this.config.consumerSecret)}&${encodeURIComponent(this.config.tokenSecret)}`;

    // Generate HMAC-SHA256 signature
    const signature = crypto.createHmac('sha256', signingKey).update(signatureBaseString).digest('base64');

    // Add signature to OAuth parameters
    oauthParams.oauth_signature = signature;

    // Build Authorization header with realm (account ID) as first parameter
    // Format: OAuth realm="ACCOUNT_ID",oauth_consumer_key="...",oauth_nonce="...",...
    const headerParams = Object.keys(oauthParams)
      .sort()
      .map((key) => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(',');

    const authHeader = `OAuth realm="${this.config.accountId}",${headerParams}`;

    return authHeader;
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    if (!this.config.accountId || !this.baseUrl) {
      throw new Error('NetSuite credentials not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const authHeader = this.generateOAuthHeader(method, url);

    const headers: Record<string, string> = {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Prefer': 'transient', // Required for SuiteQL queries per NetSuite docs
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NetSuite API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Sanitize input for SuiteQL queries to prevent SQL injection
   * Removes dangerous characters and escapes single quotes
   */
  private sanitizeSearchInput(input: string): string {
    // Remove dangerous characters: semicolons, comments, union keywords
    const sanitized = input
      .replace(/;/g, '')           // Remove semicolons
      .replace(/--/g, '')          // Remove SQL comments
      .replace(/\/\*/g, '')        // Remove block comments start
      .replace(/\*\//g, '')        // Remove block comments end
      .replace(/\bunion\b/gi, '')  // Remove UNION keyword
      .replace(/\bdrop\b/gi, '')   // Remove DROP keyword
      .replace(/\bdelete\b/gi, '') // Remove DELETE keyword
      .replace(/\binsert\b/gi, '') // Remove INSERT keyword
      .replace(/\bupdate\b/gi, '') // Remove UPDATE keyword
      .replace(/'/g, "''")         // Escape single quotes
      .trim()
      .substring(0, 100);          // Limit length to prevent DoS
    return sanitized;
  }

  async searchCustomers(query: string): Promise<NetSuiteCustomer[]> {
    try {
      // Sanitize input (allow empty query for getting all customers)
      const sanitizedQuery = this.sanitizeSearchInput(query);
      const isGetAll = sanitizedQuery.length === 0;

      console.log(`[NetSuite] ${isGetAll ? 'Getting ALL customers' : `Searching customers for: "${sanitizedQuery}"`}`);

      // Try Redis cache first (chunked to handle Upstash 10MB limit)
      const cacheKey = 'netsuite:customers';
      let allCustomers: any[] | null = await redisCache.getChunked<any>(cacheKey);

      if (!allCustomers) {
        // Fetch from RESTlet API which we confirmed works
        const restletUrl = process.env.NETSUITE_RESTLET_URL;

        if (!restletUrl) {
          throw new Error('NETSUITE_RESTLET_URL not configured');
        }

        // Build URL for getting all customers
        const url = `${restletUrl}&waType=customer`;
        const authHeader = this.generateOAuthHeader('GET', url);

        console.log('[NetSuite] Fetching all customers from RESTlet (this may take ~35 seconds)...');
        const startTime = Date.now();

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          // Increased timeout for large dataset
          signal: AbortSignal.timeout(120000), // 120 seconds
        });

        if (!response.ok) {
          throw new Error(`NetSuite RESTlet error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[NetSuite] Fetched ${Array.isArray(data) ? data.length : 0} customers in ${elapsed}s`);

        if (!Array.isArray(data)) {
          throw new Error('Unexpected response format from RESTlet');
        }

        // Store only essential fields and use chunked caching for Upstash 10MB limit
        const essentialData = data.map((c: any) => ({
          internalid: c.internalid,
          entityid: c.entityid,
          companyname: c.companyname,
          email: c.email || '',
          phone: c.phone || '',
          billcity: c.billcity || '',
          billcountrycode: c.billcountrycode || '',
          // Per API docs: Use custentity_wag_industryclass_primename for industry name
          category: c.custentity_wag_industryclass_primename || c.categoryname || c.category || '',
          categoryname: c.categoryname || '',
          industryid: c.custentity_wag_industryclass_prime || '',
          subsidiarynohierarchy: c.subsidiarynohierarchy || '', // CRITICAL: Subsidiary ID for filtering
          subsidiaryname: c.subsidiarynohierarchyname || c.subsidiary || '',
          currencyname: c.currencyname || '',
          address: c.address || '',
        }));

        // Cache using chunked storage (splits into ~5MB chunks) for 1 week (604800 seconds)
        const cacheSuccess = await redisCache.setChunked(cacheKey, essentialData, 604800);
        if (cacheSuccess) {
          console.log(`[NetSuite] Cached ${essentialData.length} customers (chunked) in Redis`);
        } else {
          console.error(`[NetSuite] Failed to cache customers in Redis`);
        }

        allCustomers = essentialData;
      }

      // Filter customers client-side based on search query
      // Search in: company name, entity ID, city, and industry
      let filteredCustomers: any[];

      if (isGetAll) {
        // Return ALL customers for client-side caching
        filteredCustomers = allCustomers;
        console.log(`[NetSuite] Returning ALL ${filteredCustomers.length} customers for caching`);
      } else {
        // Filter based on query
        const lowerQuery = sanitizedQuery.toLowerCase();
        filteredCustomers = allCustomers
          .filter((customer: any) => {
            const companyName = (customer.companyname || '').toLowerCase();
            const entityId = (customer.entityid || '').toLowerCase();
            const city = (customer.billcity || '').toLowerCase();
            const address = (customer.address || '').toLowerCase();
            const industry = (customer.category || '').toLowerCase();

            return companyName.includes(lowerQuery) ||
                   entityId.includes(lowerQuery) ||
                   city.includes(lowerQuery) ||
                   address.includes(lowerQuery) ||
                   industry.includes(lowerQuery);
          })
          .slice(0, 10); // Return max 10 results
        console.log(`[NetSuite] Found ${filteredCustomers.length} matching customers`);
      // Debug: Log first customer's data
      if (filteredCustomers.length > 0) {
        const first = filteredCustomers[0];
        console.log(`[NetSuite] Sample customer data:`, {
          companyname: first.companyname,
          billcity: first.billcity,
          billcountrycode: first.billcountrycode,
          category: first.category
        });
      }
      }

      // Transform to NetSuiteCustomer format
      return filteredCustomers.map((item: any, index: number) => {
        const companyName = item.companyname || '';
        const entityId = item.entityid || item.internalid || '';
        const internalId = item.internalid || '';

        // Generate truly unique ID: hash of all identifying fields + index
        // This handles duplicate records in NetSuite (same ID but different data)
        const uniqueId = `${internalId}-${entityId}-${index}-${Date.now()}`;

        return {
          id: uniqueId,
          internalId: internalId,
          entityId: entityId,
          companyName: companyName,
          displayName: entityId ? `${companyName} (${entityId})` : companyName,
          address: item.address || '',
          city: item.billcity || '',
          country: item.billcountrycode || '',
          industry: item.category || '',
          subsidiarynohierarchy: item.subsidiarynohierarchy || '', // For filtering by subsidiary
        };
      });

    } catch (error) {
      console.error('[NetSuite] Search error:', error);
      // Return mock data for development/testing when credentials are not configured
      if ((error as Error).message.includes('credentials not configured')) {
        return this.getMockCustomers(query);
      }
      throw error;
    }
  }

  async getCustomer(id: string): Promise<NetSuiteCustomer | null> {
    try {
      const response = await this.makeRequest(`/record/v1/customer/${id}`, 'GET');

      if (response) {
        const companyName = response.companyName || '';
        const entityId = response.entityId || response.id?.toString() || id;
        return {
          id: response.id?.toString() || id,
          internalId: response.id?.toString() || id,
          entityId: entityId,
          companyName: companyName,
          displayName: entityId ? `${companyName} (${entityId})` : companyName,
          address: response.billAddr?.addr1 || '',
          city: response.billAddr?.city || '',
          country: response.billAddr?.country || '',
          // Per API docs: Use custentity_wag_industryclass_primename for industry name
          industry: response.custentity_wag_industryclass_primename || response.categoryname || response.category?.name || '',
        };
      }

      return null;
    } catch (error) {
      console.error('NetSuite get customer error:', error);
      // Return mock data for development/testing when credentials are not configured
      if ((error as Error).message.includes('credentials not configured')) {
        const mockCustomers = this.getMockCustomers('');
        return mockCustomers.find(c => c.id === id) || null;
      }
      throw error;
    }
  }

  private getMockCustomers(query: string): NetSuiteCustomer[] {
    // Mock data for development/testing with realistic NetSuite UID format
    const mockData: NetSuiteCustomer[] = [
      {
        id: '1001',
        internalId: '1001',
        entityId: 'E9001',
        companyName: 'ABC Mining Corporation',
        displayName: 'ABC Mining Corporation (E9001)',
        address: '123 Mining Road',
        city: 'Perth',
        country: 'Australia',
        industry: 'Mining & Quarrying',
      },
      {
        id: '1002',
        internalId: '1002',
        entityId: 'E9002',
        companyName: 'Global Steel Industries',
        displayName: 'Global Steel Industries (E9002)',
        address: '456 Steel Avenue',
        city: 'Pittsburgh',
        country: 'United States',
        industry: 'Steel & Metal Processing',
      },
      {
        id: '1003',
        internalId: '1003',
        entityId: 'E9003',
        companyName: 'Cement Works Ltd',
        displayName: 'Cement Works Ltd (E9003)',
        address: '789 Industrial Park',
        city: 'Mumbai',
        country: 'India',
        industry: 'Cement',
      },
      {
        id: '1004',
        internalId: '1004',
        entityId: 'E9004',
        companyName: 'PowerGen Energy Solutions',
        displayName: 'PowerGen Energy Solutions (E9004)',
        address: '321 Energy Boulevard',
        city: 'Houston',
        country: 'United States',
        industry: 'Power Generation',
      },
      {
        id: '1005',
        internalId: '1005',
        entityId: 'E9005',
        companyName: 'Marine Services International',
        displayName: 'Marine Services International (E9005)',
        address: '555 Harbor Drive',
        city: 'Singapore',
        country: 'Singapore',
        industry: 'Marine',
      },
    ];

    if (!query || query.length < 2) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    return mockData.filter(
      (customer) =>
        customer.companyName.toLowerCase().includes(lowerQuery) ||
        customer.entityId.toLowerCase().includes(lowerQuery) ||
        customer.city.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Upload PDF and attach to customer record via RESTlet
   * The RESTlet must be deployed in NetSuite (see documentation)
   * @param customerId - NetSuite internal customer ID
   * @param pdfBuffer - PDF file as Buffer
   * @param fileName - Name for the file in NetSuite
   * @param metadata - Additional metadata to store
   */
  async waUploadPdfToCustomer(
    customerId: string,
    pdfBuffer: Buffer,
    fileName: string,
    metadata: {
      caseStudyId: string;
      caseStudyTitle: string;
      caseType: string;
      publishedAt: string;
      createdBy: string;
    }
  ): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
      // RESTlet endpoint for file upload (must be configured in NetSuite)
      const restletUrl = process.env.NETSUITE_RESTLET_URL;

      if (!restletUrl) {
        console.warn('NetSuite RESTlet URL not configured, skipping PDF upload');
        return { success: false, error: 'RESTlet URL not configured' };
      }

      // Convert PDF to base64
      const pdfBase64 = pdfBuffer.toString('base64');

      // Prepare payload for RESTlet
      const payload = {
        action: 'uploadAndAttach',
        customerId: customerId,
        fileName: fileName,
        fileContent: pdfBase64,
        fileType: 'PDF',
        folderId: process.env.NETSUITE_CASE_STUDY_FOLDER_ID || '', // Folder in File Cabinet
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          source: 'ICA Case Study Builder',
        },
      };

      // Make request to RESTlet
      const authHeader = this.generateOAuthHeader('POST', restletUrl);

      const response = await fetch(restletUrl, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-NetSuite-AccountId': this.config.accountId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('NetSuite RESTlet error:', errorText);
        return { success: false, error: `RESTlet error: ${response.status}` };
      }

      const result = await response.json();

      if (result.success) {
        console.log(`PDF uploaded to NetSuite: fileId=${result.fileId}, customerId=${customerId}`);
        return { success: true, fileId: result.fileId };
      } else {
        return { success: false, error: result.error || 'Unknown error' };
      }
    } catch (error) {
      console.error('NetSuite PDF upload error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update customer record with case study metadata (without file)
   * Uses standard REST API to add custom field data
   */
  async waUpdateCustomerCaseStudyMetadata(
    customerId: string,
    metadata: {
      caseStudyId: string;
      caseStudyTitle: string;
      caseStudyUrl?: string;
      publishedAt: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // This updates a custom field on the customer record
      // Requires custom field setup in NetSuite: custentity_case_studies (text/JSON)
      const response = await this.makeRequest(
        `/record/v1/customer/${customerId}`,
        'PATCH',
        {
          custentity_last_case_study_id: metadata.caseStudyId,
          custentity_last_case_study_title: metadata.caseStudyTitle,
          custentity_last_case_study_date: metadata.publishedAt,
          custentity_last_case_study_url: metadata.caseStudyUrl || '',
        }
      );

      return { success: true };
    } catch (error) {
      console.error('NetSuite metadata update error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Search items with caching for fast performance
   * Same optimization as searchCustomers
   */
  async searchItems(query: string): Promise<any[]> {
    try {
      // Sanitize and validate input
      const sanitizedQuery = this.sanitizeSearchInput(query);

      // Validate minimum length after sanitization
      if (sanitizedQuery.length < 2) {
        return [];
      }

      console.log(`[NetSuite] Searching items for query: "${sanitizedQuery}"`);

      // Try Redis cache first (chunked to handle Upstash 10MB limit)
      const cacheKey = 'netsuite:items';
      let allItems: any[] | null = await redisCache.getChunked<any>(cacheKey);

      if (!allItems) {
        // Fetch from RESTlet API
        const restletUrl = process.env.NETSUITE_RESTLET_URL;

        if (!restletUrl) {
          throw new Error('NETSUITE_RESTLET_URL not configured');
        }

        // Build URL for getting all items
        const url = `${restletUrl}&waType=item`;
        const authHeader = this.generateOAuthHeader('GET', url);

        console.log('[NetSuite] Fetching all items from RESTlet (this may take ~50 seconds)...');
        const startTime = Date.now();

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(120000), // 120 seconds
        });

        if (!response.ok) {
          throw new Error(`NetSuite RESTlet error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[NetSuite] Fetched ${Array.isArray(data) ? data.length : 0} items in ${elapsed}s`);

        if (!Array.isArray(data)) {
          throw new Error('Unexpected response format from RESTlet');
        }

        // Store only essential fields and use chunked caching for Upstash 10MB limit
        const essentialItems = data.map((i: any) => ({
          internalid: i.internalid,
          itemid: i.itemid,
          displayname: i.displayname || '',
          description: i.description || '',
          type: i.type || '',
          baseprice: i.baseprice || '',
        }));

        // Cache using chunked storage (splits into ~5MB chunks) for 1 week (604800 seconds)
        const cacheSuccess = await redisCache.setChunked(cacheKey, essentialItems, 604800);
        if (cacheSuccess) {
          console.log(`[NetSuite] Cached ${essentialItems.length} items (chunked) in Redis`);
        } else {
          console.error(`[NetSuite] Failed to cache items in Redis`);
        }

        allItems = essentialItems;
      }

      // Filter items client-side based on search query
      // Search in: item ID, item name, description, type
      const lowerQuery = sanitizedQuery.toLowerCase();
      const filteredItems = allItems
        .filter((item: any) => {
          const itemId = (item.itemid || '').toLowerCase();
          const itemName = (item.displayname || '').toLowerCase();
          const description = (item.description || '').toLowerCase();
          const type = (item.type || '').toLowerCase();

          return itemId.includes(lowerQuery) ||
                 itemName.includes(lowerQuery) ||
                 description.includes(lowerQuery) ||
                 type.includes(lowerQuery);
        })
        .slice(0, 10); // Return max 10 results

      console.log(`[NetSuite] Found ${filteredItems.length} matching items`);

      // Transform to consistent format with unique IDs
      return filteredItems.map((item: any, index: number) => {
        const itemId = item.itemid || item.internalid || '';
        const internalId = item.internalid || '';

        // Generate truly unique ID: hash of all identifying fields + index
        const uniqueId = `${internalId}-${itemId}-${index}-${Date.now()}`;

        return {
          id: uniqueId,
          internalId: internalId,
          itemId: itemId,
          itemName: item.displayname || item.itemid || '',
          displayName: item.displayname || item.itemid || '',
          description: item.description || '',
          type: item.type || '',
          baseprice: item.baseprice || '',
        };
      });

    } catch (error) {
      console.error('[NetSuite] Item search error:', error);
      throw error;
    }
  }

  /**
   * Preload cache in background on server startup
   * This makes all searches instant from the first query
   */
  async preloadCache(): Promise<void> {
    try {
      const restletUrl = process.env.NETSUITE_RESTLET_URL;
      const dataSource = process.env.NETSUITE_DATA_SOURCE || 'auto';

      // Only preload if using NetSuite data source
      if (!restletUrl || dataSource === 'mock') {
        console.log('[NetSuite] Preload skipped - using mock data or NetSuite not configured');
        return;
      }

      console.log('[NetSuite] 🚀 Starting background cache preload...');
      console.log('[NetSuite] This will take ~70 seconds (customers + items)');
      const totalStart = Date.now();

      // Preload customers
      try {
        const customerUrl = `${restletUrl}&waType=customer`;
        const customerAuthHeader = this.generateOAuthHeader('GET', customerUrl);

        console.log('[NetSuite] Preloading customers...');
        const customerStart = Date.now();

        const customerResponse = await fetch(customerUrl, {
          method: 'GET',
          headers: {
            'Authorization': customerAuthHeader,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(120000),
        });

        if (customerResponse.ok) {
          const customerData = await customerResponse.json();
          if (Array.isArray(customerData)) {
            // Store only essential fields and use chunked caching for Upstash 10MB limit
            // Full data is ~25MB, essential fields ~10MB, chunked to stay under limit
            const essentialData = customerData.map((c: any) => ({
              internalid: c.internalid,
              entityid: c.entityid,
              companyname: c.companyname,
              email: c.email || '',
              phone: c.phone || '',
              billcity: c.billcity || '',
              billcountrycode: c.billcountrycode || '',
              // Per API docs: Use custentity_wag_industryclass_primename for industry name
              category: c.custentity_wag_industryclass_primename || c.categoryname || c.category || '',
              categoryname: c.categoryname || '',
              industryid: c.custentity_wag_industryclass_prime || '',
              subsidiaryname: c.subsidiarynohierarchyname || c.subsidiary || '',
              currencyname: c.currencyname || '',
              address: c.address || '',
            }));

            // Cache using chunked storage (splits into ~5MB chunks) for 1 week
            const cacheSuccess = await redisCache.setChunked('netsuite:customers', essentialData, 604800);
            const elapsed = ((Date.now() - customerStart) / 1000).toFixed(2);
            if (cacheSuccess) {
              console.log(`[NetSuite] ✅ Preloaded ${essentialData.length} customers in ${elapsed}s (chunked)`);
            } else {
              console.error(`[NetSuite] ❌ Failed to cache customers`);
            }
          } else {
            console.error('[NetSuite] Customer preload: unexpected response format', typeof customerData);
          }
        } else {
          const errorText = await customerResponse.text();
          console.error(`[NetSuite] Customer preload failed: ${customerResponse.status} ${customerResponse.statusText}`);
          console.error(`[NetSuite] Error details: ${errorText.substring(0, 500)}`);
        }
      } catch (error) {
        console.error('[NetSuite] Customer preload error:', error);
      }

      // Wait 3 seconds between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Preload items
      try {
        const itemUrl = `${restletUrl}&waType=item`;
        const itemAuthHeader = this.generateOAuthHeader('GET', itemUrl);

        console.log('[NetSuite] Preloading items...');
        const itemStart = Date.now();

        const itemResponse = await fetch(itemUrl, {
          method: 'GET',
          headers: {
            'Authorization': itemAuthHeader,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(120000),
        });

        if (itemResponse.ok) {
          const itemData = await itemResponse.json();
          if (Array.isArray(itemData)) {
            // Store only essential fields and use chunked caching for Upstash 10MB limit
            const essentialItems = itemData.map((i: any) => ({
              internalid: i.internalid,
              itemid: i.itemid,
              displayname: i.displayname || '',
              description: i.description || '',
              type: i.type || '',
              baseprice: i.baseprice || '',
            }));

            // Cache using chunked storage (splits into ~5MB chunks) for 1 week
            const cacheSuccess = await redisCache.setChunked('netsuite:items', essentialItems, 604800);
            const elapsed = ((Date.now() - itemStart) / 1000).toFixed(2);
            if (cacheSuccess) {
              console.log(`[NetSuite] ✅ Preloaded ${essentialItems.length} items in ${elapsed}s (chunked)`);
            } else {
              console.error(`[NetSuite] ❌ Failed to cache items`);
            }
          }
        } else {
          const errorText = await itemResponse.text();
          console.error(`[NetSuite] Item preload failed: ${itemResponse.status} ${itemResponse.statusText}`);
          console.error(`[NetSuite] Error details: ${errorText.substring(0, 500)}`);
        }
      } catch (error) {
        console.error('[NetSuite] Item preload error:', error);
      }

      const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(2);
      console.log(`[NetSuite] 🎉 Cache preload complete in ${totalElapsed}s`);
      console.log('[NetSuite] All searches will now be INSTANT! ⚡');
      console.log('[NetSuite] Cache valid for 1 week');

    } catch (error) {
      console.error('[NetSuite] Preload cache error:', error);
    }
  }

  /**
   * Search NetSuite employees (waType=user)
   * NOTE: Currently returns 0 results due to RESTlet bug (currency field issue)
   * Bug location: WAICAIntegration.RL.js:150 - remove currency field from employee search
   * This method is ready for when the bug is fixed
   */
  async searchEmployees(): Promise<NetSuiteEmployee[]> {
    try {
      console.log('[NetSuite] Fetching ALL employees from RESTlet...');

      // Try Redis cache first (chunked to handle Upstash 10MB limit)
      const cacheKey = 'netsuite:employees';
      let allEmployees: any[] | null = await redisCache.getChunked<any>(cacheKey);

      if (!allEmployees) {
        // Fetch from RESTlet API
        const restletUrl = process.env.NETSUITE_RESTLET_URL;

        if (!restletUrl) {
          throw new Error('NETSUITE_RESTLET_URL not configured');
        }

        // Build URL for getting all employees (waType=user)
        const url = `${restletUrl}&waType=user`;
        const authHeader = this.generateOAuthHeader('GET', url);

        console.log('[NetSuite] Fetching employees from RESTlet...');
        const startTime = Date.now();

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(120000), // 120 seconds
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`NetSuite RESTlet error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        // Check for error response (bug in RESTlet)
        if (data.status === 'error') {
          console.error(`[NetSuite] Employee fetch error: ${data.details}`);
          console.log('[NetSuite] This is likely the currency field bug in WAICAIntegration.RL.js');
          return []; // Return empty array until bug is fixed
        }

        console.log(`[NetSuite] Fetched ${Array.isArray(data) ? data.length : 0} employees in ${elapsed}s`);

        if (!Array.isArray(data)) {
          console.error('[NetSuite] Unexpected response format from RESTlet:', data);
          return [];
        }

        // Store essential employee fields
        const essentialData = data.map((emp: any) => ({
          internalid: emp.internalid,
          email: emp.email || null,
          firstname: emp.firstname || null,
          middlename: emp.middlename || null,
          lastname: emp.lastname || null,
          phone: emp.phone || null,
          // Subsidiary fields (CRITICAL)
          subsidiarynohierarchy: emp.subsidiarynohierarchy || null,
          subsidiarynohierarchyname: emp.subsidiarynohierarchyname || null,
          department: emp.department || null,
          location: emp.location || null,
        }));

        // Cache using chunked storage for 1 week (604800 seconds)
        const cacheSuccess = await redisCache.setChunked(cacheKey, essentialData, 604800);
        if (cacheSuccess) {
          console.log(`[NetSuite] Cached ${essentialData.length} employees (chunked) in Redis`);
        }

        allEmployees = essentialData;
      } else {
        console.log(`[NetSuite] Retrieved ${allEmployees.length} employees from cache`);
      }

      // Transform to NetSuiteEmployee format
      return allEmployees.map((emp: any) => ({
        id: emp.internalid,
        internalId: emp.internalid,
        email: emp.email,
        firstname: emp.firstname,
        middlename: emp.middlename,
        lastname: emp.lastname,
        phone: emp.phone,
        subsidiarynohierarchy: emp.subsidiarynohierarchy,
        subsidiarynohierarchyname: emp.subsidiarynohierarchyname,
        department: emp.department,
        location: emp.location,
      }));

    } catch (error) {
      console.error('[NetSuite] Employee search error:', error);
      return []; // Return empty array on error (graceful degradation)
    }
  }

  /**
   * Get employee by email (for login matching)
   * Searches through all employees and finds match by email
   */
  async getEmployeeByEmail(email: string): Promise<NetSuiteEmployee | null> {
    try {
      if (!email) {
        return null;
      }

      const normalizedEmail = email.toLowerCase().trim();
      console.log(`[NetSuite] Looking up employee by email: ${normalizedEmail}`);

      // Get all employees (from cache if available)
      const allEmployees = await this.searchEmployees();

      // Find employee with matching email
      const employee = allEmployees.find(
        emp => emp.email?.toLowerCase().trim() === normalizedEmail
      );

      if (employee) {
        console.log(`[NetSuite] Found employee: ${employee.firstname} ${employee.lastname} (${employee.internalId})`);
      } else {
        console.log(`[NetSuite] No employee found for email: ${normalizedEmail}`);
      }

      return employee || null;
    } catch (error) {
      console.error('[NetSuite] Get employee by email error:', error);
      return null;
    }
  }

  /**
   * Get employee by NetSuite internal ID (waType=user&waId={id})
   */
  async getEmployeeById(id: string): Promise<NetSuiteEmployee | null> {
    try {
      const restletUrl = process.env.NETSUITE_RESTLET_URL;

      if (!restletUrl) {
        throw new Error('NETSUITE_RESTLET_URL not configured');
      }

      // Build URL for specific employee
      const url = `${restletUrl}&waType=user&waId=${id}`;
      const authHeader = this.generateOAuthHeader('GET', url);

      console.log(`[NetSuite] Fetching employee ${id} from RESTlet...`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(30000), // 30 seconds
      });

      if (!response.ok) {
        throw new Error(`NetSuite RESTlet error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Check for error response
      if (data.status === 'error') {
        console.error(`[NetSuite] Employee fetch error: ${data.details}`);
        return null;
      }

      // Response is array with single employee
      const emp = Array.isArray(data) ? data[0] : data;

      if (!emp || !emp.internalid) {
        console.log(`[NetSuite] Employee ${id} not found`);
        return null;
      }

      console.log(`[NetSuite] Found employee ${id}: ${emp.firstname} ${emp.lastname}`);

      return {
        id: emp.internalid,
        internalId: emp.internalid,
        email: emp.email || null,
        firstname: emp.firstname || null,
        middlename: emp.middlename || null,
        lastname: emp.lastname || null,
        phone: emp.phone || null,
        subsidiarynohierarchy: emp.subsidiarynohierarchy || null,
        subsidiarynohierarchyname: emp.subsidiarynohierarchyname || null,
        department: emp.department || null,
        location: emp.location || null,
      };

    } catch (error) {
      console.error('[NetSuite] Get employee by ID error:', error);
      return null;
    }
  }

  /**
   * Get cache status for monitoring
   */
  async getCacheStatus(): Promise<{
    customers: { cached: boolean; count: number };
    items: { cached: boolean; count: number };
    employees: { cached: boolean; count: number };
    redis: { connected: boolean; type: 'redis' | 'memory' };
  }> {
    // Check chunked cache metadata for customers, items, and employees
    const [customersMeta, itemsMeta, employeesMeta, redisStatus] = await Promise.all([
      redisCache.get<{ chunkCount: number; totalItems: number }>('netsuite:customers:meta'),
      redisCache.get<{ chunkCount: number; totalItems: number }>('netsuite:items:meta'),
      redisCache.get<{ chunkCount: number; totalItems: number }>('netsuite:employees:meta'),
      redisCache.getStatus()
    ]);

    return {
      customers: {
        cached: customersMeta !== null,
        count: customersMeta?.totalItems || 0,
      },
      items: {
        cached: itemsMeta !== null,
        count: itemsMeta?.totalItems || 0,
      },
      employees: {
        cached: employeesMeta !== null,
        count: employeesMeta?.totalItems || 0,
      },
      redis: {
        connected: redisStatus.connected,
        type: redisStatus.type,
      },
    };
  }

  /**
   * Manually clear cache (for admin/testing purposes)
   */
  async clearCache(): Promise<void> {
    // Clear chunked data for customers, items, and employees
    await Promise.all([
      redisCache.delChunked('netsuite:customers'),
      redisCache.delChunked('netsuite:items'),
      redisCache.delChunked('netsuite:employees'),
    ]);
    console.log('[NetSuite] Cache cleared');
  }
}

export const netsuiteClient = new NetSuiteClient();

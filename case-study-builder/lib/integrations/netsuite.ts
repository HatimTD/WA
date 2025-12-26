import crypto from 'crypto';

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
      'X-NetSuite-AccountId': this.config.accountId,
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
      // Sanitize and validate input
      const sanitizedQuery = this.sanitizeSearchInput(query);

      // Validate minimum length after sanitization
      if (sanitizedQuery.length < 2) {
        return this.getMockCustomers(query);
      }

      // Use SuiteQL for searching customers by Name + UID (entityid)
      // entityid is the customer UID like "E9008y", companyname is the company name
      const suiteqlQuery = `
        SELECT
          id,
          entityid,
          companyname,
          billaddress,
          billcity,
          billcountry,
          category
        FROM
          customer
        WHERE
          LOWER(companyname) LIKE LOWER('%${sanitizedQuery}%')
          OR LOWER(entityid) LIKE LOWER('%${sanitizedQuery}%')
        ORDER BY
          companyname
        LIMIT 10
      `;

      const response = await this.makeRequest('/services/rest/query/v1/suiteql', 'POST', {
        q: suiteqlQuery,
      });

      if (response.items && Array.isArray(response.items)) {
        return response.items.map((item: any) => {
          const companyName = item.companyname || '';
          const entityId = item.entityid || item.id?.toString() || '';
          return {
            id: item.id?.toString() || '',
            internalId: item.id?.toString() || '',
            entityId: entityId,
            companyName: companyName,
            displayName: entityId ? `${companyName} (${entityId})` : companyName,
            address: item.billaddress || '',
            city: item.billcity || '',
            country: item.billcountry || '',
            industry: item.category || '',
          };
        });
      }

      return [];
    } catch (error) {
      console.error('NetSuite search error:', error);
      // Return mock data for development/testing when credentials are not configured
      if ((error as Error).message.includes('credentials not configured')) {
        return this.getMockCustomers(query);
      }
      throw error;
    }
  }

  async getCustomer(id: string): Promise<NetSuiteCustomer | null> {
    try {
      const response = await this.makeRequest(`/services/rest/record/v1/customer/${id}`, 'GET');

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
          industry: response.category?.name || '',
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
        `/services/rest/record/v1/customer/${customerId}`,
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
}

export const netsuiteClient = new NetSuiteClient();

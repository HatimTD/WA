import crypto from 'crypto';

interface NetSuiteConfig {
  accountId: string;
  consumerKey: string;
  consumerSecret: string;
  tokenId: string;
  tokenSecret: string;
}

export interface NetSuiteCustomer {
  id: string;
  internalId: string;
  companyName: string;
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
    // OAuth 1.0 signature generation
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    // OAuth parameters
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: this.config.consumerKey,
      oauth_token: this.config.tokenId,
      oauth_signature_method: 'HMAC-SHA256',
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_version: '1.0',
    };

    // Build the signature base string
    const paramString = Object.keys(oauthParams)
      .sort()
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
      .join('&');

    const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;

    // Generate signing key
    const signingKey = `${encodeURIComponent(this.config.consumerSecret)}&${encodeURIComponent(this.config.tokenSecret)}`;

    // Generate signature
    const signature = crypto.createHmac('sha256', signingKey).update(signatureBaseString).digest('base64');

    // Add signature to OAuth parameters
    oauthParams.oauth_signature = signature;

    // Build Authorization header
    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .sort()
      .map((key) => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');

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

      // Use SuiteQL for searching customers with sanitized input
      const suiteqlQuery = `
        SELECT
          id,
          entityid as internalId,
          companyname as companyName,
          billaddress as address,
          billcity as city,
          billcountry as country,
          category as industry
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
        return response.items.map((item: any) => ({
          id: item.id?.toString() || '',
          internalId: item.internalId || item.id?.toString() || '',
          companyName: item.companyName || item.companyname || '',
          address: item.address || item.billaddress || '',
          city: item.city || item.billcity || '',
          country: item.country || item.billcountry || '',
          industry: item.industry || item.category || '',
        }));
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
        return {
          id: response.id?.toString() || id,
          internalId: response.entityId || response.id?.toString() || id,
          companyName: response.companyName || '',
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
    // Mock data for development/testing
    const mockData: NetSuiteCustomer[] = [
      {
        id: '1001',
        internalId: 'CUST-001',
        companyName: 'ABC Mining Corporation',
        address: '123 Mining Road',
        city: 'Perth',
        country: 'Australia',
        industry: 'Mining & Quarrying',
      },
      {
        id: '1002',
        internalId: 'CUST-002',
        companyName: 'Global Steel Industries',
        address: '456 Steel Avenue',
        city: 'Pittsburgh',
        country: 'United States',
        industry: 'Steel & Metal Processing',
      },
      {
        id: '1003',
        internalId: 'CUST-003',
        companyName: 'Cement Works Ltd',
        address: '789 Industrial Park',
        city: 'Mumbai',
        country: 'India',
        industry: 'Cement',
      },
      {
        id: '1004',
        internalId: 'CUST-004',
        companyName: 'PowerGen Energy Solutions',
        address: '321 Energy Boulevard',
        city: 'Houston',
        country: 'United States',
        industry: 'Power Generation',
      },
      {
        id: '1005',
        internalId: 'CUST-005',
        companyName: 'Marine Services International',
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
        customer.internalId.toLowerCase().includes(lowerQuery) ||
        customer.city.toLowerCase().includes(lowerQuery)
    );
  }
}

export const netsuiteClient = new NetSuiteClient();

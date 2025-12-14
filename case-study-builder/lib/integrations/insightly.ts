/**
 * Insightly CRM Integration (BRD 5.9 - CRM Integration)
 *
 * Insightly API v3.1 Documentation: https://api.insightly.com/v3.1/Help
 *
 * Features:
 * - Search organizations (customers)
 * - Search contacts
 * - Create/update opportunities from case studies
 * - Sync case study data to CRM
 */

interface InsightlyConfig {
  apiKey: string;
  pod: string; // na1, na2, au1, eu1, etc.
}

export interface InsightlyOrganization {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  industry: string;
  phone: string;
  website: string;
}

export interface InsightlyContact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  organizationId: number | null;
  organizationName: string;
}

export interface InsightlyOpportunity {
  id?: number;
  name: string;
  organizationId: number | null;
  probability: number;
  bidAmount: number;
  stage: string;
  description: string;
  customFields?: Record<string, any>;
}

export interface InsightlyCustomField {
  fieldName: string;
  fieldValue: any;
}

class InsightlyClient {
  private config: InsightlyConfig;
  private baseUrl: string;
  private authHeader: string;

  constructor() {
    this.config = {
      apiKey: process.env.INSIGHTLY_API_KEY || '',
      pod: process.env.INSIGHTLY_POD || 'na1',
    };
    this.baseUrl = `https://api.${this.config.pod}.insightly.com/v3.1`;
    // Insightly uses Basic auth with API key as username and empty password
    this.authHeader = `Basic ${Buffer.from(`${this.config.apiKey}:`).toString('base64')}`;
  }

  private isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('Insightly credentials not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Insightly API error: ${response.status} - ${errorText}`);
      }

      // Handle empty responses (e.g., 204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      console.error('[Insightly] API Request failed:', error);
      throw error;
    }
  }

  /**
   * Search organizations (customers) by name
   */
  async searchOrganizations(query: string): Promise<InsightlyOrganization[]> {
    try {
      if (!this.isConfigured()) {
        return this.getMockOrganizations(query);
      }

      // Use OData filter for searching
      const encodedQuery = encodeURIComponent(query);
      const endpoint = `/Organisations?$filter=contains(ORGANISATION_NAME,'${encodedQuery}')&$top=10`;

      const response = await this.makeRequest<any[]>(endpoint);

      return response.map((org: any) => ({
        id: org.ORGANISATION_ID,
        name: org.ORGANISATION_NAME || '',
        address: this.getAddressField(org.ADDRESSES, 'ADDRESS_STREET') || '',
        city: this.getAddressField(org.ADDRESSES, 'ADDRESS_CITY') || '',
        state: this.getAddressField(org.ADDRESSES, 'ADDRESS_STATE') || '',
        country: this.getAddressField(org.ADDRESSES, 'ADDRESS_COUNTRY') || '',
        industry: this.getCustomField(org.CUSTOMFIELDS, 'Industry') || '',
        phone: org.PHONE || '',
        website: org.WEBSITE || '',
      }));
    } catch (error) {
      console.error('[Insightly] Search organizations error:', error);
      if ((error as Error).message.includes('credentials not configured')) {
        return this.getMockOrganizations(query);
      }
      throw error;
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganization(id: number): Promise<InsightlyOrganization | null> {
    try {
      if (!this.isConfigured()) {
        const mockOrgs = this.getMockOrganizations('');
        return mockOrgs.find(o => o.id === id) || null;
      }

      const response = await this.makeRequest<any>(`/Organisations/${id}`);

      return {
        id: response.ORGANISATION_ID,
        name: response.ORGANISATION_NAME || '',
        address: this.getAddressField(response.ADDRESSES, 'ADDRESS_STREET') || '',
        city: this.getAddressField(response.ADDRESSES, 'ADDRESS_CITY') || '',
        state: this.getAddressField(response.ADDRESSES, 'ADDRESS_STATE') || '',
        country: this.getAddressField(response.ADDRESSES, 'ADDRESS_COUNTRY') || '',
        industry: this.getCustomField(response.CUSTOMFIELDS, 'Industry') || '',
        phone: response.PHONE || '',
        website: response.WEBSITE || '',
      };
    } catch (error) {
      console.error('[Insightly] Get organization error:', error);
      return null;
    }
  }

  /**
   * Search contacts by name or email
   */
  async searchContacts(query: string): Promise<InsightlyContact[]> {
    try {
      if (!this.isConfigured()) {
        return this.getMockContacts(query);
      }

      const encodedQuery = encodeURIComponent(query);
      const endpoint = `/Contacts?$filter=contains(FIRST_NAME,'${encodedQuery}') or contains(LAST_NAME,'${encodedQuery}') or contains(EMAIL_ADDRESS,'${encodedQuery}')&$top=10`;

      const response = await this.makeRequest<any[]>(endpoint);

      return response.map((contact: any) => ({
        id: contact.CONTACT_ID,
        firstName: contact.FIRST_NAME || '',
        lastName: contact.LAST_NAME || '',
        email: contact.EMAIL_ADDRESS || '',
        phone: contact.PHONE || '',
        title: contact.TITLE || '',
        organizationId: contact.ORGANISATION_ID || null,
        organizationName: contact.ORGANISATION_NAME || '',
      }));
    } catch (error) {
      console.error('[Insightly] Search contacts error:', error);
      if ((error as Error).message.includes('credentials not configured')) {
        return this.getMockContacts(query);
      }
      throw error;
    }
  }

  /**
   * Create an opportunity from a case study
   */
  async createOpportunity(opportunity: InsightlyOpportunity): Promise<{ id: number }> {
    try {
      if (!this.isConfigured()) {
        return { id: Math.floor(Math.random() * 100000) };
      }

      const payload = {
        OPPORTUNITY_NAME: opportunity.name,
        ORGANISATION_ID: opportunity.organizationId,
        PROBABILITY: opportunity.probability,
        BID_AMOUNT: opportunity.bidAmount,
        OPPORTUNITY_STATE: 'Open',
        PIPELINE_ID: null, // Will use default pipeline
        STAGE_ID: null, // Will use default stage
        OPPORTUNITY_DETAILS: opportunity.description,
        CUSTOMFIELDS: opportunity.customFields
          ? Object.entries(opportunity.customFields).map(([key, value]) => ({
              CUSTOM_FIELD_ID: key,
              FIELD_VALUE: value,
            }))
          : [],
      };

      const response = await this.makeRequest<any>('/Opportunities', 'POST', payload);

      return { id: response.OPPORTUNITY_ID };
    } catch (error) {
      console.error('[Insightly] Create opportunity error:', error);
      throw error;
    }
  }

  /**
   * Update an existing opportunity
   */
  async updateOpportunity(id: number, opportunity: Partial<InsightlyOpportunity>): Promise<void> {
    try {
      if (!this.isConfigured()) {
        return;
      }

      const payload: Record<string, any> = {
        OPPORTUNITY_ID: id,
      };

      if (opportunity.name) payload.OPPORTUNITY_NAME = opportunity.name;
      if (opportunity.probability !== undefined) payload.PROBABILITY = opportunity.probability;
      if (opportunity.bidAmount !== undefined) payload.BID_AMOUNT = opportunity.bidAmount;
      if (opportunity.description) payload.OPPORTUNITY_DETAILS = opportunity.description;

      await this.makeRequest(`/Opportunities`, 'PUT', payload);
    } catch (error) {
      console.error('[Insightly] Update opportunity error:', error);
      throw error;
    }
  }

  /**
   * Sync a case study to Insightly as an opportunity
   * Returns the Insightly opportunity ID
   */
  async syncCaseStudy(caseStudy: {
    id: string;
    customerName: string;
    title: string;
    industry: string;
    location: string;
    financialImpact?: number;
    status: string;
  }): Promise<{ opportunityId: number; synced: boolean }> {
    try {
      // First, try to find the organization by customer name
      const orgs = await this.searchOrganizations(caseStudy.customerName);
      const organizationId = orgs.length > 0 ? orgs[0].id : null;

      // Create opportunity with case study data
      const result = await this.createOpportunity({
        name: `Case Study: ${caseStudy.title}`,
        organizationId,
        probability: caseStudy.status === 'APPROVED' ? 100 : 50,
        bidAmount: caseStudy.financialImpact || 0,
        stage: caseStudy.status === 'APPROVED' ? 'Won' : 'In Progress',
        description: `
Case Study ID: ${caseStudy.id}
Industry: ${caseStudy.industry}
Location: ${caseStudy.location}
Status: ${caseStudy.status}
        `.trim(),
        customFields: {
          CaseStudyId: caseStudy.id,
          Industry: caseStudy.industry,
          Location: caseStudy.location,
        },
      });

      return {
        opportunityId: result.id,
        synced: true,
      };
    } catch (error) {
      console.error('[Insightly] Sync case study error:', error);
      return {
        opportunityId: 0,
        synced: false,
      };
    }
  }

  /**
   * Attach a PDF file to an opportunity
   * BRD 3.4D - PDF Push to CRM on publication
   */
  async attachPDFToOpportunity(
    opportunityId: number,
    pdfBuffer: Buffer,
    fileName: string
  ): Promise<{ success: boolean; fileId?: number; error?: string }> {
    try {
      if (!this.isConfigured()) {
        console.log('[Insightly] Mock: Would attach PDF to opportunity', opportunityId);
        return { success: true, fileId: Math.floor(Math.random() * 100000) };
      }

      // Insightly File Attachment API endpoint
      const url = `${this.baseUrl}/FileAttachments`;

      // Create multipart form data
      const boundary = '----InsightlyBoundary' + Date.now();
      const contentType = `multipart/form-data; boundary=${boundary}`;

      // Build multipart body
      const body = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
        'Content-Type: application/pdf',
        '',
        pdfBuffer.toString('base64'),
        `--${boundary}`,
        'Content-Disposition: form-data; name="FILE_NAME"',
        '',
        fileName,
        `--${boundary}`,
        'Content-Disposition: form-data; name="CONTENT_TYPE"',
        '',
        'application/pdf',
        `--${boundary}--`,
      ].join('\r\n');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': contentType,
        },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload file: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const fileId = result.FILE_ATTACHMENT_ID;

      // Link the file to the opportunity
      await this.linkFileToOpportunity(fileId, opportunityId);

      return { success: true, fileId };
    } catch (error) {
      console.error('[Insightly] Attach PDF error:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Link an uploaded file to an opportunity
   */
  private async linkFileToOpportunity(fileId: number, opportunityId: number): Promise<void> {
    try {
      if (!this.isConfigured()) {
        return;
      }

      const endpoint = `/Opportunities/${opportunityId}/FileAttachments`;
      const payload = {
        FILE_ATTACHMENT_ID: fileId,
      };

      await this.makeRequest(endpoint, 'POST', payload);
    } catch (error) {
      console.error('[Insightly] Link file error:', error);
      throw error;
    }
  }

  /**
   * Sync case study with PDF attachment
   * This is the main method for BRD 3.4D - PDF Push to CRM
   */
  async syncCaseStudyWithPDF(
    caseStudy: {
      id: string;
      customerName: string;
      title: string;
      industry: string;
      location: string;
      financialImpact?: number;
      status: string;
    },
    pdfBuffer: Buffer,
    fileName: string
  ): Promise<{
    opportunityId: number;
    fileId?: number;
    synced: boolean;
    pdfAttached: boolean;
  }> {
    try {
      // First sync the case study data
      const syncResult = await this.syncCaseStudy(caseStudy);

      if (!syncResult.synced) {
        return {
          opportunityId: 0,
          synced: false,
          pdfAttached: false,
        };
      }

      // Then attach the PDF
      const attachResult = await this.attachPDFToOpportunity(
        syncResult.opportunityId,
        pdfBuffer,
        fileName
      );

      return {
        opportunityId: syncResult.opportunityId,
        fileId: attachResult.fileId,
        synced: true,
        pdfAttached: attachResult.success,
      };
    } catch (error) {
      console.error('[Insightly] Sync with PDF error:', error);
      return {
        opportunityId: 0,
        synced: false,
        pdfAttached: false,
      };
    }
  }

  /**
   * Test the connection to Insightly
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Insightly API key not configured',
        };
      }

      // Try to get user info as a connection test
      await this.makeRequest('/Users/Me');

      return {
        success: true,
        message: 'Successfully connected to Insightly',
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${(error as Error).message}`,
      };
    }
  }

  // Helper methods
  private getAddressField(addresses: any[] | undefined, field: string): string {
    if (!addresses || addresses.length === 0) return '';
    const primary = addresses.find((a: any) => a.ADDRESS_TYPE === 'Work') || addresses[0];
    return primary?.[field] || '';
  }

  private getCustomField(customFields: any[] | undefined, fieldName: string): string {
    if (!customFields) return '';
    const field = customFields.find((cf: any) => cf.CUSTOM_FIELD_ID === fieldName);
    return field?.FIELD_VALUE || '';
  }

  // Mock data for development/testing
  private getMockOrganizations(query: string): InsightlyOrganization[] {
    const mockData: InsightlyOrganization[] = [
      {
        id: 1001,
        name: 'ABC Mining Corporation',
        address: '123 Mining Road',
        city: 'Perth',
        state: 'WA',
        country: 'Australia',
        industry: 'Mining & Quarrying',
        phone: '+61 8 1234 5678',
        website: 'www.abcmining.com',
      },
      {
        id: 1002,
        name: 'Global Steel Industries',
        address: '456 Steel Avenue',
        city: 'Pittsburgh',
        state: 'PA',
        country: 'United States',
        industry: 'Steel & Metal Processing',
        phone: '+1 412 555 0123',
        website: 'www.globalsteel.com',
      },
      {
        id: 1003,
        name: 'Cement Works Ltd',
        address: '789 Industrial Park',
        city: 'Mumbai',
        state: 'MH',
        country: 'India',
        industry: 'Cement',
        phone: '+91 22 1234 5678',
        website: 'www.cementworks.in',
      },
      {
        id: 1004,
        name: 'PowerGen Energy Solutions',
        address: '321 Energy Boulevard',
        city: 'Houston',
        state: 'TX',
        country: 'United States',
        industry: 'Power Generation',
        phone: '+1 713 555 0456',
        website: 'www.powergen.com',
      },
      {
        id: 1005,
        name: 'Marine Services International',
        address: '555 Harbor Drive',
        city: 'Singapore',
        state: '',
        country: 'Singapore',
        industry: 'Marine',
        phone: '+65 6234 5678',
        website: 'www.marineservices.sg',
      },
    ];

    if (!query || query.length < 2) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    return mockData.filter(
      (org) =>
        org.name.toLowerCase().includes(lowerQuery) ||
        org.city.toLowerCase().includes(lowerQuery) ||
        org.industry.toLowerCase().includes(lowerQuery)
    );
  }

  private getMockContacts(query: string): InsightlyContact[] {
    const mockData: InsightlyContact[] = [
      {
        id: 2001,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@abcmining.com',
        phone: '+61 8 1234 5679',
        title: 'Operations Manager',
        organizationId: 1001,
        organizationName: 'ABC Mining Corporation',
      },
      {
        id: 2002,
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@globalsteel.com',
        phone: '+1 412 555 0124',
        title: 'Technical Director',
        organizationId: 1002,
        organizationName: 'Global Steel Industries',
      },
      {
        id: 2003,
        firstName: 'Rajesh',
        lastName: 'Patel',
        email: 'rajesh.patel@cementworks.in',
        phone: '+91 22 1234 5679',
        title: 'Plant Manager',
        organizationId: 1003,
        organizationName: 'Cement Works Ltd',
      },
    ];

    if (!query || query.length < 2) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    return mockData.filter(
      (contact) =>
        contact.firstName.toLowerCase().includes(lowerQuery) ||
        contact.lastName.toLowerCase().includes(lowerQuery) ||
        contact.email.toLowerCase().includes(lowerQuery)
    );
  }
}

export const insightlyClient = new InsightlyClient();

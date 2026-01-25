import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('id');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required. Usage: ?id=15811889' }, { status: 400 });
    }

    // Fetch from RESTlet API - specific customer by ID
    const restletUrl = process.env.NETSUITE_RESTLET_URL;

    if (!restletUrl) {
      return NextResponse.json({ error: 'NETSUITE_RESTLET_URL not configured' }, { status: 500 });
    }

    // Build URL for getting specific customer by ID (per documentation)
    const url = `${restletUrl}&waType=customer&waId=${customerId}`;

    // Generate OAuth header
    const config = {
      accountId: process.env.NETSUITE_ACCOUNT_ID || '',
      consumerKey: process.env.NETSUITE_CONSUMER_KEY || '',
      consumerSecret: process.env.NETSUITE_CONSUMER_SECRET || '',
      tokenId: process.env.NETSUITE_TOKEN_ID || '',
      tokenSecret: process.env.NETSUITE_TOKEN_SECRET || '',
    };

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: config.consumerKey,
      oauth_token: config.tokenId,
      oauth_signature_method: 'HMAC-SHA256',
      oauth_timestamp: timestamp,
      oauth_nonce: nonce,
      oauth_version: '1.0',
    };

    const allParams: Record<string, string> = { ...oauthParams };
    urlObj.searchParams.forEach((value, key) => {
      allParams[key] = value;
    });

    const paramString = Object.keys(allParams)
      .sort()
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
      .join('&');

    const signatureBaseString = `GET&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;
    const signingKey = `${encodeURIComponent(config.consumerSecret)}&${encodeURIComponent(config.tokenSecret)}`;
    const signature = crypto.createHmac('sha256', signingKey).update(signatureBaseString).digest('base64');

    oauthParams.oauth_signature = signature;

    const headerParams = Object.keys(oauthParams)
      .sort()
      .map((key) => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
      .join(',');

    const authHeader = `OAuth realm="${config.accountId}",${headerParams}`;

    console.log(`[Debug] Fetching customer ${customerId} from NetSuite...`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: `NetSuite RESTlet error: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();

    // The API returns an array even for single customer
    const customer = Array.isArray(data) ? data[0] : data;

    if (!customer) {
      return NextResponse.json({
        error: `Customer ${customerId} not found`,
        rawResponse: data
      }, { status: 404 });
    }

    // Return ALL fields from the customer record
    return NextResponse.json({
      success: true,
      customerId: customerId,
      totalFieldsReturned: Object.keys(customer).length,
      allFields: customer,
      // List all field names for easy reference
      fieldNames: Object.keys(customer).sort(),
      // Highlight potential industry fields
      industryFieldAnalysis: {
        category: customer.category ?? 'NOT PRESENT',
        custentity_wa_industry: customer.custentity_wa_industry ?? 'NOT PRESENT',
        waIndustryId: customer.waIndustryId ?? 'NOT PRESENT',
        custentity_waindustry: customer.custentity_waindustry ?? 'NOT PRESENT',
        industry: customer.industry ?? 'NOT PRESENT',
        custentity_industry: customer.custentity_industry ?? 'NOT PRESENT',
      },
      // Show all custom entity fields (custentity_*)
      customEntityFields: Object.keys(customer)
        .filter(key => key.toLowerCase().startsWith('custentity'))
        .reduce((obj: any, key) => {
          obj[key] = customer[key];
          return obj;
        }, {}),
    }, { status: 200 });

  } catch (error) {
    console.error('[Debug] Error fetching customer:', error);
    return NextResponse.json({
      error: (error as Error).message,
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { waSearchCustomers, waSearchItems, waGetCustomer, waGetItem, waGetDataSourceStatus } from '@/lib/integrations/netsuite-dual-source';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const testType = searchParams.get('type') || 'customer';
    const specificId = searchParams.get('id') || '';

    // Get data source status
    const dataSourceStatus = await waGetDataSourceStatus();

    console.log('[NetSuite Test] Data source:', dataSourceStatus.activeSource);
    console.log('[NetSuite Test] Type:', testType, 'ID:', specificId || 'all');

    try {
      let data: any;

      // Fetch data based on type and ID
      if (testType === 'customer') {
        if (specificId) {
          data = await waGetCustomer(specificId);
          if (!data) {
            return NextResponse.json({
              success: false,
              message: `Customer ${specificId} not found`,
              error: 'Customer not found',
              dataSource: dataSourceStatus.activeSource,
            });
          }
        } else {
          // Search all customers (use empty query to get sample)
          data = await waSearchCustomers('');
          // If empty, try a broad search
          if (data.length === 0) {
            data = await waSearchCustomers('a');
          }
        }
      } else if (testType === 'item') {
        if (specificId) {
          data = await waGetItem(specificId);
          if (!data) {
            return NextResponse.json({
              success: false,
              message: `Item ${specificId} not found`,
              error: 'Item not found',
              dataSource: dataSourceStatus.activeSource,
            });
          }
        } else {
          // Search all items (use empty query to get sample)
          data = await waSearchItems('');
          // If empty, try a broad search
          if (data.length === 0) {
            data = await waSearchItems('a');
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully fetched ${testType}${specificId ? ` with ID ${specificId}` : 's'} from ${dataSourceStatus.activeSource}`,
        data,
        dataSource: dataSourceStatus.activeSource,
        dataSourceStatus,
        debugInfo: {
          timestamp: new Date().toISOString(),
          source: dataSourceStatus.activeSource,
          configured: dataSourceStatus.configured,
        },
      });
    } catch (error) {
      console.error('[NetSuite Test] Error:', error);
      return NextResponse.json({
        success: false,
        message: 'Request failed',
        error: (error as Error).message,
        dataSource: dataSourceStatus.activeSource,
        debugInfo: {
          timestamp: new Date().toISOString(),
          source: dataSourceStatus.activeSource,
        },
      });
    }
  } catch (error) {
    console.error('[API] NetSuite test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Request failed',
      error: (error as Error).message,
      debugInfo: {
        timestamp: new Date().toISOString(),
        method: 'GET',
        url: 'N/A',
      },
    });
  }
}

/**
 * Generate OAuth 1.0 Authorization header for NetSuite RESTlet
 */
function generateOAuthHeader(
  method: string,
  url: string,
  config: {
    accountId: string;
    consumerKey: string;
    consumerSecret: string;
    tokenId: string;
    tokenSecret: string;
  }
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');

  // Parse URL
  const urlObj = new URL(url);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

  // OAuth parameters
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.consumerKey,
    oauth_token: config.tokenId,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
  };

  // Combine OAuth params with URL query params
  const allParams: Record<string, string> = { ...oauthParams };
  urlObj.searchParams.forEach((value, key) => {
    allParams[key] = value;
  });

  // Build parameter string (sorted alphabetically)
  const paramString = Object.keys(allParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
    .join('&');

  // Signature base string
  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;

  // Generate signing key
  const signingKey = `${encodeURIComponent(config.consumerSecret)}&${encodeURIComponent(config.tokenSecret)}`;

  // Generate HMAC-SHA256 signature
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  // Add signature to OAuth parameters
  oauthParams.oauth_signature = signature;

  // Build Authorization header
  const headerParams = Object.keys(oauthParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(',');

  return `OAuth realm="${config.accountId}",${headerParams}`;
}

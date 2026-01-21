/**
 * Test script for NetSuite RESTlet OAuth 1.0 authentication - Version 2
 * Tries POST method and different signature approaches
 */

const crypto = require('crypto');

// NetSuite credentials
const config = {
  accountId: '4129093',
  consumerKey: 'a2a1ff67e62a2f9348df06b6ba0b6567b495930101e2a4998760924c76e10ef3',
  consumerSecret: 'eeaeafe4a99b1c55d6c39b5da5bc80dc586812834a5e0c6cd9194fb4bdee95c9',
  tokenId: 'ff6fe602b352cacb5c3db4e24decf1054469bf2de52b58d8b5602859050b41cc',
  tokenSecret: '4f06dc2928926e05d9ce2f90d12fd5a945bb5fcd7cadd669a37b48f4e7e80fb6',
};

// RESTlet base URL
const RESTLET_URL = 'https://4129093.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=10293&deploy=1';

/**
 * Generate OAuth 1.0 Authorization header
 */
function generateOAuthHeader(method, url) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');

  // Parse URL
  const urlObj = new URL(url);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

  console.log('🔍 Debug - Base URL:', baseUrl);
  console.log('🔍 Debug - Timestamp:', timestamp);
  console.log('🔍 Debug - Nonce:', nonce);

  // OAuth parameters
  const oauthParams = {
    oauth_consumer_key: config.consumerKey,
    oauth_token: config.tokenId,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
  };

  // Combine OAuth params with URL query params
  const allParams = { ...oauthParams };
  urlObj.searchParams.forEach((value, key) => {
    allParams[key] = value;
  });

  console.log('🔍 Debug - All params:', Object.keys(allParams));

  // Build parameter string (sorted alphabetically)
  const paramString = Object.keys(allParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
    .join('&');

  console.log('🔍 Debug - Param string:', paramString.substring(0, 150) + '...');

  // Signature base string
  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;

  console.log('🔍 Debug - Signature base (first 200 chars):', signatureBaseString.substring(0, 200) + '...');

  // Generate signing key
  const signingKey = `${encodeURIComponent(config.consumerSecret)}&${encodeURIComponent(config.tokenSecret)}`;

  // Generate HMAC-SHA256 signature
  const signature = crypto.createHmac('sha256', signingKey).update(signatureBaseString).digest('base64');

  console.log('🔍 Debug - Signature:', signature);

  // Add signature to OAuth parameters
  oauthParams.oauth_signature = signature;

  // Build Authorization header
  const headerParams = Object.keys(oauthParams)
    .sort()
    .map((key) => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(',');

  return `OAuth realm="${config.accountId}",${headerParams}`;
}

/**
 * Test with GET method
 */
async function testGetMethod(params) {
  const url = new URL(RESTLET_URL);
  Object.keys(params).forEach((key) => {
    url.searchParams.append(key, params[key]);
  });

  const authHeader = generateOAuthHeader('GET', url.toString());

  console.log('\n🔄 GET Request to:', url.toString());

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    console.log('📊 Response Status:', response.status, response.statusText);
    const responseText = await response.text();

    if (!response.ok) {
      console.error('❌ Error Response:', responseText);
      return null;
    }

    const data = JSON.parse(responseText);
    console.log('✅ Success! Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

/**
 * Test with POST method
 */
async function testPostMethod(params) {
  const authHeader = generateOAuthHeader('POST', RESTLET_URL);

  console.log('\n🔄 POST Request to:', RESTLET_URL);
  console.log('📦 Body:', JSON.stringify(params));

  try {
    const response = await fetch(RESTLET_URL, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(params),
    });

    console.log('📊 Response Status:', response.status, response.statusText);
    const responseText = await response.text();

    if (!response.ok) {
      console.error('❌ Error Response:', responseText);
      return null;
    }

    const data = JSON.parse(responseText);
    console.log('✅ Success! Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

/**
 * Run tests
 */
async function runTests() {
  console.log('🧪 NetSuite RESTlet Test Suite - V2');
  console.log('====================================\n');

  // Test 1: POST method with specific item
  console.log('\n📦 Test 1: POST - Get Item by ID (176542)');
  console.log('-------------------------------------------');
  await testPostMethod({ waType: 'item', waId: '176542' });

  // Wait a bit between requests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: GET method with specific item
  console.log('\n\n📦 Test 2: GET - Get Item by ID (176542)');
  console.log('------------------------------------------');
  await testGetMethod({ waType: 'item', waId: '176542' });

  // Wait a bit between requests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: POST method for all customers
  console.log('\n\n👥 Test 3: POST - Get All Customers');
  console.log('------------------------------------');
  await testPostMethod({ waType: 'customer' });

  console.log('\n\n✨ Tests completed!');
}

// Run the tests
runTests().catch(console.error);

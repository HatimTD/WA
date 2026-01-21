/**
 * Direct NetSuite RESTlet test based on official Oracle documentation
 * Using exact encoding and parameter ordering from RFC 5849
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

const RESTLET_URL = 'https://4129093.restlets.api.netsuite.com/app/site/hosting/restlet.nl';

/**
 * RFC 5849 compliant percent encoding
 */
function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

/**
 * Generate OAuth 1.0 signature following Oracle NetSuite documentation
 */
function generateOAuthSignature(method, url, queryParams, oauthParams) {
  // Combine all parameters (OAuth + query)
  const allParams = { ...oauthParams, ...queryParams };

  // Sort parameters alphabetically by key
  const sortedKeys = Object.keys(allParams).sort();

  // Build parameter string with proper encoding
  const paramString = sortedKeys
    .map(key => `${percentEncode(key)}=${percentEncode(allParams[key])}`)
    .join('&');

  console.log('\n📝 Parameter String (sorted & encoded):');
  console.log(paramString);

  // Build signature base string: METHOD&URL&PARAMS (all percent-encoded)
  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;

  console.log('\n📝 Signature Base String (first 300 chars):');
  console.log(baseString.substring(0, 300) + '...');

  // Build signing key: consumerSecret&tokenSecret (percent-encoded)
  const signingKey = `${percentEncode(config.consumerSecret)}&${percentEncode(config.tokenSecret)}`;

  console.log('\n🔑 Signing Key (masked):');
  console.log(signingKey.substring(0, 50) + '...' + signingKey.substring(signingKey.length - 20));

  // Generate HMAC-SHA256 signature
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(baseString)
    .digest('base64');

  console.log('\n✍️ Signature:');
  console.log(signature);

  return signature;
}

/**
 * Test NetSuite RESTlet connection
 */
async function testConnection() {
  console.log('🧪 NetSuite RESTlet OAuth 1.0 Test');
  console.log('====================================\n');

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(20).toString('hex'); // 20 bytes = 40 hex chars

  console.log('⏱️  Timestamp:', timestamp);
  console.log('🎲 Nonce:', nonce);

  // Query parameters
  const queryParams = {
    script: '10293',
    deploy: '1',
    waType: 'customer',
  };

  // OAuth parameters (without signature yet)
  const oauthParams = {
    oauth_consumer_key: config.consumerKey,
    oauth_token: config.tokenId,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
  };

  // Generate signature
  const signature = generateOAuthSignature('GET', RESTLET_URL, queryParams, oauthParams);

  // Add signature to OAuth params
  oauthParams.oauth_signature = signature;

  // Build Authorization header (realm first, then sorted OAuth params)
  const authHeaderParams = Object.keys(oauthParams)
    .sort()
    .map(key => `${percentEncode(key)}="${percentEncode(oauthParams[key])}"`)
    .join(',');

  const authHeader = `OAuth realm="${config.accountId}",${authHeaderParams}`;

  console.log('\n📋 Authorization Header (first 150 chars):');
  console.log(authHeader.substring(0, 150) + '...');

  // Build full URL with query parameters
  const fullUrl = `${RESTLET_URL}?${Object.keys(queryParams)
    .map(key => `${key}=${queryParams[key]}`)
    .join('&')}`;

  console.log('\n🔗 Full URL:');
  console.log(fullUrl);

  // Make request
  console.log('\n🚀 Making Request...\n');

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    console.log('📊 Response Status:', response.status, response.statusText);

    const responseText = await response.text();
    console.log('\n📄 Response Body:');

    try {
      const json = JSON.parse(responseText);
      console.log(JSON.stringify(json, null, 2));

      if (response.ok) {
        console.log('\n✅ SUCCESS! Connection working!');
        return true;
      } else {
        console.log('\n❌ FAILED! See error above.');
        return false;
      }
    } catch (e) {
      console.log(responseText);
      return false;
    }
  } catch (error) {
    console.error('\n❌ Request Error:', error.message);
    return false;
  }
}

// Run test
testConnection();

/**
 * Test NetSuite "Get All" - Remove waId parameter as instructed by NetSuite dev
 * Use longer timeout to see if data eventually comes back
 */

const crypto = require('crypto');
const https = require('https');

const config = {
  accountId: '4129093',
  consumerKey: 'a2a1ff67e62a2f9348df06b6ba0b6567b495930101e2a4998760924c76e10ef3',
  consumerSecret: 'eeaeafe4a99b1c55d6c39b5da5bc80dc586812834a5e0c6cd9194fb4bdee95c9',
  tokenId: '1a920b841dadd0d4077930d456cc73e1a8433d64d7a980fb893245e2a3540525',
  tokenSecret: 'acac4fc31be0c0b818f12f1da8ba3e91cf217fe8398876925debdfc2ed142668',
};

function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function generateOAuthHeader(method, url) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');

  const urlObj = new URL(url);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

  const oauthParams = {
    oauth_consumer_key: config.consumerKey,
    oauth_token: config.tokenId,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
  };

  const allParams = { ...oauthParams };
  urlObj.searchParams.forEach((value, key) => {
    allParams[key] = value;
  });

  const paramString = Object.keys(allParams)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(allParams[key])}`)
    .join('&');

  const signatureBaseString = `${method.toUpperCase()}&${percentEncode(baseUrl)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(config.consumerSecret)}&${percentEncode(config.tokenSecret)}`;
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  oauthParams.oauth_signature = signature;

  const headerParams = Object.keys(oauthParams)
    .sort()
    .map((key) => `${percentEncode(key)}="${percentEncode(oauthParams[key])}"`)
    .join(',');

  return `OAuth realm="${config.accountId}",${headerParams}`;
}

async function testGetAll(waType, timeoutSeconds = 30) {
  const url = `https://4129093.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=10293&deploy=1&waType=${waType}`;

  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔍 Getting ALL ${waType.toUpperCase()}S (waId parameter removed)`);
  console.log(`${'='.repeat(70)}`);
  console.log(`URL: ${url}`);
  console.log(`Timeout: ${timeoutSeconds} seconds`);
  console.log(`Waiting for response...`);

  const authHeader = generateOAuthHeader('GET', url);
  const startTime = Date.now();

  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      let chunks = 0;

      res.on('data', (chunk) => {
        data += chunk;
        chunks++;
        process.stdout.write('.');
        if (chunks % 50 === 0) {
          console.log(` [${Math.round((Date.now() - startTime) / 1000)}s]`);
        }
      });

      res.on('end', () => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n\n✅ Response received in ${elapsed} seconds`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Data size: ${data.length} bytes`);

        try {
          const jsonData = JSON.parse(data);

          if (Array.isArray(jsonData)) {
            console.log(`\n📊 Response Type: Array`);
            console.log(`📊 Record Count: ${jsonData.length}`);

            if (jsonData.length === 0) {
              console.log('\n⚠️  EMPTY ARRAY - NetSuite has no records of this type');
              console.log('   This means:');
              console.log('   - NetSuite instance has no items/customers');
              console.log('   - You need to add records in NetSuite first');
            } else {
              console.log(`\n✅✅✅ SUCCESS! Found ${jsonData.length} ${waType}(s)!`);
              console.log('\n📄 First record:');
              console.log(JSON.stringify(jsonData[0], null, 2));

              if (jsonData.length > 1) {
                console.log('\n📄 Second record:');
                console.log(JSON.stringify(jsonData[1], null, 2));
              }

              if (jsonData.length > 5) {
                console.log(`\n... and ${jsonData.length - 2} more records`);
              }
            }
          } else if (jsonData.status === 'error') {
            console.log('\n❌ ERROR Response:');
            console.log(JSON.stringify(jsonData, null, 2));
          } else {
            console.log('\n📄 Response:');
            console.log(JSON.stringify(jsonData, null, 2));
          }

          resolve({ success: true, count: Array.isArray(jsonData) ? jsonData.length : 0 });
        } catch (e) {
          console.log('\n⚠️  Response is not valid JSON');
          console.log('First 500 chars:', data.substring(0, 500));
          resolve({ success: false, error: 'Invalid JSON' });
        }
      });
    });

    req.on('error', (error) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n\n❌ Request Error after ${elapsed} seconds:`);
      console.log(error.message);
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(timeoutSeconds * 1000, () => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n\n⏱️  Timeout after ${elapsed} seconds`);
      console.log('This suggests:');
      console.log('   - RESTlet is processing but taking too long');
      console.log('   - There might be many records to process');
      console.log('   - RESTlet might need pagination');
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing NetSuite "Get All" Endpoints');
  console.log('As instructed by NetSuite dev: Remove waId parameter');
  console.log('EXTENDED TIMEOUT: 120 seconds (2 minutes) to handle large datasets');
  console.log('=' .repeat(70));

  // Test 1: Get All Items (120 second timeout = 2 minutes)
  const itemsResult = await testGetAll('item', 120);

  // Wait between requests
  console.log('\n⏳ Waiting 5 seconds before next request...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test 2: Get All Customers (120 second timeout = 2 minutes)
  const customersResult = await testGetAll('customer', 120);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(70));

  if (itemsResult.success) {
    console.log(`✅ Items: ${itemsResult.count} records found`);
  } else {
    console.log(`❌ Items: ${itemsResult.error}`);
  }

  if (customersResult.success) {
    console.log(`✅ Customers: ${customersResult.count} records found`);
  } else {
    console.log(`❌ Customers: ${customersResult.error}`);
  }

  console.log('\n' + '='.repeat(70));

  if (itemsResult.count === 0 && customersResult.count === 0) {
    console.log('\n⚠️  CONCLUSION: NetSuite instance appears to be EMPTY');
    console.log('\nRECOMMENDATIONS:');
    console.log('1. Log into NetSuite and verify if any records exist');
    console.log('2. Add test items: Lists > Accounting > Items > New');
    console.log('3. Add test customers: Lists > Relationships > Customers > New');
    console.log('4. Re-run this test after adding records');
  } else if (itemsResult.count > 0 || customersResult.count > 0) {
    console.log('\n✅✅✅ SUCCESS! NetSuite has data!');
    console.log('\nYour integration is FULLY WORKING!');
    console.log('You can now use these endpoints in your application.');
  } else {
    console.log('\n⚠️  Unable to determine - queries timed out');
    console.log('\nPossible reasons:');
    console.log('- Too many records (needs pagination)');
    console.log('- RESTlet performance issue');
    console.log('- Network connectivity issue');
    console.log('\nContact NetSuite dev to optimize RESTlet for bulk queries.');
  }

  console.log('='.repeat(70) + '\n');
}

runTests();

/**
 * Test customer search with real NetSuite data
 * Tests the application's search functionality
 */

async function testCustomerSearch() {
  console.log('🧪 Testing Customer Search with NetSuite Data');
  console.log('='.repeat(70));

  const testQueries = [
    'Baker',          // Should find "Baker Perkins Ltd"
    'Perkins',        // Should find "Baker Perkins Ltd"
    'GB',             // Country code - might find UK companies
    '0C1016122',      // Entity ID we saw in test
  ];

  for (const query of testQueries) {
    console.log(`\n🔍 Searching for: "${query}"`);
    console.log('-'.repeat(70));

    try {
      const response = await fetch(
        `http://localhost:3010/api/netsuite/customers/search?query=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log(`❌ Error: ${response.status}`);
        console.log(JSON.stringify(data, null, 2));
        continue;
      }

      if (data.customers && Array.isArray(data.customers)) {
        console.log(`✅ Found ${data.customers.length} customer(s)`);

        if (data.customers.length > 0) {
          console.log('\n📄 Results:');
          data.customers.forEach((customer, index) => {
            console.log(`\n${index + 1}. ${customer.companyName || 'N/A'}`);
            console.log(`   Entity ID: ${customer.entityId || 'N/A'}`);
            console.log(`   City: ${customer.city || 'N/A'}`);
            console.log(`   Country: ${customer.country || 'N/A'}`);
            console.log(`   Internal ID: ${customer.internalId || customer.id || 'N/A'}`);
          });
        } else {
          console.log('   No customers found for this query');
        }
      } else {
        console.log('⚠️  Unexpected response format');
        console.log(JSON.stringify(data, null, 2));
      }

    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }

    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Test completed!');
  console.log('='.repeat(70));
}

testCustomerSearch();

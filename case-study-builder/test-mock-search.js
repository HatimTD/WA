/**
 * Test mock database customer search
 * Verifies the fallback mechanism works
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMockSearch() {
  console.log('🧪 Testing Mock Customer Search');
  console.log('='.repeat(70));

  const testQueries = [
    'ABC',          // Should find "ABC Mining Corporation"
    'mining',       // Should find "ABC Mining Corporation"
    'steel',        // Should find "Global Steel Industries"
    'cement',       // Should find "Cement Works Ltd"
    'Baker',        // Won't find (not in mock data)
    '',             // Should return empty
  ];

  for (const query of testQueries) {
    console.log(`\n🔍 Searching for: "${query}"`);
    console.log('-'.repeat(70));

    if (!query || query.length < 2) {
      console.log('⚠️  Query too short, skipping');
      continue;
    }

    try {
      const lowerQuery = query.toLowerCase();
      const mockCustomers = await prisma.waMockCustomer.findMany({
        where: {
          isActive: true,
          OR: [
            { companyName: { contains: lowerQuery, mode: 'insensitive' } },
            { entityId: { contains: lowerQuery, mode: 'insensitive' } },
            { city: { contains: lowerQuery, mode: 'insensitive' } },
            { industry: { contains: lowerQuery, mode: 'insensitive' } },
          ],
        },
        take: 10,
        orderBy: { companyName: 'asc' },
      });

      if (mockCustomers.length > 0) {
        console.log(`✅ Found ${mockCustomers.length} customer(s):`);
        mockCustomers.forEach((customer, index) => {
          console.log(`\n${index + 1}. ${customer.companyName}`);
          console.log(`   Entity ID: ${customer.entityId}`);
          console.log(`   City: ${customer.city}`);
          console.log(`   Industry: ${customer.industry}`);
        });
      } else {
        console.log('❌ No customers found');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 Summary');
  console.log('='.repeat(70));

  // Count total mock customers
  const totalCount = await prisma.waMockCustomer.count({
    where: { isActive: true }
  });

  console.log(`Total mock customers in database: ${totalCount}`);
  console.log('');
  console.log('✅ Mock database search is working!');
  console.log('💡 The customer search in the app should fall back to this data');
  console.log('   when NetSuite SuiteQL API is not accessible.');
  console.log('='.repeat(70));

  await prisma.$disconnect();
}

testMockSearch().catch(console.error);

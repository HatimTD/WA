import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Subsidiary data from NetSuite
 * Regions: Europe, MEA (Middle East & Africa), Asia, Latin America, North America
 */
const subsidiaries = [
  // Europe
  { integrationId: '24', name: 'WA Ltd', region: 'Europe', currencyCode: 'GBP' },
  { integrationId: '5', name: 'WA Deutschland', region: 'Europe', currencyCode: 'EUR' },
  { integrationId: '9', name: 'Alunox', region: 'Europe', currencyCode: 'EUR' },
  { integrationId: '6', name: 'Corodur', region: 'Europe', currencyCode: 'EUR' },
  { integrationId: '58', name: 'WA France', region: 'Europe', currencyCode: 'EUR' },
  { integrationId: '82', name: 'Usi-Site', region: 'Europe', currencyCode: 'EUR' },
  { integrationId: '65', name: 'WA Italiana', region: 'Europe', currencyCode: 'EUR' },
  { integrationId: '70', name: 'WA Polska', region: 'Europe', currencyCode: 'PLN' },
  { integrationId: '77', name: 'Dalforsan', region: 'Europe', currencyCode: 'EUR' },
  { integrationId: '74', name: 'WA España', region: 'Europe', currencyCode: 'EUR' },
  { integrationId: '71', name: 'WA Russia', region: 'Europe', currencyCode: 'RUB' },
  { integrationId: '60', name: 'Produr', region: 'Europe', currencyCode: 'EUR' },

  // MEA (Middle East & Africa)
  { integrationId: '78', name: 'Speedmet', region: 'MEA', currencyCode: 'ZAR' },
  { integrationId: '72', name: 'WA South Africa', region: 'MEA', currencyCode: 'ZAR' },
  { integrationId: '68', name: 'WA Maroc', region: 'MEA', currencyCode: 'MAD' },
  { integrationId: '83', name: 'WA Kaynak', region: 'MEA', currencyCode: 'TRY' },

  // Asia
  { integrationId: '50', name: 'WA Far East', region: 'Asia', currencyCode: 'SGD' },
  { integrationId: '26', name: 'WA Thailand', region: 'Asia', currencyCode: 'THB' },
  { integrationId: '81', name: 'WA Vietnam', region: 'Asia', currencyCode: 'VND' },
  { integrationId: '66', name: 'WA Japan', region: 'Asia', currencyCode: 'JPY' },
  { integrationId: '100', name: 'WA Malaysia', region: 'Asia', currencyCode: 'MYR' },
  { integrationId: '63', name: 'WA South Asia', region: 'Asia', currencyCode: 'INR' },
  { integrationId: '56', name: 'WA China', region: 'Asia', currencyCode: 'CNY' },
  { integrationId: '90', name: 'WA Services Pte. Ltd', region: 'Asia', currencyCode: 'SGD' },
  { integrationId: 'SG', name: 'WA Singapore', region: 'Asia', currencyCode: 'SGD' },
  { integrationId: '113', name: 'PHS', region: 'Asia', currencyCode: 'PHP' },

  // Latin America
  { integrationId: '55', name: 'WA Argentina', region: 'Latin America', currencyCode: 'ARS' },
  { integrationId: '101', name: 'WA Brazil', region: 'Latin America', currencyCode: 'BRL' },
  { integrationId: '67', name: 'WA Panamericana', region: 'Latin America', currencyCode: 'USD' },
  { integrationId: '69', name: 'WA Peru', region: 'Latin America', currencyCode: 'PEN' },

  // North America
  { integrationId: '49', name: 'WA USA', region: 'North America', currencyCode: 'USD' },
  { integrationId: 'TW', name: 'Track-Weld', region: 'North America', currencyCode: 'USD' },
  { integrationId: 'WM', name: 'Weld Mold', region: 'North America', currencyCode: 'USD' },
];

async function main() {
  console.log('Seeding subsidiaries...');

  for (const subsidiary of subsidiaries) {
    await prisma.waSubsidiary.upsert({
      where: { integrationId: subsidiary.integrationId },
      update: {
        name: subsidiary.name,
        region: subsidiary.region,
        currencyCode: subsidiary.currencyCode,
        isActive: true,
      },
      create: {
        integrationId: subsidiary.integrationId,
        name: subsidiary.name,
        region: subsidiary.region,
        currencyCode: subsidiary.currencyCode,
        isActive: true,
      },
    });
    console.log(`Upserted: ${subsidiary.name} (${subsidiary.region})`);
  }

  console.log(`\nSeeded ${subsidiaries.length} subsidiaries successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

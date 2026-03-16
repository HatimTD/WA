/**
 * Seed script for mock NetSuite data
 * Run with: npx tsx prisma/seed-mock-netsuite.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding mock NetSuite data...\n');

  // Clear existing mock data
  console.log('🗑️  Clearing existing mock data...');
  await prisma.waMockCustomer.deleteMany({});
  await prisma.waMockItem.deleteMany({});
  console.log('✅ Cleared existing data\n');

  // Seed mock customers
  console.log('👥 Seeding mock customers...');
  const customers = await prisma.waMockCustomer.createMany({
    data: [
      {
        netsuiteId: '1001',
        entityId: 'E9001',
        companyName: 'ABC Mining Corporation',
        displayName: 'ABC Mining Corporation (E9001)',
        address: '123 Mining Road',
        city: 'Perth',
        state: 'Western Australia',
        country: 'Australia',
        postalCode: '6000',
        industry: 'Mining & Quarrying',
        email: 'contact@abcmining.com.au',
        phone: '+61-8-1234-5678',
      },
      {
        netsuiteId: '1002',
        entityId: 'E9002',
        companyName: 'Global Steel Industries',
        displayName: 'Global Steel Industries (E9002)',
        address: '456 Steel Avenue',
        city: 'Pittsburgh',
        state: 'Pennsylvania',
        country: 'United States',
        postalCode: '15222',
        industry: 'Steel & Metal Processing',
        email: 'info@globalsteel.com',
        phone: '+1-412-555-0100',
      },
      {
        netsuiteId: '1003',
        entityId: 'E9003',
        companyName: 'Cement Works Ltd',
        displayName: 'Cement Works Ltd (E9003)',
        address: '789 Industrial Park',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400001',
        industry: 'Cement',
        email: 'contact@cementworks.in',
        phone: '+91-22-2345-6789',
      },
      {
        netsuiteId: '1004',
        entityId: 'E9004',
        companyName: 'PowerGen Energy Solutions',
        displayName: 'PowerGen Energy Solutions (E9004)',
        address: '321 Energy Boulevard',
        city: 'Houston',
        state: 'Texas',
        country: 'United States',
        postalCode: '77002',
        industry: 'Power Generation',
        email: 'powergen@energy.com',
        phone: '+1-713-555-0200',
      },
      {
        netsuiteId: '1005',
        entityId: 'E9005',
        companyName: 'Marine Services International',
        displayName: 'Marine Services International (E9005)',
        address: '555 Harbor Drive',
        city: 'Singapore',
        country: 'Singapore',
        postalCode: '018956',
        industry: 'Marine',
        email: 'info@marineservices.sg',
        phone: '+65-6234-5678',
      },
      {
        netsuiteId: '1006',
        entityId: 'E9006',
        companyName: 'Nordic Shipyard AB',
        displayName: 'Nordic Shipyard AB (E9006)',
        address: '100 Docksvägen',
        city: 'Gothenburg',
        country: 'Sweden',
        postalCode: '41301',
        industry: 'Shipbuilding',
        email: 'contact@nordicshipyard.se',
        phone: '+46-31-123-4567',
      },
      {
        netsuiteId: '1007',
        entityId: 'E9007',
        companyName: 'Atlas Construction Group',
        displayName: 'Atlas Construction Group (E9007)',
        address: '250 Build Street',
        city: 'Dubai',
        country: 'United Arab Emirates',
        postalCode: '00000',
        industry: 'Construction',
        email: 'info@atlasconstruction.ae',
        phone: '+971-4-123-4567',
      },
      {
        netsuiteId: '1008',
        entityId: 'E9008',
        companyName: 'Canadian Oil Sands Corp',
        displayName: 'Canadian Oil Sands Corp (E9008)',
        address: '777 Energy Way',
        city: 'Calgary',
        state: 'Alberta',
        country: 'Canada',
        postalCode: 'T2P 3T1',
        industry: 'Oil & Gas',
        email: 'info@canoilsands.ca',
        phone: '+1-403-555-0300',
      },
      {
        netsuiteId: '1009',
        entityId: 'E9009',
        companyName: 'Rio Minerals SA',
        displayName: 'Rio Minerals SA (E9009)',
        address: 'Avenida Paulista 1000',
        city: 'São Paulo',
        country: 'Brazil',
        postalCode: '01310-100',
        industry: 'Mining & Quarrying',
        email: 'contato@riominerals.com.br',
        phone: '+55-11-3456-7890',
      },
      {
        netsuiteId: '1010',
        entityId: 'E9010',
        companyName: 'Shanghai Heavy Industries',
        displayName: 'Shanghai Heavy Industries (E9010)',
        address: '888 Industrial Road',
        city: 'Shanghai',
        country: 'China',
        postalCode: '200000',
        industry: 'Heavy Manufacturing',
        email: 'contact@shanghaiheavy.cn',
        phone: '+86-21-1234-5678',
      },
    ],
  });
  console.log(`✅ Created ${customers.count} mock customers\n`);

  // Seed mock items (products)
  console.log('📦 Seeding mock items (products)...');
  const items = await prisma.waMockItem.createMany({
    data: [
      {
        netsuiteId: '176542',
        itemId: 'WA-HARDFACE-001',
        itemName: 'Hardface 600-O',
        displayName: 'Hardface 600-O (WA-HARDFACE-001)',
        description: 'Open arc, gas-shielded flux-cored wire for hardfacing applications',
        category: 'Hardfacing',
        type: 'Flux-Cored Wire',
        diameter: '1.6mm, 2.4mm',
        composition: 'Fe-Cr-C',
        process: 'FCAW',
        application: 'Wear resistance on mining equipment, crusher parts',
        hardness: '58-62 HRc',
        manufacturer: 'Welding Alloys',
      },
      {
        netsuiteId: '176543',
        itemId: 'WA-HARDFACE-002',
        itemName: 'Hardface 500-O',
        displayName: 'Hardface 500-O (WA-HARDFACE-002)',
        description: 'Medium hardness hardfacing wire for impact applications',
        category: 'Hardfacing',
        type: 'Flux-Cored Wire',
        diameter: '1.6mm, 2.0mm, 2.4mm',
        composition: 'Fe-Cr-C-Mo',
        process: 'FCAW',
        application: 'Hammers, crushers, high-impact applications',
        hardness: '52-56 HRc',
        manufacturer: 'Welding Alloys',
      },
      {
        netsuiteId: '176544',
        itemId: 'WA-BUILDRITE-001',
        itemName: 'Build-Rite FCA',
        displayName: 'Build-Rite FCA (WA-BUILDRITE-001)',
        description: 'High deposition flux-cored wire for build-up',
        category: 'Build-Up',
        type: 'Flux-Cored Wire',
        diameter: '1.6mm, 2.4mm, 3.2mm',
        composition: 'Fe-based',
        process: 'FCAW',
        application: 'Shaft build-up, dimensional restoration',
        hardness: '22-28 HRc',
        manufacturer: 'Welding Alloys',
      },
      {
        netsuiteId: '176545',
        itemId: 'WA-STELLITE-001',
        itemName: 'Stellite 6',
        displayName: 'Stellite 6 (WA-STELLITE-001)',
        description: 'Cobalt-based alloy for extreme wear and corrosion',
        category: 'Cobalt Alloys',
        type: 'Solid Wire',
        diameter: '1.2mm, 1.6mm',
        composition: 'Co-Cr-W-C',
        process: 'GTAW, PTA',
        application: 'Valve seats, pump components, high-temperature wear',
        hardness: '38-45 HRc',
        manufacturer: 'Welding Alloys',
      },
      {
        netsuiteId: '176546',
        itemId: 'WA-CHROME-001',
        itemName: 'Chrome Carbide 600',
        displayName: 'Chrome Carbide 600 (WA-CHROME-001)',
        description: 'High chromium carbide hardfacing electrode',
        category: 'Hardfacing',
        type: 'Stick Electrode',
        diameter: '3.2mm, 4.0mm, 5.0mm',
        composition: 'Fe-Cr-C',
        process: 'SMAW',
        application: 'Extreme abrasion on mining and earthmoving equipment',
        hardness: '58-63 HRc',
        manufacturer: 'Welding Alloys',
      },
      {
        netsuiteId: '176547',
        itemId: 'WA-STAINLESS-001',
        itemName: '308L Stainless',
        displayName: '308L Stainless (WA-STAINLESS-001)',
        description: 'Austenitic stainless steel welding wire',
        category: 'Stainless Steel',
        type: 'Solid Wire',
        diameter: '0.9mm, 1.0mm, 1.2mm',
        composition: 'Fe-Cr-Ni',
        process: 'GMAW, GTAW',
        application: 'Stainless steel fabrication, food processing equipment',
        hardness: '85-95 HRB',
        manufacturer: 'Welding Alloys',
      },
      {
        netsuiteId: '176548',
        itemId: 'WA-NICKEL-001',
        itemName: 'Nickel 625',
        displayName: 'Nickel 625 (WA-NICKEL-001)',
        description: 'Nickel-based alloy for corrosion resistance',
        category: 'Nickel Alloys',
        type: 'Solid Wire',
        diameter: '1.0mm, 1.2mm, 1.6mm',
        composition: 'Ni-Cr-Mo-Nb',
        process: 'GMAW, GTAW',
        application: 'Chemical processing, marine environments',
        hardness: '25-35 HRc',
        manufacturer: 'Welding Alloys',
      },
      {
        netsuiteId: '176549',
        itemId: 'WA-MANGANESE-001',
        itemName: 'Mangalloy Build-Up',
        displayName: 'Mangalloy Build-Up (WA-MANGANESE-001)',
        description: 'Austenitic manganese steel electrode',
        category: 'Build-Up',
        type: 'Stick Electrode',
        diameter: '3.2mm, 4.0mm',
        composition: 'Mn-Steel',
        process: 'SMAW',
        application: 'Railroad frogs, crusher jaws, high-impact mining',
        hardness: '200-240 HB',
        manufacturer: 'Welding Alloys',
      },
      {
        netsuiteId: '176550',
        itemId: 'WA-TUNGSTEN-001',
        itemName: 'Tungsten Carbide Composite',
        displayName: 'Tungsten Carbide Composite (WA-TUNGSTEN-001)',
        description: 'Tungsten carbide composite for extreme abrasion',
        category: 'Hardfacing',
        type: 'Tubular Wire',
        diameter: '2.4mm, 3.2mm',
        composition: 'WC-Co-Ni',
        process: 'FCAW, PTA',
        application: 'Extreme abrasion, mining, dredging',
        hardness: '62-68 HRc',
        manufacturer: 'Welding Alloys',
      },
      {
        netsuiteId: '176551',
        itemId: 'WA-OVERLAY-001',
        itemName: 'Chrome Overlay 350',
        displayName: 'Chrome Overlay 350 (WA-OVERLAY-001)',
        description: 'Semi-automatic overlay wire for wear plates',
        category: 'Overlay',
        type: 'Flux-Cored Wire',
        diameter: '2.4mm, 3.2mm',
        composition: 'Fe-Cr-C',
        process: 'SAW, FCAW',
        application: 'Wear plates, chutes, hoppers',
        hardness: '48-54 HRc',
        manufacturer: 'Welding Alloys',
      },
    ],
  });
  console.log(`✅ Created ${items.count} mock items\n`);

  console.log('✨ Mock NetSuite data seeding completed!\n');
  console.log('📊 Summary:');
  console.log(`   - Customers: ${customers.count}`);
  console.log(`   - Items: ${items.count}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

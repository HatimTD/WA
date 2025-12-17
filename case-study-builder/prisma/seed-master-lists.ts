import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMasterLists() {
  console.log('Seeding master lists...');

  // Create List Keys
  const industryKey = await prisma.waListKey.upsert({
    where: { keyName: 'Industry' },
    update: {},
    create: {
      keyName: 'Industry',
      description: 'Customer industry categories',
    },
  });

  const wearTypeKey = await prisma.waListKey.upsert({
    where: { keyName: 'WearType' },
    update: {},
    create: {
      keyName: 'WearType',
      description: 'Types of wear/damage',
    },
  });

  const durationUnitKey = await prisma.waListKey.upsert({
    where: { keyName: 'DurationUnit' },
    update: {},
    create: {
      keyName: 'DurationUnit',
      description: 'Time duration units',
    },
  });

  const serviceUnitKey = await prisma.waListKey.upsert({
    where: { keyName: 'ServiceUnit' },
    update: {},
    create: {
      keyName: 'ServiceUnit',
      description: 'Service life measurement units',
    },
  });

  // Seed Industries
  const industries = [
    'Mining & Quarrying',
    'Cement',
    'Steel & Metal Processing',
    'Power Generation',
    'Pulp & Paper',
    'Oil & Gas',
    'Chemical & Petrochemical',
    'Marine',
    'Agriculture',
    'Construction',
    'Recycling',
    'Other',
  ];

  for (let i = 0; i < industries.length; i++) {
    await prisma.waMasterList.upsert({
      where: {
        listKeyId_value: {
          listKeyId: industryKey.id,
          value: industries[i],
        },
      },
      update: { sortOrder: i },
      create: {
        listKeyId: industryKey.id,
        value: industries[i],
        sortOrder: i,
      },
    });
  }

  // Seed Wear Types
  const wearTypes = [
    { value: 'Abrasion', sort: 0 },
    { value: 'Impact', sort: 1 },
    { value: 'Corrosion', sort: 2 },
    { value: 'High Temperature', sort: 3 },
    { value: 'Combination', sort: 4 },
  ];

  for (const wt of wearTypes) {
    await prisma.waMasterList.upsert({
      where: {
        listKeyId_value: {
          listKeyId: wearTypeKey.id,
          value: wt.value,
        },
      },
      update: { sortOrder: wt.sort },
      create: {
        listKeyId: wearTypeKey.id,
        value: wt.value,
        sortOrder: wt.sort,
      },
    });
  }

  // Seed Duration Units
  const durationUnits = ['Hours', 'Days', 'Weeks', 'Months', 'Years'];

  for (let i = 0; i < durationUnits.length; i++) {
    await prisma.waMasterList.upsert({
      where: {
        listKeyId_value: {
          listKeyId: durationUnitKey.id,
          value: durationUnits[i],
        },
      },
      update: { sortOrder: i },
      create: {
        listKeyId: durationUnitKey.id,
        value: durationUnits[i],
        sortOrder: i,
      },
    });
  }

  // Seed Service Units
  const serviceUnits = ['Hours', 'Cycles', 'Tonnes', 'Months', 'Years'];

  for (let i = 0; i < serviceUnits.length; i++) {
    await prisma.waMasterList.upsert({
      where: {
        listKeyId_value: {
          listKeyId: serviceUnitKey.id,
          value: serviceUnits[i],
        },
      },
      update: { sortOrder: i },
      create: {
        listKeyId: serviceUnitKey.id,
        value: serviceUnits[i],
        sortOrder: i,
      },
    });
  }

  console.log('Master lists seeded successfully!');
}

seedMasterLists()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixApprovedDates() {
  console.log('Fixing approved dates...');

  // Get all APPROVED cases without approvedAt
  const approvedCases = await prisma.waCaseStudy.findMany({
    where: {
      status: 'APPROVED',
      approvedAt: null,
    },
  });

  console.log(`Found ${approvedCases.length} approved cases without approvedAt timestamp`);

  // Update each one with their createdAt or current date
  for (const caseStudy of approvedCases) {
    await prisma.waCaseStudy.update({
      where: { id: caseStudy.id },
      data: {
        approvedAt: caseStudy.createdAt, // Use createdAt as approvedAt
      },
    });
    console.log(`Updated: ${caseStudy.customerName} - ${caseStudy.componentWorkpiece}`);
  }

  console.log('Done!');
}

fixApprovedDates()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

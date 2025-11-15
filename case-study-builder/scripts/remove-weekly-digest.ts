import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for WEEKLY_DIGEST notifications...');

  // Delete all WEEKLY_DIGEST notifications
  const result = await prisma.$executeRaw`
    DELETE FROM "Notification" WHERE type = 'WEEKLY_DIGEST'
  `;

  console.log(`Deleted ${result} WEEKLY_DIGEST notifications`);
  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

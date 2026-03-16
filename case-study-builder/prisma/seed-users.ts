/**
 * Seed script to create initial users with credentials login
 *
 * Run with: npx ts-node prisma/seed-users.ts
 * Or: npx tsx prisma/seed-users.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Password hash for "TestPassword123" - generated with bcrypt.hash('TestPassword123', 10)
const PASSWORD_HASH = '$2a$10$WdrAgM6sLCKfWI/GwCJxZOXCwmRsCyDmo.NYdCB0Y3QP/9Sgvt0AK';

const USERS_TO_CREATE = [
  // Contributors
  { email: 'JeffW@weldingalloys.com', name: 'Jeff W', role: 'CONTRIBUTOR' as Role },
  { email: 'Ricardo@weldingalloys.com', name: 'Ricardo', role: 'CONTRIBUTOR' as Role },
  { email: 'JeffL@weldingalloys.com', name: 'Jeff L', role: 'CONTRIBUTOR' as Role },
  { email: 'Saad@weldingalloys.com', name: 'Saad', role: 'CONTRIBUTOR' as Role },
  { email: 'Venu@weldingalloys.com', name: 'Venu', role: 'CONTRIBUTOR' as Role },
  { email: 'Sebastian@weldingalloys.com', name: 'Sebastian', role: 'CONTRIBUTOR' as Role },
  { email: 'Amine@weldingalloys.com', name: 'Amine', role: 'CONTRIBUTOR' as Role },

  // Approvers
  { email: 'Laslo@weldingalloys.com', name: 'Laslo', role: 'APPROVER' as Role },
  { email: 'lauren@weldingalloys.com', name: 'Lauren', role: 'APPROVER' as Role },
  { email: 'Guillaume@weldingalloys.com', name: 'Guillaume', role: 'APPROVER' as Role },

  // Admins
  { email: 'Dominic@weldingalloys.com', name: 'Dominic', role: 'ADMIN' as Role },
  { email: 'Johann@weldingalloys.com', name: 'Johann', role: 'ADMIN' as Role },
  { email: 'Bastien@weldingalloys.com', name: 'Bastien', role: 'ADMIN' as Role },
];

async function main() {
  console.log('🌱 Seeding users...\n');

  for (const userData of USERS_TO_CREATE) {
    // Normalize email to lowercase for consistency
    const email = userData.email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (existingUser) {
      console.log(`⏭️  User already exists: ${email} (${existingUser.role})`);

      // Update role if different
      if (existingUser.role !== userData.role) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: userData.role },
        });
        console.log(`   ✏️  Updated role to: ${userData.role}`);
      }

      // Ensure credentials account exists
      const hasCredentials = existingUser.accounts.some(a => a.provider === 'credentials');
      if (!hasCredentials) {
        await prisma.account.create({
          data: {
            userId: existingUser.id,
            type: 'credentials',
            provider: 'credentials',
            providerAccountId: email,
            access_token: PASSWORD_HASH,
          },
        });
        console.log(`   ✏️  Added credentials account`);
      }

      continue;
    }

    // Create new user with credentials account
    const user = await prisma.user.create({
      data: {
        email,
        name: userData.name,
        role: userData.role,
        emailVerified: new Date(),
        accounts: {
          create: {
            type: 'credentials',
            provider: 'credentials',
            providerAccountId: email,
            access_token: PASSWORD_HASH,
          },
        },
      },
    });

    console.log(`✅ Created: ${email} (${userData.role})`);
  }

  console.log('\n📊 Summary:');
  const counts = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });
  counts.forEach(c => {
    console.log(`   ${c.role}: ${c._count} users`);
  });

  console.log('\n✅ Seeding complete!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: <name>@weldingalloys.com');
  console.log('   Password: TestPassword123');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

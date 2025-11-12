// Quick script to update dev user role to APPROVER
// Run with: node scripts/update-dev-role.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.update({
      where: { email: 'tidihatim@gmail.com' },
      data: { role: 'APPROVER' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        totalPoints: true,
      },
    });

    console.log('\n✅ User role updated successfully!');
    console.log(JSON.stringify(user, null, 2));
  } catch (error) {
    if (error.code === 'P2025') {
      console.error('\n❌ User not found. Please login first at http://localhost:3010/dev-login');
    } else {
      console.error('\n❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();

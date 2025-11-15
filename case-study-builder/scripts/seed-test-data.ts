import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting test data seeding...');

  // Find the test user
  const testUser = await prisma.user.findUnique({
    where: { email: 'tidihatim@gmail.com' },
  });

  if (!testUser) {
    console.error('User tidihatim@gmail.com not found!');
    return;
  }

  console.log(`Found user: ${testUser.name} (${testUser.email})`);
  console.log(`User ID: ${testUser.id}`);
  console.log(`User Role: ${testUser.role}`);

  // Find or create an approver user for testing
  let approverUser = await prisma.user.findFirst({
    where: { role: 'APPROVER' },
  });

  if (!approverUser) {
    console.log('Creating test approver user...');
    approverUser = await prisma.user.create({
      data: {
        email: 'approver@test.com',
        name: 'Test Approver',
        role: 'APPROVER',
      },
    });
  }

  console.log(`Using approver: ${approverUser.name} (${approverUser.email})`);

  // Find another user to test comments
  let commenterUser = await prisma.user.findFirst({
    where: {
      AND: [
        { id: { not: testUser.id } },
        { id: { not: approverUser.id } },
      ],
    },
  });

  if (!commenterUser) {
    console.log('Creating test commenter user...');
    commenterUser = await prisma.user.create({
      data: {
        email: 'commenter@test.com',
        name: 'Test Commenter',
        role: 'CONTRIBUTOR',
      },
    });
  }

  console.log(`Using commenter: ${commenterUser.name} (${commenterUser.email})`);

  // Find or create admin test account
  let adminUser = await prisma.user.findUnique({
    where: { email: 'test@admin.com' },
  });

  if (!adminUser) {
    console.log('Creating admin test account (test@admin.com)...');
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Create admin user (Note: This requires Account model with credentials provider)
    adminUser = await prisma.user.create({
      data: {
        email: 'test@admin.com',
        name: 'Admin Test User',
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    // Create credentials account for password login
    await prisma.account.create({
      data: {
        userId: adminUser.id,
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: adminUser.id,
        access_token: hashedPassword, // Store hashed password in access_token field
      },
    });
    console.log('✓ Admin account created with password: 123456');
  } else {
    console.log(`Using existing admin: ${adminUser.name} (${adminUser.email})`);
  }

  // Clean up old test data for this user
  console.log('\nCleaning up old test data...');
  await prisma.comment.deleteMany({
    where: {
      caseStudy: {
        contributorId: testUser.id,
        customerName: { startsWith: 'TEST -' },
      },
    },
  });

  await prisma.caseStudy.deleteMany({
    where: {
      contributorId: testUser.id,
      customerName: { startsWith: 'TEST -' },
    },
  });

  console.log('Old test data cleaned up.');

  // Create test case studies
  console.log('\n=== Creating Test Case Studies ===\n');

  // 1. DRAFT case study
  const draftCase = await prisma.caseStudy.create({
    data: {
      contributorId: testUser.id,
      type: 'APPLICATION',
      status: 'DRAFT',
      customerName: 'TEST - Draft Customer Corp',
      industry: 'Testing Industry',
      location: 'Test City',
      country: 'Test Country',
      componentWorkpiece: 'Test Component',
      workType: 'WORKSHOP',
      wearType: ['ABRASION'],
      problemDescription: 'This is a draft case study for testing purposes.',
      previousSolution: 'Previous test solution',
      previousServiceLife: 'Short',
      competitorName: 'Test Competitor',
      baseMetal: 'Steel',
      generalDimensions: '10x10x10',
      waSolution: 'Test WA Solution',
      waProduct: 'Test WA Product',
      technicalAdvantages: 'Testing technical advantages',
      expectedServiceLife: 'Longer',
      solutionValueRevenue: 75000,
      annualPotentialRevenue: 100000,
      customerSavingsAmount: 50000,
    },
  });
  console.log(`✓ Created DRAFT case: ${draftCase.customerName} (ID: ${draftCase.id})`);

  // 2. SUBMITTED case study (pending approval)
  const submittedCase = await prisma.caseStudy.create({
    data: {
      contributorId: testUser.id,
      type: 'TECH',
      status: 'SUBMITTED',
      customerName: 'TEST - Submitted Customer Inc',
      industry: 'Manufacturing',
      location: 'Factory Town',
      country: 'Test Country',
      componentWorkpiece: 'Industrial Component',
      workType: 'ON_SITE',
      wearType: ['CORROSION'],
      problemDescription: 'This case is submitted and awaiting approval.',
      previousSolution: 'Previous solution details',
      previousServiceLife: '6 months',
      competitorName: 'Competitor X',
      baseMetal: 'Carbon Steel',
      generalDimensions: '20x15x5',
      waSolution: 'Advanced WA Solution',
      waProduct: 'Premium WA Product',
      technicalAdvantages: 'Multiple technical advantages',
      expectedServiceLife: '2 years',
      solutionValueRevenue: 200000,
      annualPotentialRevenue: 250000,
      customerSavingsAmount: 100000,
      submittedAt: new Date(),
    },
  });
  console.log(`✓ Created SUBMITTED case: ${submittedCase.customerName} (ID: ${submittedCase.id})`);

  // 2b. Another SUBMITTED case for testing approval/rejection
  const submittedCase2 = await prisma.caseStudy.create({
    data: {
      contributorId: testUser.id,
      type: 'APPLICATION',
      status: 'SUBMITTED',
      customerName: 'TEST - Pending Approval Case',
      industry: 'Automotive',
      location: 'Detroit',
      country: 'USA',
      componentWorkpiece: 'Automotive Parts',
      workType: 'WORKSHOP',
      wearType: ['ABRASION', 'TEMPERATURE'],
      problemDescription: 'Test this case by approving or rejecting it yourself!',
      previousSolution: 'Standard automotive solution',
      previousServiceLife: '1 year',
      competitorName: 'Automotive Competitor',
      baseMetal: 'Tool Steel',
      generalDimensions: '15x12x8',
      waSolution: 'WA Automotive Solution',
      waProduct: 'WA Auto Product',
      technicalAdvantages: 'High temperature resistance and wear protection',
      expectedServiceLife: '3 years',
      solutionValueRevenue: 150000,
      annualPotentialRevenue: 180000,
      customerSavingsAmount: 80000,
      submittedAt: new Date(),
    },
  });
  console.log(`✓ Created SUBMITTED case for testing: ${submittedCase2.customerName} (ID: ${submittedCase2.id})`);

  // 3. APPROVED case study (with notification)
  const approvedCase = await prisma.caseStudy.create({
    data: {
      contributorId: testUser.id,
      type: 'STAR',
      status: 'APPROVED',
      customerName: 'TEST - Approved Customer Ltd',
      industry: 'Mining',
      location: 'Mine Site',
      country: 'Australia',
      componentWorkpiece: 'Mining Equipment',
      workType: 'BOTH',
      wearType: ['ABRASION', 'IMPACT'],
      problemDescription: 'This case was approved and you earned points!',
      previousSolution: 'Standard solution',
      previousServiceLife: '3 months',
      competitorName: 'Major Competitor',
      baseMetal: 'High Carbon Steel',
      generalDimensions: '50x30x20',
      waSolution: 'Premium WA Mining Solution',
      waProduct: 'WA Star Product',
      technicalAdvantages: 'Exceptional performance and durability',
      expectedServiceLife: '3 years',
      solutionValueRevenue: 400000,
      annualPotentialRevenue: 500000,
      customerSavingsAmount: 250000,
      submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      approvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      approverId: approverUser.id,
    },
  });
  console.log(`✓ Created APPROVED case: ${approvedCase.customerName} (ID: ${approvedCase.id})`);

  // Create CASE_APPROVED notification
  await prisma.notification.create({
    data: {
      userId: testUser.id,
      type: 'CASE_APPROVED',
      title: 'Case Study Approved!',
      message: `Your case study "${approvedCase.customerName} - ${approvedCase.industry}" has been approved and is now live. You earned 3 points!`,
      link: `/dashboard/cases/${approvedCase.id}`,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  });
  console.log('  ✓ Created CASE_APPROVED notification');

  // 4. REJECTED case study (with rejection reason and notification)
  const rejectedCase = await prisma.caseStudy.create({
    data: {
      contributorId: testUser.id,
      type: 'APPLICATION',
      status: 'REJECTED',
      customerName: 'TEST - Rejected Customer Corp',
      industry: 'Energy',
      location: 'Power Plant',
      country: 'USA',
      componentWorkpiece: 'Power Generation Equipment',
      workType: 'WORKSHOP',
      wearType: ['CORROSION'],
      problemDescription: 'This case was rejected and needs revision.',
      previousSolution: 'Basic solution',
      previousServiceLife: '1 year',
      competitorName: 'Energy Competitor',
      baseMetal: 'Stainless Steel',
      generalDimensions: '30x25x15',
      waSolution: 'WA Coating Solution',
      waProduct: 'WA Energy Product',
      technicalAdvantages: 'Corrosion resistance',
      expectedServiceLife: '5 years',
      solutionValueRevenue: 120000,
      annualPotentialRevenue: 150000,
      customerSavingsAmount: 75000,
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      rejectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      rejectedBy: approverUser.id,
      rejectionReason: 'The technical specifications are incomplete. Please provide more details about the base metal composition, exact welding parameters used, and measurable performance metrics. Also, include before/after photos if available.',
    },
  });
  console.log(`✓ Created REJECTED case: ${rejectedCase.customerName} (ID: ${rejectedCase.id})`);

  // Create CASE_REJECTED notification
  await prisma.notification.create({
    data: {
      userId: testUser.id,
      type: 'CASE_REJECTED',
      title: 'Case Study Needs Revision',
      message: `Your case study "${rejectedCase.customerName} - ${rejectedCase.industry}" requires revisions. Please review the feedback and resubmit.`,
      link: `/dashboard/my-cases`,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });
  console.log('  ✓ Created CASE_REJECTED notification');

  // 5. Another APPROVED case with comments (for NEW_COMMENT notification)
  const approvedCaseWithComments = await prisma.caseStudy.create({
    data: {
      contributorId: testUser.id,
      type: 'TECH',
      status: 'APPROVED',
      customerName: 'TEST - Approved with Comments',
      industry: 'Construction',
      location: 'Construction Site',
      country: 'Canada',
      componentWorkpiece: 'Construction Equipment',
      workType: 'BOTH',
      wearType: ['ABRASION', 'IMPACT'],
      problemDescription: 'This approved case has comments from other users.',
      previousSolution: 'Standard construction solution',
      previousServiceLife: '6 months',
      competitorName: 'Construction Competitor',
      baseMetal: 'Structural Steel',
      generalDimensions: '40x30x25',
      waSolution: 'WA Construction Solution',
      waProduct: 'WA Construction Product',
      technicalAdvantages: 'Enhanced durability for construction applications',
      expectedServiceLife: '2 years',
      solutionValueRevenue: 180000,
      annualPotentialRevenue: 200000,
      customerSavingsAmount: 90000,
      submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      approvedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      approverId: approverUser.id,
    },
  });
  console.log(`✓ Created APPROVED case with comments: ${approvedCaseWithComments.customerName} (ID: ${approvedCaseWithComments.id})`);

  // Add comments to this case
  const comment1 = await prisma.comment.create({
    data: {
      caseStudyId: approvedCaseWithComments.id,
      userId: commenterUser.id,
      content: 'Great case study! We had a similar application in our region. The service life improvement is impressive.',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  });
  console.log('  ✓ Added comment from commenter');

  // Create NEW_COMMENT notification
  await prisma.notification.create({
    data: {
      userId: testUser.id,
      type: 'NEW_COMMENT',
      title: 'New Comment on Your Case Study',
      message: `${commenterUser.name} commented on "${approvedCaseWithComments.customerName} - ${approvedCaseWithComments.industry}"`,
      link: `/dashboard/cases/${approvedCaseWithComments.id}`,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  });
  console.log('  ✓ Created NEW_COMMENT notification');

  const comment2 = await prisma.comment.create({
    data: {
      caseStudyId: approvedCaseWithComments.id,
      userId: approverUser.id,
      content: 'Excellent documentation! This will be very helpful for other teams working on similar applications.',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    },
  });
  console.log('  ✓ Added comment from approver');

  // Create another NEW_COMMENT notification
  await prisma.notification.create({
    data: {
      userId: testUser.id,
      type: 'NEW_COMMENT',
      title: 'New Comment on Your Case Study',
      message: `${approverUser.name} commented on "${approvedCaseWithComments.customerName} - ${approvedCaseWithComments.industry}"`,
      link: `/dashboard/cases/${approvedCaseWithComments.id}`,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    },
  });
  console.log('  ✓ Created NEW_COMMENT notification');

  // Create BADGE_EARNED notification
  await prisma.notification.create({
    data: {
      userId: testUser.id,
      type: 'BADGE_EARNED',
      title: 'New Badge Earned!',
      message: "Congratulations! You've earned the First Submission badge!",
      link: '/dashboard/analytics',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    },
  });
  console.log('✓ Created BADGE_EARNED notification');

  // Create BHAG_MILESTONE notification
  await prisma.notification.create({
    data: {
      userId: testUser.id,
      type: 'BHAG_MILESTONE',
      title: 'BHAG Milestone Reached!',
      message: "Amazing progress! You've reached 25% of the team's BHAG goal for this quarter!",
      link: '/dashboard/analytics',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  });
  console.log('✓ Created BHAG_MILESTONE notification');

  console.log('\n=== Test Data Summary ===');
  console.log(`Created 6 test case studies for ${testUser.email}:`);
  console.log(`  1. DRAFT case: ${draftCase.customerName}`);
  console.log(`  2. SUBMITTED case: ${submittedCase.customerName}`);
  console.log(`  3. SUBMITTED case for testing: ${submittedCase2.customerName}`);
  console.log(`  4. APPROVED case: ${approvedCase.customerName}`);
  console.log(`  5. REJECTED case: ${rejectedCase.customerName}`);
  console.log(`     - Rejection reason: ${rejectedCase.rejectionReason?.substring(0, 50)}...`);
  console.log(`  6. APPROVED case with comments: ${approvedCaseWithComments.customerName}`);
  console.log(`\nCreated 6 notifications covering all types:`);
  console.log('  ✓ CASE_APPROVED');
  console.log('  ✓ CASE_REJECTED');
  console.log('  ✓ NEW_COMMENT (x2)');
  console.log('  ✓ BADGE_EARNED');
  console.log('  ✓ BHAG_MILESTONE');
  console.log('\n✅ Test data seeding completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('Error seeding test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { CaseType, Status, WorkType, WearType } from '@prisma/client';

const prisma = new PrismaClient();

// Realistic welding industry data
const industries = [
  'Mining', 'Oil & Gas', 'Construction', 'Manufacturing', 'Power Generation',
  'Marine', 'Steel Production', 'Cement', 'Recycling', 'Agriculture'
];

const locations = [
  'Houston, TX', 'Aberdeen, UK', 'Dubai, UAE', 'Singapore', 'Rotterdam, Netherlands',
  'Perth, Australia', 'Calgary, Canada', 'Mumbai, India', 'Lagos, Nigeria', 'São Paulo, Brazil'
];

const waProducts = [
  'HARDLITE 600', 'STELLOY 6', 'NIFD 120', 'ROBODUR K 650', 'HARDFACE CN-O',
  'TERELOY 60RC', 'TEROBIT 65', 'NIFD 95', 'ROBODUR N 250', 'HARDFACE HC-O'
];

const components = [
  'Crusher Hammer', 'Drill Pipe', 'Excavator Bucket', 'Pump Impeller', 'Conveyor Roller',
  'Mixer Paddle', 'Shredder Blade', 'Valve Seat', 'Auger Flight', 'Chute Liner'
];

const caseStudyTemplates = [
  {
    customerName: 'Global Mining Corp',
    industry: 'Mining',
    componentWorkpiece: 'Crusher Hammers',
    problemDescription: 'Severe abrasion wear on crusher hammers causing frequent replacements every 3 weeks, resulting in high downtime and maintenance costs.',
    previousSolution: 'Standard chrome carbide overlay',
    previousServiceLife: '3 weeks',
    competitorName: 'CompetitorX Chrome Solutions',
    baseMetal: 'Carbon steel',
    generalDimensions: '800mm x 300mm x 150mm',
    waSolution: 'Applied HARDLITE 600 with specialized pattern for maximum wear resistance',
    technicalAdvantages: 'Superior carbide distribution, higher hardness (60-65 HRC), excellent impact resistance',
    expectedServiceLife: '12 weeks',
    solutionValueRevenue: 45000,
    annualPotentialRevenue: 180000,
    customerSavingsAmount: 120000,
  },
  {
    customerName: 'Offshore Energy Systems',
    industry: 'Oil & Gas',
    componentWorkpiece: 'Drill Pipe Tool Joints',
    problemDescription: 'Rapid wear on drill pipe connections during deep water drilling operations, causing safety concerns and operational delays.',
    previousSolution: 'Tungsten carbide hardbanding',
    previousServiceLife: '180 hours drilling time',
    competitorName: 'DrillTech Coatings',
    baseMetal: 'Tool steel',
    generalDimensions: '6.625" OD x 4.5" ID',
    waSolution: 'NIFD 120 casing-friendly hardbanding with optimized deposition',
    technicalAdvantages: 'Casing-friendly design, consistent hardness profile, minimal heat input',
    expectedServiceLife: '450 hours drilling time',
    solutionValueRevenue: 75000,
    annualPotentialRevenue: 300000,
    customerSavingsAmount: 200000,
  },
  {
    customerName: 'Steel Industries Ltd',
    industry: 'Steel Production',
    componentWorkpiece: 'Continuous Caster Rolls',
    problemDescription: 'Thermal fatigue and wear on continuous casting rolls leading to surface defects in steel products.',
    previousSolution: 'Standard roll coating',
    previousServiceLife: '2000 tons throughput',
    competitorName: 'RollCoat Industries',
    baseMetal: 'Forged steel',
    generalDimensions: '1200mm diameter x 2000mm length',
    waSolution: 'STELLOY 6 overlay with controlled dilution for thermal shock resistance',
    technicalAdvantages: 'Excellent thermal fatigue resistance, maintains surface finish, reduces product defects',
    expectedServiceLife: '6000 tons throughput',
    solutionValueRevenue: 95000,
    annualPotentialRevenue: 380000,
    customerSavingsAmount: 250000,
  },
];

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');
  console.log('📍 Seeding to:', process.env.DATABASE_URL?.includes('vercel') ? 'Vercel Production' : 'Local Database');

  try {
    // Ensure tidihatim@gmail.com exists as an approver/admin
    let approver = await prisma.user.findUnique({
      where: { email: 'tidihatim@gmail.com' },
    });

    if (!approver) {
      approver = await prisma.user.create({
        data: {
          email: 'tidihatim@gmail.com',
          name: 'Hatim Tidi',
          role: 'ADMIN',
          emailVerified: new Date(),
        },
      });
      console.log('✅ Created approver: tidihatim@gmail.com');
    } else {
      console.log('ℹ️  Approver exists: tidihatim@gmail.com');
    }

    // Create 5 contributor users
    const users = [];
    const userPasswords = [];

    for (let i = 1; i <= 5; i++) {
      const email = `contributor${i}@test.com`;
      const password = `TestPass${i}!`;
      const hashedPassword = await bcrypt.hash(password, 10);

      userPasswords.push({ email, password }); // Store for display later

      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: `Test Contributor ${i}`,
            role: 'CONTRIBUTOR',
            region: locations[i - 1].split(',')[1]?.trim() || 'Global',
            emailVerified: new Date(),
            totalPoints: 0,
          },
        });

        // Create credentials account
        await prisma.account.create({
          data: {
            userId: user.id,
            type: 'credentials',
            provider: 'credentials',
            providerAccountId: email,
            access_token: hashedPassword,
          },
        });

        console.log(`✅ Created user: ${user.name} (${email})`);
      } else {
        console.log(`ℹ️  User already exists: ${user.name} (${email})`);
      }

      users.push(user);
    }

    console.log('\n📋 User Credentials for Testing:');
    console.log('================================');
    userPasswords.forEach(({ email, password }) => {
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log('---');
    });

    // Create 20 case studies
    console.log('\n📝 Creating case studies...\n');

    const caseTypes: CaseType[] = ['APPLICATION', 'TECH', 'STAR'];
    const workTypes: WorkType[] = ['WORKSHOP', 'ON_SITE', 'BOTH'];
    const wearTypes: WearType[] = ['ABRASION', 'IMPACT', 'CORROSION', 'TEMPERATURE', 'COMBINATION'];

    // Define status distribution for 20 cases:
    // 8 APPROVED, 5 SUBMITTED (under review), 4 REJECTED, 3 DRAFT
    const statusDistribution: { status: Status, approver: boolean, rejected: boolean }[] = [
      // Approved cases (8)
      { status: 'APPROVED', approver: true, rejected: false },
      { status: 'APPROVED', approver: true, rejected: false },
      { status: 'APPROVED', approver: true, rejected: false },
      { status: 'APPROVED', approver: true, rejected: false },
      { status: 'APPROVED', approver: true, rejected: false },
      { status: 'APPROVED', approver: true, rejected: false },
      { status: 'APPROVED', approver: true, rejected: false },
      { status: 'APPROVED', approver: true, rejected: false },
      // Submitted cases (5) - under review
      { status: 'SUBMITTED', approver: false, rejected: false },
      { status: 'SUBMITTED', approver: false, rejected: false },
      { status: 'SUBMITTED', approver: false, rejected: false },
      { status: 'SUBMITTED', approver: false, rejected: false },
      { status: 'SUBMITTED', approver: false, rejected: false },
      // Rejected cases (4)
      { status: 'REJECTED', approver: false, rejected: true },
      { status: 'REJECTED', approver: false, rejected: true },
      { status: 'REJECTED', approver: false, rejected: true },
      { status: 'REJECTED', approver: false, rejected: true },
      // Draft cases (3)
      { status: 'DRAFT', approver: false, rejected: false },
      { status: 'DRAFT', approver: false, rejected: false },
      { status: 'DRAFT', approver: false, rejected: false },
    ];

    const rejectionReasons = [
      'Insufficient technical details provided. Please add more specific measurements and performance metrics.',
      'Missing cost analysis and ROI calculations. Please include detailed financial benefits.',
      'Incomplete solution description. Please provide more information about the welding procedures used.',
      'Customer testimonial and verification required. Please obtain customer approval for this case study.',
    ];

    for (let i = 0; i < 20; i++) {
      const contributorIndex = i % 5; // Distribute among 5 users
      const contributor = users[contributorIndex];
      const templateIndex = i % caseStudyTemplates.length;
      const template = caseStudyTemplates[templateIndex];
      const statusInfo = statusDistribution[i];

      // Vary the data for each case
      const caseType = caseTypes[i % 3];
      const workType = workTypes[i % 3];
      const selectedWearTypes = [
        wearTypes[i % 5],
        ...(i % 2 === 0 ? [wearTypes[(i + 1) % 5]] : []), // Some cases have multiple wear types
      ];

      const caseStudy = await prisma.caseStudy.create({
        data: {
          type: caseType,
          status: statusInfo.status,
          contributorId: contributor.id,
          // Approver details for approved cases
          approverId: statusInfo.approver ? approver.id : null,
          approvedAt: statusInfo.approver ? new Date(Date.now() - (i * 86400000)) : null,
          // Rejection details for rejected cases
          rejectedBy: statusInfo.rejected ? approver.id : null,
          rejectedAt: statusInfo.rejected ? new Date(Date.now() - (i * 86400000)) : null,
          rejectionReason: statusInfo.rejected ? rejectionReasons[i % rejectionReasons.length] : null,
          // Submission date for non-draft cases
          submittedAt: statusInfo.status !== 'DRAFT' ? new Date(Date.now() - ((i + 1) * 86400000)) : null,
          // Core case study data
          customerName: `${template.customerName} ${i + 1}`,
          industry: industries[i % industries.length],
          componentWorkpiece: components[i % components.length],
          workType: workType,
          wearType: selectedWearTypes,
          problemDescription: `${template.problemDescription} [Case #${i + 1}]`,
          previousSolution: template.previousSolution,
          previousServiceLife: template.previousServiceLife,
          competitorName: template.competitorName,
          baseMetal: template.baseMetal,
          generalDimensions: template.generalDimensions,
          waSolution: template.waSolution,
          waProduct: waProducts[i % waProducts.length],
          technicalAdvantages: template.technicalAdvantages,
          expectedServiceLife: template.expectedServiceLife,
          solutionValueRevenue: template.solutionValueRevenue + (i * 1000),
          annualPotentialRevenue: template.annualPotentialRevenue + (i * 2000),
          customerSavingsAmount: template.customerSavingsAmount + (i * 1500),
          location: locations[i % locations.length],
          country: locations[i % locations.length].split(',')[1]?.trim(),
          images: [],
          supportingDocs: [],
        },
      });

      // Award points for approved cases
      if (statusInfo.status === 'APPROVED') {
        const points = caseType === 'STAR' ? 3 : caseType === 'TECH' ? 2 : 1;
        await prisma.user.update({
          where: { id: contributor.id },
          data: {
            totalPoints: {
              increment: points,
            },
          },
        });
      }

      const statusDisplay = statusInfo.rejected ? `REJECTED by ${approver.name}` :
                          statusInfo.approver ? `APPROVED by ${approver.name}` :
                          statusInfo.status;
      console.log(`✅ Created case study #${i + 1}: ${caseStudy.customerName} - ${caseType} (${statusDisplay})`);
    }

    // Display summary
    console.log('\n📊 Seed Summary:');
    console.log('================');

    const totalUsers = await prisma.user.count({ where: { role: 'CONTRIBUTOR' } });
    const totalCases = await prisma.caseStudy.count();
    const draftCases = await prisma.caseStudy.count({ where: { status: 'DRAFT' } });
    const submittedCases = await prisma.caseStudy.count({ where: { status: 'SUBMITTED' } });
    const approvedCases = await prisma.caseStudy.count({ where: { status: 'APPROVED' } });
    const rejectedCases = await prisma.caseStudy.count({ where: { status: 'REJECTED' } });

    console.log(`Total Contributor Users: ${totalUsers}`);
    console.log(`Total Case Studies: ${totalCases}`);
    console.log(`  - Draft: ${draftCases}`);
    console.log(`  - Submitted (Under Review): ${submittedCases}`);
    console.log(`  - Approved by ${approver.name}: ${approvedCases}`);
    console.log(`  - Rejected by ${approver.name}: ${rejectedCases}`);

    console.log('\n✨ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedDatabase()
  .catch((e) => {
    console.error('Failed to seed database:', e);
    process.exit(1);
  });
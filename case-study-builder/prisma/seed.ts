import { PrismaClient, CaseType, Status, WorkType, WearType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sample data arrays
const industries = [
  'Mining', 'Steel Production', 'Cement Manufacturing', 'Pulp & Paper',
  'Power Generation', 'Oil & Gas', 'Chemical Processing', 'Food Processing',
  'Automotive Manufacturing', 'Aerospace', 'Sugar Processing', 'Recycling'
];

const locations = [
  'Australia', 'USA', 'Canada', 'Brazil', 'Chile', 'Peru', 'Mexico',
  'South Africa', 'India', 'China', 'Germany', 'UK', 'France', 'Spain',
  'Indonesia', 'Thailand', 'Vietnam', 'Japan', 'South Korea'
];

const components = [
  'Crusher Hammers', 'Mill Liners', 'Pump Impellers', 'Conveyor Rollers',
  'Grinding Media', 'Kiln Tires', 'Bucket Teeth', 'Wear Plates',
  'Screen Decks', 'Chute Liners', 'Pipe Spools', 'Valve Bodies',
  'Fan Blades', 'Mixer Arms', 'Agitator Shafts', 'Pressure Vessels',
  'Gears', 'Pinions', 'Rolls', 'Bearings', 'Dies', 'Molds'
];

const waProducts = [
  'FLUXOFIL 17', 'FLUXOFIL 55', 'FLUXOFIL 58', 'FLUXOFIL 60',
  'CARBOFIL 1', 'CARBOFIL MC', 'HARDFACE X210', 'HARDFACE X500',
  'DURMAT V', 'DURMAT H', 'WA NIFE 60', 'WA NIFE 80',
  'BUILDUP TIG', 'BUILDUP MIG', 'HARDFACE TIG', 'HARDFACE MIG'
];

const problems = [
  'Excessive wear causing frequent replacement',
  'Premature failure due to impact and abrasion',
  'Corrosion issues in harsh chemical environment',
  'High temperature degradation',
  'Cracking and spalling under cyclic loading',
  'Erosion from high-velocity particle flow',
  'Combination of wear and corrosion',
  'Fatigue failure from continuous operation'
];

const solutions = [
  'Applied hardfacing overlay with proprietary alloy',
  'Used FCAW process for superior metallurgical bond',
  'Implemented multi-layer buildup and hardfacing',
  'Optimized welding parameters for maximum hardness',
  'Created custom hardfacing procedure for specific application',
  'Combined different alloys for optimal wear resistance'
];

async function main() {
  console.log('Starting seed...');

  // Create test users
  const users = [];

  // Create APPROVER user
  const approver = await prisma.user.upsert({
    where: { email: 'approver@weldingalloys.com' },
    update: {},
    create: {
      email: 'approver@weldingalloys.com',
      name: 'John Approver',
      role: 'APPROVER',
      emailVerified: new Date(),
      totalPoints: 50,
      badges: [],
    },
  });
  users.push(approver);

  // Create CONTRIBUTOR users
  const contributorNames = [
    'Sarah Chen', 'Michael Rodriguez', 'Emily Thompson', 'David Kim',
    'Maria Garcia', 'James Wilson', 'Linda Martinez', 'Robert Taylor',
    'Jennifer Lee', 'William Anderson', 'Patricia Brown', 'Christopher Davis'
  ];

  for (const name of contributorNames) {
    const email = name.toLowerCase().replace(' ', '.') + '@weldingalloys.com';
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        role: 'CONTRIBUTOR',
        emailVerified: new Date(),
        totalPoints: Math.floor(Math.random() * 30),
        badges: [],
      },
    });
    users.push(user);
  }

  console.log(`Created ${users.length} users`);

  // Create 60 case studies - Direct creation to avoid spread operator type loss
  let createdCount = 0;

  for (let i = 0; i < 60; i++) {
    const caseType: CaseType =
      i < 30 ? CaseType.APPLICATION :
      i < 50 ? CaseType.TECH :
      CaseType.STAR;

    const industry = industries[Math.floor(Math.random() * industries.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const component = components[Math.floor(Math.random() * components.length)];
    const product = waProducts[Math.floor(Math.random() * waProducts.length)];
    const problem = problems[Math.floor(Math.random() * problems.length)];
    const solution = solutions[Math.floor(Math.random() * solutions.length)];

    const contributor = users[1 + Math.floor(Math.random() * (users.length - 1))]; // Skip approver

    const serviceLifeImprovement = 150 + Math.floor(Math.random() * 300); // 150-450%
    const annualSavings = 10000 + Math.floor(Math.random() * 90000); // $10k-$100k
    const previousLife = Math.floor(Math.random() * 800 + 200);
    const expectedLife = Math.floor(previousLife * (serviceLifeImprovement / 100));

    const status: Status = Math.random() > 0.2 ? Status.APPROVED : (Math.random() > 0.5 ? Status.SUBMITTED : Status.DRAFT);
    const hasApprover = Math.random() > 0.2;
    const submittedAt = new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000);
    const approvedAt = hasApprover ? new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000) : null;

    // Random wearType array (1-3 types) - Use correct uppercase enum values
    const allWearTypes = [WearType.ABRASION, WearType.IMPACT, WearType.CORROSION, WearType.TEMPERATURE, WearType.COMBINATION];
    const wearTypeCount = 1 + Math.floor(Math.random() * 3);
    const selectedWearTypes = allWearTypes.slice(0, wearTypeCount);

    // Random workType - Use correct enum values
    const workTypes = [WorkType.WORKSHOP, WorkType.ON_SITE, WorkType.BOTH];
    const selectedWorkType = workTypes[Math.floor(Math.random() * workTypes.length)];

    // Create case study directly inline
    await prisma.caseStudy.create({
      data: {
        type: caseType,
        status: status,
        contributorId: contributor.id,
        ...(hasApprover && { approverId: approver.id }),
        submittedAt: submittedAt,
        ...(approvedAt && { approvedAt: approvedAt }),

        customerName: `${industry} Corp ${location} #${i + 1}`,
        industry: industry,
        location: location,
        componentWorkpiece: component,
        workType: selectedWorkType,
        wearType: selectedWearTypes,

        problemDescription: `${problem}. The ${component.toLowerCase()} were experiencing ${(serviceLifeImprovement / 100 - 1).toFixed(1)}x faster than expected wear, resulting in unplanned downtime and high replacement costs. The harsh ${industry.toLowerCase()} environment accelerated degradation.`,

        previousSolution: `Standard OEM components with basic surface treatment. Expected life was ${Math.floor(Math.random() * 2000 + 1000)} hours but achieving only ${previousLife} hours.`,
        previousServiceLife: `${previousLife} hours`,

        competitorName: ['OEM Standard', 'Generic Hardfacing', 'Competitor A', 'Standard Solution'][Math.floor(Math.random() * 4)],

        baseMetal: ['1045 Steel', 'A36 Steel', 'Cast Iron', '304 Stainless', '4140 Steel'][Math.floor(Math.random() * 5)],
        generalDimensions: `${50 + Math.floor(Math.random() * 200)}mm x ${100 + Math.floor(Math.random() * 400)}mm, ${5 + Math.floor(Math.random() * 20)}mm thick`,

        waSolution: `${solution}. Applied ${product} using ${['FCAW', 'GMAW', 'GTAW', 'SMAW'][Math.floor(Math.random() * 4)]} process with optimized parameters. Multi-pass technique ensured excellent fusion and minimal dilution.`,

        waProduct: product,

        technicalAdvantages: `Superior hardness (${55 + Math.floor(Math.random() * 15)} HRC), excellent impact resistance, strong metallurgical bond to base metal, maintained toughness at operating temperature.`,

        expectedServiceLife: `${expectedLife} hours`,

        solutionValueRevenue: annualSavings * (1 + Math.random()),
        annualPotentialRevenue: annualSavings * 3,
        customerSavingsAmount: annualSavings,

        country: location,

        images: [],
        supportingDocs: [],
        originalLanguage: 'en',
        translationAvailable: false,
        translatedText: null,
      },
    });

    createdCount++;
  }

  console.log(`Created ${createdCount} case studies`);

  // Create system configuration defaults
  const configDefaults = [
    { key: 'bhag_target', value: '1000' },
    { key: 'points_application', value: '1' },
    { key: 'points_tech', value: '2' },
    { key: 'points_star', value: '3' },
    { key: 'badge_explorer_threshold', value: '10' },
    { key: 'badge_expert_threshold', value: '10' },
    { key: 'badge_champion_threshold', value: '10' },
  ];

  for (const config of configDefaults) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }

  console.log('Created system configuration defaults');

  // Update user points based on approved cases
  for (const user of users) {
    if (user.role === 'CONTRIBUTOR') {
      const approvedCases = await prisma.caseStudy.findMany({
        where: {
          contributorId: user.id,
          status: 'APPROVED',
        },
        select: { type: true },
      });

      const points = approvedCases.reduce((sum, cs) => {
        return sum + (cs.type === 'APPLICATION' ? 1 : cs.type === 'TECH' ? 2 : 3);
      }, 0);

      // Check for badges
      const badges = [];
      const appCount = approvedCases.filter(cs => cs.type === 'APPLICATION').length;
      const techCount = approvedCases.filter(cs => cs.type === 'TECH').length;
      const starCount = approvedCases.filter(cs => cs.type === 'STAR').length;

      if (appCount >= 10) badges.push('EXPLORER');
      if (techCount >= 10) badges.push('EXPERT');
      if (starCount >= 10) badges.push('CHAMPION');

      await prisma.user.update({
        where: { id: user.id },
        data: {
          totalPoints: points,
          badges: badges as any,
        },
      });
    }
  }

  console.log('Updated user points and badges');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

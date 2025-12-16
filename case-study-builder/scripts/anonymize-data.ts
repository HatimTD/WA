#!/usr/bin/env npx ts-node

/**
 * Data Anonymization Script
 *
 * WA Software Development Policy V2.3 - Section 4.2
 *
 * This script anonymizes production data for use in dev/test environments.
 * It replaces all PII (Personally Identifiable Information) with synthetic data
 * while preserving data structure and relationships.
 *
 * IMPORTANT: This script should ONLY be run against non-production databases!
 *
 * Usage:
 *   npx ts-node scripts/anonymize-data.ts
 *   npm run db:anonymize
 *
 * Environment Variables:
 *   POSTGRES_URL - Database connection string (MUST be dev/test database)
 *   ANONYMIZE_CONFIRM - Set to "true" to confirm execution
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  // Seed for consistent pseudonymization (same input = same output)
  seed: process.env.ANONYMIZE_SEED || 'wa-case-study-builder-anonymize-2024',
  // Preserve admin accounts (for testing)
  preserveAdminCount: 2,
  // Test domain for anonymized emails
  testDomain: 'test.example.com',
};

// Synthetic data generators
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Blake', 'Cameron', 'Dakota', 'Emery', 'Finley', 'Harper', 'Jamie', 'Kendall',
  'Logan', 'Madison', 'Peyton', 'Reese', 'Sage', 'Sydney', 'Terry', 'Val',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson',
  'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Young',
];

const REGIONS = ['Perth', 'Sydney', 'Melbourne', 'Brisbane', 'Adelaide', 'Darwin'];

const PRODUCT_TYPES = [
  'Industrial Adhesive', 'Sealant Solution', 'Coating System', 'Surface Treatment',
  'Bonding Agent', 'Protective Film', 'Structural Adhesive', 'Assembly Solution',
];

const INDUSTRIES = [
  'Mining', 'Construction', 'Agriculture', 'Manufacturing', 'Transportation',
  'Energy', 'Infrastructure', 'Marine', 'Automotive', 'Aerospace',
];

const COMPANIES = [
  'Acme Industries', 'Global Solutions', 'Pacific Resources', 'Metro Systems',
  'Horizon Group', 'Summit Corp', 'Atlas Works', 'Pioneer Services',
];

// Deterministic hash function for consistent anonymization
function hashString(input: string): string {
  return crypto
    .createHmac('sha256', CONFIG.seed)
    .update(input)
    .digest('hex');
}

// Get deterministic index from hash
function getHashIndex(input: string, arrayLength: number): number {
  const hash = hashString(input);
  const numericValue = parseInt(hash.substring(0, 8), 16);
  return numericValue % arrayLength;
}

// Generate anonymous name from original
function anonymizeName(original: string | null): string {
  if (!original) return `User ${Math.random().toString(36).substring(7)}`;
  const firstName = FIRST_NAMES[getHashIndex(original + 'first', FIRST_NAMES.length)];
  const lastName = LAST_NAMES[getHashIndex(original + 'last', LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

// Generate anonymous email from original
function anonymizeEmail(original: string): string {
  const hash = hashString(original).substring(0, 8);
  return `user.${hash}@${CONFIG.testDomain}`;
}

// Generate anonymous region
function anonymizeRegion(original: string | null): string {
  if (!original) return REGIONS[Math.floor(Math.random() * REGIONS.length)];
  return REGIONS[getHashIndex(original, REGIONS.length)];
}

// Anonymize case study content
function anonymizeCaseStudyContent(original: string | null, field: string): string {
  if (!original) return '';

  // Generate synthetic content based on field type
  const productType = PRODUCT_TYPES[getHashIndex(original, PRODUCT_TYPES.length)];
  const industry = INDUSTRIES[getHashIndex(original + 'ind', INDUSTRIES.length)];
  const company = COMPANIES[getHashIndex(original + 'comp', COMPANIES.length)];

  switch (field) {
    case 'title':
      return `${productType} Implementation for ${industry} Client`;
    case 'customerName':
      return company;
    case 'challenge':
      return `The client faced significant challenges with their existing ${productType.toLowerCase()} solution, including performance issues and increased maintenance costs in their ${industry.toLowerCase()} operations.`;
    case 'solution':
      return `WA provided a comprehensive ${productType.toLowerCase()} solution tailored for ${industry.toLowerCase()} applications, featuring enhanced durability and simplified application processes.`;
    case 'results':
      return `Implementation resulted in 30% improvement in efficiency, 25% reduction in maintenance costs, and extended service life. The solution has been successfully deployed across multiple ${industry.toLowerCase()} sites.`;
    case 'testimonial':
      return `"The WA team delivered an exceptional solution that exceeded our expectations. We've seen remarkable improvements across all key metrics." - Project Manager, ${company}`;
    case 'projectDescription':
      return `Large-scale ${productType.toLowerCase()} deployment for ${industry.toLowerCase()} client ${company}, involving technical consultation, product customization, and on-site implementation support.`;
    default:
      return `[Anonymized ${field}]`;
  }
}

// Anonymize comment content
function anonymizeComment(original: string): string {
  const comments = [
    'Great case study, very informative!',
    'This solution looks promising for our applications.',
    'Excellent documentation of the implementation process.',
    'The results are impressive. Consider highlighting the timeline.',
    'Good overview, might benefit from more technical details.',
    'Well-structured case study with clear outcomes.',
    'Useful reference for similar projects in our region.',
    'The customer testimonial adds credibility.',
  ];
  return comments[getHashIndex(original, comments.length)];
}

// Main anonymization function
async function anonymizeDatabase(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         WA Case Study Builder - Data Anonymization         ║');
  console.log('║                  WA Policy Section 4.2                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // Safety check - ensure this is not production
  const dbUrl = process.env.POSTGRES_URL || '';
  if (dbUrl.includes('production') || dbUrl.includes('prod')) {
    console.error('❌ ERROR: Cannot run anonymization on production database!');
    console.error('   Database URL contains "production" or "prod".');
    process.exit(1);
  }

  // Confirmation check
  if (process.env.ANONYMIZE_CONFIRM !== 'true') {
    console.log('⚠️  WARNING: This will permanently modify all data in the database!');
    console.log('');
    console.log('To confirm, run with: ANONYMIZE_CONFIRM=true npx ts-node scripts/anonymize-data.ts');
    console.log('');
    process.exit(0);
  }

  console.log('🔄 Starting data anonymization...\n');

  try {
    // 1. Clear sensitive sessions and tokens
    console.log('1️⃣  Clearing sessions and tokens...');
    await prisma.session.deleteMany();
    await prisma.verificationToken.deleteMany();
    console.log('   ✓ Sessions and tokens cleared\n');

    // 2. Anonymize users
    console.log('2️⃣  Anonymizing user data...');
    const users = await prisma.user.findMany();
    let userCount = 0;

    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: anonymizeName(user.name),
          email: anonymizeEmail(user.email),
          region: anonymizeRegion(user.region),
          image: null, // Remove profile images
        },
      });
      userCount++;
    }
    console.log(`   ✓ Anonymized ${userCount} users\n`);

    // 3. Anonymize accounts (OAuth tokens)
    console.log('3️⃣  Clearing OAuth tokens...');
    await prisma.account.updateMany({
      data: {
        refresh_token: null,
        access_token: null,
        id_token: null,
      },
    });
    console.log('   ✓ OAuth tokens cleared\n');

    // 4. Anonymize case studies
    console.log('4️⃣  Anonymizing case studies...');
    const caseStudies = await prisma.waCaseStudy.findMany();
    let caseCount = 0;

    for (const cs of caseStudies) {
      await prisma.waCaseStudy.update({
        where: { id: cs.id },
        data: {
          customerName: anonymizeCaseStudyContent(cs.customerName, 'customerName'),
          problemDescription: anonymizeCaseStudyContent(cs.problemDescription, 'challenge'),
          waSolution: anonymizeCaseStudyContent(cs.waSolution, 'solution'),
          previousSolution: cs.previousSolution
            ? anonymizeCaseStudyContent(cs.previousSolution, 'previousSolution')
            : null,
          technicalAdvantages: cs.technicalAdvantages
            ? anonymizeCaseStudyContent(cs.technicalAdvantages, 'results')
            : null,
          competitorName: cs.competitorName
            ? anonymizeCaseStudyContent(cs.competitorName, 'customerName')
            : null,
          // Clear file attachments
          images: [],
          supportingDocs: [],
        },
      });
      caseCount++;
    }
    console.log(`   ✓ Anonymized ${caseCount} case studies\n`);

    // 5. Anonymize comments
    console.log('5️⃣  Anonymizing comments...');
    const comments = await prisma.waComment.findMany();
    let commentCount = 0;

    for (const comment of comments) {
      await prisma.waComment.update({
        where: { id: comment.id },
        data: {
          content: anonymizeComment(comment.content),
        },
      });
      commentCount++;
    }
    console.log(`   ✓ Anonymized ${commentCount} comments\n`);

    // 6. Anonymize notifications
    console.log('6️⃣  Anonymizing notifications...');
    await prisma.waNotification.updateMany({
      data: {
        message: 'Notification content anonymized',
      },
    });
    const notificationCount = await prisma.waNotification.count();
    console.log(`   ✓ Anonymized ${notificationCount} notifications\n`);

    // 7. Clear audit logs (or anonymize if needed for testing)
    console.log('7️⃣  Clearing sensitive audit data...');
    // Note: In a real scenario, you might want to anonymize rather than delete
    // depending on test requirements
    const auditCount = await prisma.waAuditLog.count();
    await prisma.waAuditLog.updateMany({
      data: {
        ipAddress: '0.0.0.0',
        userAgent: 'Anonymized',
        previousState: { anonymized: true },
        newState: { anonymized: true },
      },
    });
    console.log(`   ✓ Anonymized ${auditCount} audit log entries\n`);

    // Summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                  Anonymization Complete!                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • Users anonymized: ${userCount}`);
    console.log(`   • Case studies anonymized: ${caseCount}`);
    console.log(`   • Comments anonymized: ${commentCount}`);
    console.log(`   • Notifications anonymized: ${notificationCount}`);
    console.log(`   • Audit logs anonymized: ${auditCount}`);
    console.log('');
    console.log('✅ Data is now safe for dev/test environments');
    console.log('');
    console.log('⚠️  Remember:');
    console.log('   - All email addresses now use @test.example.com');
    console.log('   - OAuth tokens have been cleared - users must re-authenticate');
    console.log('   - File attachments have been removed');
    console.log('');

  } catch (error) {
    console.error('❌ Anonymization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Validation function to check if data is anonymized
async function validateAnonymization(): Promise<boolean> {
  console.log('🔍 Validating anonymization...\n');

  const users = await prisma.user.findMany({ take: 5 });
  let isValid = true;

  for (const user of users) {
    if (!user.email.endsWith(`@${CONFIG.testDomain}`)) {
      console.log(`   ❌ User ${user.id} has non-anonymized email`);
      isValid = false;
    }
    if (user.image) {
      console.log(`   ❌ User ${user.id} still has profile image`);
      isValid = false;
    }
  }

  const sessions = await prisma.session.count();
  if (sessions > 0) {
    console.log(`   ❌ ${sessions} sessions still exist`);
    isValid = false;
  }

  if (isValid) {
    console.log('   ✓ All validation checks passed\n');
  }

  return isValid;
}

// Export functions for programmatic use
export {
  anonymizeDatabase,
  validateAnonymization,
  anonymizeName,
  anonymizeEmail,
  CONFIG,
};

// Run if executed directly
if (require.main === module) {
  anonymizeDatabase()
    .then(() => validateAnonymization())
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

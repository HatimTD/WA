const fs = require('fs');
const path = require('path');

const metadataMap = {
  'app/dashboard/new/page.tsx': {
    title: 'Create New Case Study',
    description: 'Create a new case study to document industrial challenges and solutions'
  },
  'app/dashboard/my-cases/page.tsx': {
    title: 'My Case Studies',
    description: 'View and manage all your submitted case studies'
  },
  'app/dashboard/library/page.tsx': {
    title: 'Case Study Library',
    description: 'Browse the complete library of approved case studies'
  },
  'app/dashboard/analytics/page.tsx': {
    title: 'Analytics Dashboard',
    description: 'View comprehensive analytics and insights for case studies'
  },
  'app/dashboard/settings/page.tsx': {
    title: 'Settings',
    description: 'Manage your account settings and preferences'
  },
  'app/dashboard/approvals/page.tsx': {
    title: 'Pending Approvals',
    description: 'Review and approve submitted case studies'
  },
  'app/dashboard/leaderboard/page.tsx': {
    title: 'Leaderboard',
    description: 'View top contributors and their achievements'
  },
  'app/dashboard/saved/page.tsx': {
    title: 'Saved Case Studies',
    description: 'Access your saved case studies for quick reference'
  },
  'app/dashboard/compare/page.tsx': {
    title: 'Compare Case Studies',
    description: 'Compare multiple case studies side by side'
  },
  'app/dashboard/search/page.tsx': {
    title: 'Search Case Studies',
    description: 'Advanced search for case studies with filters'
  },
  'app/dashboard/bhag/page.tsx': {
    title: 'BHAG Progress',
    description: 'Track progress toward solving 100,000 challenges by 2030'
  }
};

function addMetadataToFile(filePath, metadata) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`✗ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Check if metadata already exists
  if (content.includes('export const metadata')) {
    console.log(`→ Metadata already exists in ${filePath}`);
    return;
  }

  // Check if it's a client component
  if (content.includes("'use client'")) {
    console.log(`→ Skipping client component: ${filePath}`);
    return;
  }

  // Find the import section
  const importMatch = content.match(/(import[\s\S]*?)\n\n/);
  if (!importMatch) {
    console.log(`✗ Could not find import section in ${filePath}`);
    return;
  }

  // Add Metadata import if not present
  if (!content.includes("import type { Metadata }")) {
    const lastImport = importMatch[1];
    content = content.replace(
      lastImport,
      lastImport + "\nimport type { Metadata } from 'next';"
    );
  }

  // Add metadata export after imports
  const metadataExport = `
export const metadata: Metadata = {
  title: '${metadata.title}',
  description: '${metadata.description}',
  robots: {
    index: false,
    follow: false,
  },
};
`;

  // Find where to insert (after imports, before the default export)
  const defaultExportMatch = content.match(/export\s+default\s+/);
  if (defaultExportMatch) {
    const insertPos = defaultExportMatch.index;
    content = content.slice(0, insertPos) + metadataExport + '\n' + content.slice(insertPos);

    fs.writeFileSync(fullPath, content);
    console.log(`✓ Added metadata to ${filePath}`);
  } else {
    console.log(`✗ Could not find default export in ${filePath}`);
  }
}

// Process all files
console.log('Adding metadata to dashboard pages...\n');
for (const [filePath, metadata] of Object.entries(metadataMap)) {
  addMetadataToFile(filePath, metadata);
}
console.log('\n✨ Metadata addition complete!');
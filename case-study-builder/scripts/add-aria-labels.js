const fs = require('fs');
const path = require('path');
const glob = require('glob');

// ARIA label improvements map
const ariaImprovements = [
  // Navigation improvements
  {
    pattern: /<aside className=\{cn\(/,
    replacement: '<aside role="navigation" aria-label="Main navigation" className={cn(',
    description: 'Add navigation role to sidebar'
  },
  {
    pattern: /<nav className=/,
    replacement: '<nav aria-label="Primary navigation" className=',
    description: 'Add aria-label to nav elements'
  },

  // Button improvements
  {
    pattern: /<Button\s+variant="ghost"\s+className="[^"]*"\s+onClick=\{[^}]*signOut/,
    replacement: '<Button variant="ghost" aria-label="Sign out" className="$1" onClick={$2signOut',
    description: 'Add aria-label to logout button'
  },
  {
    pattern: /<Button\s+className="[^"]*"\s+size="icon"/,
    replacement: '<Button aria-label="Menu toggle" className="$1" size="icon"',
    description: 'Add aria-label to icon buttons'
  },

  // Form improvements
  {
    pattern: /<input\s+type="search"/,
    replacement: '<input type="search" aria-label="Search case studies"',
    description: 'Add aria-label to search inputs'
  },
  {
    pattern: /<textarea\s+id="([^"]*)"/,
    replacement: '<textarea aria-label="$1" id="$1"',
    description: 'Add aria-label to textareas'
  },

  // Image improvements
  {
    pattern: /<img\s+src="([^"]*)"(?!\s+alt=)/,
    replacement: '<img src="$1" alt=""',
    description: 'Add alt attribute to images'
  },

  // Loading state improvements
  {
    pattern: /<div className="[^"]*animate-pulse[^"]*"/,
    replacement: '<div role="status" aria-label="Loading" className="$1animate-pulse$2"',
    description: 'Add role and aria-label to loading states'
  },

  // Modal/Dialog improvements
  {
    pattern: /<div className="[^"]*modal[^"]*"/,
    replacement: '<div role="dialog" aria-modal="true" className="$1modal$2"',
    description: 'Add dialog role to modals'
  },

  // Table improvements
  {
    pattern: /<table(?!\s+(role|aria))/,
    replacement: '<table role="table"',
    description: 'Add table role'
  },

  // Card improvements
  {
    pattern: /<Card(?!\s+role)/,
    replacement: '<Card role="article"',
    description: 'Add article role to cards'
  },

  // Link improvements for icon-only links
  {
    pattern: /<Link\s+href="([^"]*)"[^>]*>\s*<([A-Z][a-zA-Z]*)\s+className="[^"]*icon[^"]*"\s*\/>/,
    replacement: '<Link href="$1" aria-label="Navigate to $1">\\n<$2 className="$3icon$4" aria-hidden="true" />',
    description: 'Add aria-label to icon-only links'
  }
];

// Files to process
const filesToProcess = [
  'components/dashboard-nav.tsx',
  'components/top-bar.tsx',
  'components/case-study-form/*.tsx',
  'components/library-search.tsx',
  'components/library-filters.tsx',
  'components/save-button.tsx',
  'components/notification-bell.tsx',
  'components/theme-toggle.tsx',
  'components/share-button.tsx',
  'app/dashboard/**/*.tsx',
  'app/library/**/*.tsx',
];

function processFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    return { path: filePath, status: 'not found', changes: 0 };
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  let changeCount = 0;

  ariaImprovements.forEach(improvement => {
    const regex = new RegExp(improvement.pattern.source, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, improvement.replacement);
      changeCount++;
    }
  });

  // Additional specific improvements

  // Add aria-label to icon buttons
  content = content.replace(
    /<Button([^>]*?)size="icon"([^>]*?)>/g,
    (match, p1, p2) => {
      if (!match.includes('aria-label')) {
        return `<Button${p1}size="icon" aria-label="Button"${p2}>`;
      }
      return match;
    }
  );

  // Add aria-current to active navigation items
  content = content.replace(
    /pathname === '([^']*)'[\s\S]*?<Link/g,
    (match) => {
      if (!match.includes('aria-current')) {
        return match.replace('<Link', '<Link aria-current={pathname === \'$1\' ? \'page\' : undefined}');
      }
      return match;
    }
  );

  // Add aria-expanded to collapsible elements
  content = content.replace(
    /isCollapsed\s*\?\s*"([^"]*)"\s*:\s*"([^"]*)"/g,
    (match) => {
      if (match.includes('className')) {
        return match + '} aria-expanded={!isCollapsed';
      }
      return match;
    }
  );

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    return { path: filePath, status: 'updated', changes: changeCount };
  }

  return { path: filePath, status: 'unchanged', changes: 0 };
}

console.log('Adding ARIA labels for accessibility improvements...\n');

let totalChanges = 0;
let updatedFiles = 0;

filesToProcess.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: path.join(__dirname, '..') });

  files.forEach(file => {
    const result = processFile(file);

    if (result.status === 'updated') {
      console.log(`✓ Updated ${result.path} (${result.changes} changes)`);
      totalChanges += result.changes;
      updatedFiles++;
    } else if (result.status === 'not found') {
      console.log(`✗ Not found: ${result.path}`);
    }
  });
});

console.log(`\n✨ Accessibility improvements complete!`);
console.log(`   Updated ${updatedFiles} files with ${totalChanges} improvements`);
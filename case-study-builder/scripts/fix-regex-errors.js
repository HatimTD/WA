const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all affected files
const files = glob.sync('**/*.{tsx,ts}', {
  cwd: path.join(__dirname, '..'),
  ignore: ['node_modules/**', '.next/**', 'scripts/**']
});

let totalFixed = 0;

files.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;

  // Fix regex replacement errors
  // Fix animate-pulse issues
  content = content.replace(/className="(\$1)?animate-pulse(\$2)?"/g, 'className="animate-pulse"');
  content = content.replace(/className="([^"]*)\$1animate-pulse\$2([^"]*)"/g, 'className="$1animate-pulse$2"');

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✓ Fixed ${file}`);
    totalFixed++;
  }
});

console.log(`\n✨ Fixed ${totalFixed} files with regex replacement errors`);
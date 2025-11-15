const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all affected files
const files = glob.sync('**/*.{tsx,ts}', {
  cwd: path.join(__dirname, '..'),
  ignore: ['node_modules/**', '.next/**']
});

let totalFixed = 0;

files.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;

  // Fix all Card component issues
  const fixes = [
    { from: /Card role="article"Header/g, to: 'CardHeader' },
    { from: /Card role="article"Title/g, to: 'CardTitle' },
    { from: /Card role="article"Content/g, to: 'CardContent' },
    { from: /Card role="article"Description/g, to: 'CardDescription' },
    { from: /Card role="article"Footer/g, to: 'CardFooter' }
  ];

  fixes.forEach(fix => {
    if (fix.from.test(content)) {
      content = content.replace(fix.from, fix.to);
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✓ Fixed ${file}`);
    totalFixed++;
  }
});

console.log(`\n✨ Fixed ${totalFixed} files with Card component issues`);
const fs = require('fs');
const path = require('path');

// SVG template for screenshots
function createScreenshotSVG(title, subtitle, width, height, isMobile = false) {
  const bgColor = '#111827';
  const primaryColor = '#006838';
  const textColor = '#ffffff';
  const cardBg = '#1f2937';

  // Create a more realistic layout
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="${bgColor}"/>

    <!-- Header -->
    <rect x="0" y="0" width="${width}" height="${isMobile ? 60 : 80}" fill="${cardBg}"/>

    <!-- Logo and Title -->
    <rect x="${isMobile ? 20 : 40}" y="${isMobile ? 15 : 20}" width="${isMobile ? 30 : 40}" height="${isMobile ? 30 : 40}" rx="4" fill="${primaryColor}"/>
    <text x="${isMobile ? 65 : 100}" y="${isMobile ? 37 : 45}" fill="${textColor}" font-family="Arial, sans-serif" font-size="${isMobile ? 18 : 24}" font-weight="bold">Case Study Builder</text>

    <!-- Main Title -->
    <text x="${isMobile ? 20 : 40}" y="${isMobile ? 120 : 150}" fill="${textColor}" font-family="Arial, sans-serif" font-size="${isMobile ? 28 : 36}" font-weight="bold">${title}</text>
    <text x="${isMobile ? 20 : 40}" y="${isMobile ? 150 : 190}" fill="#9ca3af" font-family="Arial, sans-serif" font-size="${isMobile ? 16 : 20}">${subtitle}</text>

    <!-- Content Cards -->
    ${generateContentCards(width, height, isMobile, cardBg)}

    <!-- Navigation (Mobile Bottom, Desktop Sidebar) -->
    ${isMobile ? generateMobileNav(width, height, cardBg) : generateDesktopNav(height, cardBg)}
  </svg>`;

  return svg;
}

function generateContentCards(width, height, isMobile, cardBg) {
  let cards = '';
  const startY = isMobile ? 200 : 250;
  const cardHeight = isMobile ? 120 : 150;
  const cardSpacing = 20;
  const sideMargin = isMobile ? 20 : (width > 1200 ? 280 : 40);
  const cardWidth = width - (sideMargin * 2);

  for (let i = 0; i < 3; i++) {
    const y = startY + (i * (cardHeight + cardSpacing));
    if (y + cardHeight > height - 100) break;

    cards += `
      <!-- Card ${i + 1} -->
      <rect x="${sideMargin}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="8" fill="${cardBg}"/>
      <rect x="${sideMargin + 20}" y="${y + 20}" width="${cardWidth - 40}" height="20" rx="4" fill="#374151"/>
      <rect x="${sideMargin + 20}" y="${y + 50}" width="${cardWidth - 80}" height="12" rx="3" fill="#4b5563"/>
      <rect x="${sideMargin + 20}" y="${y + 70}" width="${cardWidth - 120}" height="12" rx="3" fill="#4b5563"/>
    `;
  }

  return cards;
}

function generateMobileNav(width, height, cardBg) {
  const navHeight = 70;
  const navY = height - navHeight;
  const iconSize = 24;
  const icons = 4;
  const spacing = width / (icons + 1);

  let nav = `<rect x="0" y="${navY}" width="${width}" height="${navHeight}" fill="${cardBg}"/>`;

  for (let i = 0; i < icons; i++) {
    const x = spacing * (i + 1) - (iconSize / 2);
    nav += `<rect x="${x}" y="${navY + 23}" width="${iconSize}" height="${iconSize}" rx="4" fill="#6b7280"/>`;
  }

  return nav;
}

function generateDesktopNav(height, cardBg) {
  const navWidth = 240;
  let nav = `<rect x="0" y="80" width="${navWidth}" height="${height - 80}" fill="${cardBg}"/>`;

  // Menu items
  const items = ['Dashboard', 'New Case', 'Library', 'Analytics', 'Settings'];
  items.forEach((item, i) => {
    const y = 120 + (i * 50);
    nav += `
      <rect x="20" y="${y}" width="200" height="40" rx="6" fill="${i === 0 ? '#006838' : 'transparent'}"/>
      <text x="40" y="${y + 25}" fill="#ffffff" font-family="Arial, sans-serif" font-size="14">${item}</text>
    `;
  });

  return nav;
}

// Screenshot configurations
const screenshots = [
  {
    filename: 'mobile-dashboard.png',
    title: 'Dashboard',
    subtitle: 'Track your case studies and progress',
    width: 750,
    height: 1334,
    isMobile: true
  },
  {
    filename: 'mobile-new-case.png',
    title: 'Create New Case',
    subtitle: 'Step-by-step guided process',
    width: 750,
    height: 1334,
    isMobile: true
  },
  {
    filename: 'mobile-library.png',
    title: 'Case Library',
    subtitle: 'Browse and search all cases',
    width: 750,
    height: 1334,
    isMobile: true
  },
  {
    filename: 'mobile-analytics.png',
    title: 'Analytics',
    subtitle: 'Visualize performance and trends',
    width: 750,
    height: 1334,
    isMobile: true
  },
  {
    filename: 'desktop-dashboard.png',
    title: 'Dashboard',
    subtitle: 'Full-featured workspace',
    width: 1920,
    height: 1080,
    isMobile: false
  },
  {
    filename: 'desktop-library.png',
    title: 'Case Library',
    subtitle: 'Advanced search and filtering',
    width: 1920,
    height: 1080,
    isMobile: false
  }
];

// Generate SVG files
console.log('📸 Generating PWA screenshots...');
const outputDir = path.join(__dirname, '..', 'public', 'screenshots');

screenshots.forEach(config => {
  const svg = createScreenshotSVG(
    config.title,
    config.subtitle,
    config.width,
    config.height,
    config.isMobile
  );

  const svgPath = path.join(outputDir, config.filename.replace('.png', '.svg'));
  fs.writeFileSync(svgPath, svg);
  console.log(`✓ Created ${config.filename.replace('.png', '.svg')}`);
});

console.log('\n✨ SVG screenshots generated successfully!');
console.log('Note: For production, convert these SVGs to PNGs using:');
console.log('- Online tool: https://cloudconvert.com/svg-to-png');
console.log('- Or install sharp: npm install sharp');
console.log('- Or use ImageMagick: convert screenshot.svg screenshot.png');
// Simple script to generate placeholder PWA icons
// Requires: npm install canvas

const fs = require('fs');
const path = require('path');

try {
  const { createCanvas } = require('canvas');

  function createIcon(size, filename) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background - Welding Alloys blue
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, 0, size, size);

    // White text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(size * 0.35)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CS', size / 2, size / 2);

    // Save to public directory
    const publicPath = path.join(__dirname, '..', 'public', filename);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(publicPath, buffer);
    console.log(`✓ Created ${filename} (${size}x${size}px)`);
  }

  console.log('Generating PWA icons...\n');
  createIcon(192, 'icon-192.png');
  createIcon(512, 'icon-512.png');
  console.log('\n✅ Icons generated successfully!');
  console.log('📱 Your PWA is now installable');
  console.log('\nTo test installation:');
  console.log('1. Open http://localhost:3010 in Chrome');
  console.log('2. Look for the install icon in the address bar');
  console.log('3. Click it to install the app\n');

} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('⚠️  Canvas module not found.');
    console.log('\nTo generate icons automatically, install canvas:');
    console.log('  npm install canvas\n');
    console.log('Then run: node scripts/generate-icons.js\n');
    console.log('Alternative: Create icons manually following public/README-PWA.md\n');
  } else {
    console.error('Error generating icons:', error);
  }
}

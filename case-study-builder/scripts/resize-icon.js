const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const inputIcon = path.join(publicDir, 'icon-192.png');
const outputIcon = path.join(publicDir, 'icon-512.png');

async function resizeIcon() {
  try {
    console.log('Resizing icon-192.png to 512x512...');

    await sharp(inputIcon)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputIcon);

    console.log('✓ Successfully created icon-512.png (512x512)');

    // Verify the output
    const metadata = await sharp(outputIcon).metadata();
    console.log(`✓ Verified: ${metadata.width}x${metadata.height} pixels`);
  } catch (error) {
    console.error('Error resizing icon:', error);
    process.exit(1);
  }
}

resizeIcon();

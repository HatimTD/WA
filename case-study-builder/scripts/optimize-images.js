const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImages() {
  const publicDir = path.join(__dirname, '..', 'public');

  const images = [
    { input: 'icon-512.png', output: 'icon-512-optimized.png', size: 512 },
    { input: 'icon-192.png', output: 'icon-192-optimized.png', size: 192 },
    { input: 'apple-touch-icon.png', output: 'apple-touch-icon-optimized.png', size: 180 }
  ];

  for (const img of images) {
    const inputPath = path.join(publicDir, img.input);
    const outputPath = path.join(publicDir, img.output);

    if (fs.existsSync(inputPath)) {
      try {
        await sharp(inputPath)
          .resize(img.size, img.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png({
            quality: 90,
            compressionLevel: 9,
            palette: true,
            colors: 256
          })
          .toFile(outputPath);

        const originalSize = fs.statSync(inputPath).size;
        const newSize = fs.statSync(outputPath).size;
        const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);

        console.log(`✓ ${img.input}: ${(originalSize/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB (${reduction}% reduction)`);

        // Replace original with optimized version
        fs.renameSync(outputPath, inputPath);
      } catch (error) {
        console.error(`✗ Error optimizing ${img.input}:`, error.message);
      }
    } else {
      console.log(`✗ ${img.input} not found`);
    }
  }
}

optimizeImages().then(() => {
  console.log('\n✨ Image optimization complete!');
}).catch(error => {
  console.error('Error during optimization:', error);
  process.exit(1);
});
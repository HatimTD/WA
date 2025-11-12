# PWA Icon Setup

## Required Icons

The Progressive Web App requires the following icon files in the `/public` directory:

- **icon-192.png** (192x192 pixels) - Android home screen icon
- **icon-512.png** (512x512 pixels) - Android splash screen icon

## Creating Icons

### Option 1: Using a Design Tool (Recommended)

1. Create your icon design in Figma, Adobe Illustrator, or similar
2. Export as PNG at the following sizes:
   - 192x192px (save as `icon-192.png`)
   - 512x512px (save as `icon-512.png`)
3. Place both files in the `/public` directory

### Option 2: Quick Placeholder Icons

For development/testing, you can create simple placeholder icons:

#### Using ImageMagick (Command Line):
```bash
# Create a 192x192 blue icon with "CS" text
convert -size 192x192 xc:"#2563eb" -gravity center -pointsize 72 -fill white -annotate +0+0 "CS" public/icon-192.png

# Create a 512x512 blue icon with "CS" text
convert -size 512x512 xc:"#2563eb" -gravity center -pointsize 200 -fill white -annotate +0+0 "CS" public/icon-512.png
```

#### Using Node.js Script:
```javascript
// create-icons.js
const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(0, 0, size, size);

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CS', size / 2, size / 2);

  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/${filename}`, buffer);
  console.log(`Created ${filename}`);
}

createIcon(192, 'icon-192.png');
createIcon(512, 'icon-512.png');
```

### Option 3: Online Icon Generator

Use free online tools like:
- https://favicon.io/
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

Upload your logo and generate all required sizes automatically.

## Design Guidelines

### Recommended Icon Design:
- **Background**: Solid color (current theme: #2563eb blue)
- **Logo/Text**: White or contrasting color
- **Content**: Simple, recognizable symbol or initials
- **Padding**: 10-15% from edges for safe area
- **File Format**: PNG with transparency (if needed)

### Current Placeholder Concept:
- Blue background (#2563eb)
- White "CS" text (for Case Study Builder)
- Centered, bold sans-serif font

## Testing PWA Installation

After adding icons:

1. **Desktop (Chrome/Edge)**:
   - Open http://localhost:3010
   - Click the install icon in the address bar
   - Or go to Menu → Install Case Study Builder

2. **Mobile (Android)**:
   - Open the site in Chrome/Edge
   - Menu → Add to Home Screen
   - Check that the icon appears correctly

3. **Mobile (iOS)**:
   - Open in Safari
   - Share → Add to Home Screen
   - Note: iOS uses the apple-touch-icon (icon-192.png)

## Verification

Run Lighthouse audit in Chrome DevTools:
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Check "Progressive Web App"
4. Click "Analyze page load"
5. Ensure PWA installability passes

## Current PWA Features

✅ Web App Manifest configured
✅ Theme color set (#2563eb)
✅ Display mode: standalone
✅ Icons specified (placeholders needed)
✅ Viewport meta tags
✅ Apple touch icons
✅ Start URL configured
✅ Offline support (basic)

## Next Steps

1. Create or obtain branded WA logo icons
2. Replace placeholder icons
3. Test installation on all target devices
4. Optional: Add service worker for offline functionality
5. Optional: Add app screenshots to manifest

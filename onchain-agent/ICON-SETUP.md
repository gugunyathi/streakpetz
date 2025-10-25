# App Icons Setup

## Required Icons

To complete the PWA setup, you need to create the following icon files in the `public/` folder:

### Icon Specifications

1. **icon-192.png** (192x192 pixels)
   - Purpose: Small app icon for home screen
   - Format: PNG with transparency
   - Content: StreakPets logo or 🐾 emoji
   - Location: `/public/icon-192.png`

2. **icon-512.png** (512x512 pixels)
   - Purpose: Large app icon for splash screen
   - Format: PNG with transparency
   - Content: StreakPets logo or 🐾 emoji
   - Location: `/public/icon-512.png`

### Quick Setup Options

#### Option 1: Use Emoji (Fastest)
You can use online tools to convert the 🐾 emoji to PNG:
- https://emoji-to-png.vercel.app/
- https://www.favicon.cc/
- Export at 512x512 and 192x192 sizes

#### Option 2: Design Custom Icons
1. Create a design in Figma/Canva/Photoshop
2. Export at both sizes
3. Ensure square dimensions
4. Use transparent background
5. Save as PNG

#### Option 3: Generate with AI
Use AI tools to generate:
- Purple gradient background
- Cute pet paw print or pet character
- "SP" text or "StreakPets" branding

### Colors to Use
- Primary: #7c3aed (Purple)
- Secondary: #3b82f6 (Blue)
- Background: Gradient from purple to blue

### Icon Guidelines
- Keep design simple and recognizable
- Ensure it looks good at small sizes
- Use high contrast
- Avoid fine details
- Test on both light and dark backgrounds

## Installation

Once you create the icons:
1. Save them in `/public/` folder
2. Restart the dev server
3. Test PWA installation on mobile device

## Testing PWA Installation

### iOS (Safari)
1. Open app in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. Your icon should appear

### Android (Chrome)
1. Open app in Chrome
2. Tap menu (three dots)
3. Select "Install app" or "Add to Home Screen"
4. Your icon should appear

## Current Status
⚠️ **Icons not yet created** - Add icon-192.png and icon-512.png to complete PWA setup.

The manifest.json is configured and ready. Just add the icons to enable full PWA functionality!

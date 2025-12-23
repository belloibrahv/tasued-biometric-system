import sharp from 'sharp';
import fs from 'fs/promises';

async function createFavicon() {
  try {
    // Check if logo.png exists
    await fs.access('public/images/logo.png');
    
    // Create favicon.ico from the logo.png
    // We can actually just create a PNG favicon and reference it; most modern browsers support this
    // But I'll also try to create a 32x32 version specifically for favicon use
    await sharp('public/images/logo.png')
      .resize(32, 32)
      .png()
      .toFile('public/favicon.ico'); // Save as PNG but with .ico extension to serve the same purpose
      
    // Also create a true PNG favicon
    await sharp('public/images/logo.png')
      .resize(32, 32)
      .png()
      .toFile('public/favicon.png');
    
    console.log('Favicon files created successfully!');
    console.log('Created: favicon.ico and favicon.png');
    
  } catch (error) {
    console.error('Error creating favicon:', error);
  }
}

createFavicon();
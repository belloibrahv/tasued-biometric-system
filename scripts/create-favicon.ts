import sharp from 'sharp';
import fs from 'fs/promises';

async function createFavicon() {
  try {
    // Check if logo.png exists
    await fs.access('public/images/logo.png');
    
    // Create favicon.ico from the logo.png
    await sharp('public/images/logo.png')
      .resize(32, 32)
      .toFormat('png')
      .toFile('public/favicon-32x32.png');
    
    await sharp('public/images/logo.png')
      .resize(16, 16)
      .toFormat('png')
      .toFile('public/favicon-16x16.png');
      
    // Create a simple favicon.ico using the 16x16 version
    // Note: For a proper ICO file with multiple sizes, we'd need a more complex approach
    // But most browsers will work fine with PNG favicons
    console.log('Favicon images created successfully!');
    console.log('Created: favicon-16x16.png and favicon-32x32.png');
    
  } catch (error) {
    console.error('Error creating favicon:', error);
  }
}

createFavicon();
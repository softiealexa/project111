
import { promises as fs } from 'fs';
import path from 'path';
import LandingPageClient from './landing-page-client';

async function getImages() {
  const imageDirectory = path.join(process.cwd(), 'public/img');
  try {
    // Check if directory exists before trying to read it
    await fs.access(imageDirectory);
    const imageFilenames = await fs.readdir(imageDirectory);
    const validImages = imageFilenames.filter(name => /\.(png|jpg|jpeg|gif|svg)$/.test(name));
    
    if (validImages.length > 0) {
      return validImages.map(name => `/img/${name}`);
    }
  } catch (error) {
    // Log the error for debugging purposes, but don't fail the build
    console.error("Could not read image directory (this is expected if the folder is empty or doesn't exist):", error);
  }
  
  // Return a default image if the directory doesn't exist or is empty
  return ['/og-image.png'];
}

export default async function LandingPage() {
  const imageUrls = await getImages();
  return <LandingPageClient imageUrls={imageUrls} />;
}

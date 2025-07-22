
import { promises as fs } from 'fs';
import path from 'path';
import LandingPageClient from './landing-page-client';

async function getImages() {
  const imageDirectory = path.join(process.cwd(), 'public/img');
  try {
    const imageFilenames = await fs.readdir(imageDirectory);
    return imageFilenames
      .filter(name => /\.(png|jpg|jpeg|gif|svg)$/.test(name))
      .map(name => `/img/${name}`);
  } catch (error) {
    console.error("Could not read image directory:", error);
    // Return a default image if the directory doesn't exist or there's an error
    return ['/og-image.png'];
  }
}

export default async function LandingPage() {
  const imageUrls = await getImages();
  return <LandingPageClient imageUrls={imageUrls} />;
}

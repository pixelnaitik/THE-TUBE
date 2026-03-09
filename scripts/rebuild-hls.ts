import { PrismaClient } from '@prisma/client';
import { processVideoToHLS } from './src/lib/videoProcessor';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const videos = await prisma.video.findMany({
    where: { hlsUrl: { endsWith: '.mp4' } }
  });

  console.log(`Found ${videos.length} videos that need HLS processing`);

  for (const video of videos) {
    console.log(`Processing video ID: ${video.id}`);
    const videoPath = path.join(process.cwd(), 'public', 'videos', video.id, 'video.mp4');
    
    if (fs.existsSync(videoPath)) {
      // Copy to temp file to avoid copyFileSync source-is-dest error inside processVideoToHLS
      const tempPath = path.join(process.cwd(), 'public', 'videos', video.id, 'temp_raw.mp4');
      fs.copyFileSync(videoPath, tempPath);
      
      try {
        await processVideoToHLS(video.id, tempPath);
        console.log(`Successfully processed ${video.id} to HLS`);
      } catch (err) {
        console.error(`Failed to process ${video.id}:`, err);
      }
    } else {
      console.log(`Skipping ${video.id}: MP4 file not found at ${videoPath}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Done processing all videos');
  });

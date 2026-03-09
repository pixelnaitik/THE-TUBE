import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processVideoToHLS } from '@/lib/videoProcessor';
import path from 'path';
import fs from 'fs';

export async function GET() {
  const videos = await prisma.video.findMany({
    where: { hlsUrl: { endsWith: '.mp4' } }
  });

  for (const video of videos) {
    const videoPath = path.join(process.cwd(), 'public', 'videos', video.id, 'video.mp4');
    if (fs.existsSync(videoPath)) {
      const tempPath = path.join(process.cwd(), 'public', 'videos', video.id, 'temp_raw.mp4');
      fs.copyFileSync(videoPath, tempPath);
      processVideoToHLS(video.id, tempPath).catch(console.error);
    }
  }

  return NextResponse.json({ message: `Re-processing ${videos.length} videos asynchronously.` });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processVideoToHLS } from '@/lib/videoProcessor';
import fs from 'fs';
import path from 'path';

// POST /api/reprocess — re-process any stuck PROCESSING or FAILED videos
export async function POST(req: NextRequest) {
  try {
    const stuckVideos = await prisma.video.findMany({
      where: { status: { in: ['PROCESSING', 'FAILED'] } }
    });

    if (stuckVideos.length === 0) {
      return NextResponse.json({ message: 'No stuck videos found' });
    }

    const results: { id: string; result: string }[] = [];

    for (const video of stuckVideos) {
      const rawFilePath = path.join(process.cwd(), 'public', 'raw-uploads', `${video.id}.mp4`);

      if (!fs.existsSync(rawFilePath)) {
        // No raw file exists, just mark as READY with whatever we have
        const fallbackMp4 = path.join(process.cwd(), 'public', 'videos', video.id, 'video.mp4');
        if (fs.existsSync(fallbackMp4)) {
          await prisma.video.update({
            where: { id: video.id },
            data: { status: 'READY', hlsUrl: `/videos/${video.id}/video.mp4` }
          });
          results.push({ id: video.id, result: 'Marked READY with existing MP4' });
        } else {
          results.push({ id: video.id, result: 'No raw file or MP4 found — cannot recover' });
        }
      } else {
        // Re-trigger processing
        processVideoToHLS(video.id, rawFilePath).catch(console.error);
        results.push({ id: video.id, result: 'Re-processing triggered' });
      }
    }

    return NextResponse.json({ message: 'Reprocessing started', results });
  } catch (error) {
    console.error('Reprocess error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

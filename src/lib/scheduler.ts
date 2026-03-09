import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { processVideoToHLS } from '@/lib/videoProcessor';

let running = false;

export async function publishDueScheduledVideos() {
  if (running) return;
  running = true;

  try {
    const due = await prisma.video.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: { lte: new Date() },
      },
      select: { id: true },
      take: 10,
    });

    for (const video of due) {
      const rawFilePath = path.join(process.cwd(), 'public', 'raw-uploads', `${video.id}.mp4`);
      if (!fs.existsSync(rawFilePath)) {
        await prisma.video.update({
          where: { id: video.id },
          data: { status: 'FAILED' },
        });
        continue;
      }

      await prisma.video.update({
        where: { id: video.id },
        data: { status: 'PROCESSING' },
      });

      processVideoToHLS(video.id, rawFilePath).catch(async () => {
        await prisma.video.update({ where: { id: video.id }, data: { status: 'FAILED' } });
      });
    }
  } finally {
    running = false;
  }
}

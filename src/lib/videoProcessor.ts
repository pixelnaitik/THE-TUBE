import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/lib/prisma';

export async function processVideoToHLS(videoId: string, rawFilePath: string) {
  // First, try to copy raw file to public/videos as a fallback
  const publicVideoDir = path.join(process.cwd(), 'public', 'videos', videoId);
  if (!fs.existsSync(publicVideoDir)) {
    fs.mkdirSync(publicVideoDir, { recursive: true });
  }
  const fallbackPath = path.join(publicVideoDir, 'video.mp4');
  fs.copyFileSync(rawFilePath, fallbackPath);

  return new Promise<void>((resolve, reject) => {
    const outputDir = publicVideoDir;
    const outputFileName = 'master.m3u8';
    const outputPath = path.join(outputDir, outputFileName);
    const relativeHlsUrl = `/videos/${videoId}/${outputFileName}`;

    console.log(`Starting HLS processing for Video ID: ${videoId}`);

    ffmpeg(rawFilePath)
      .outputOptions([
        '-profile:v baseline',
        '-level 3.0',
        '-s 1280x720',
        '-start_number 0',
        '-hls_time 10',
        '-hls_list_size 0',
        '-f hls'
      ])
      .output(outputPath)
      .on('end', async () => {
        console.log(`Finished HLS processing for Video ID: ${videoId}`);
        try {
          await prisma.video.update({
            where: { id: videoId },
            data: { status: 'READY', hlsUrl: relativeHlsUrl }
          });
          // Clean up raw file
          try { fs.unlinkSync(rawFilePath); } catch {}
          resolve();
        } catch (dbError) {
          console.error('Error updating DB after FFmpeg processing:', dbError);
          reject(dbError);
        }
      })
      .on('error', async (err) => {
        console.error(`FFmpeg failed for video ${videoId}: ${err.message}`);
        console.log(`Falling back to raw MP4 for video ${videoId}`);
        
        // Fallback: serve the raw MP4 directly instead of HLS
        try {
          await prisma.video.update({
            where: { id: videoId },
            data: {
              status: 'READY',
              hlsUrl: `/videos/${videoId}/video.mp4`
            }
          });
          // Clean up raw file (we already copied it)
          try { fs.unlinkSync(rawFilePath); } catch {}
          resolve(); // Resolve instead of reject — video is still playable
        } catch (dbError) {
          console.error('Fallback DB update also failed:', dbError);
          await prisma.video.update({
            where: { id: videoId },
            data: { status: 'FAILED' }
          }).catch(console.error);
          reject(dbError);
        }
      })
      .run();
  });
}

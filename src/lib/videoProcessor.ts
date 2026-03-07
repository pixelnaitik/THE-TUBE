import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/lib/prisma';

// Generate a thumbnail from video at the 1-second mark
function generateThumbnail(rawFilePath: string, videoId: string): Promise<string | null> {
  const thumbDir = path.join(process.cwd(), 'public', 'thumbnails');
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

  const thumbFilename = `${videoId}.jpg`;
  
  return new Promise((resolve) => {
    ffmpeg(rawFilePath)
      .screenshots({
        count: 1,
        folder: thumbDir,
        filename: thumbFilename,
        timemarks: ['1'],
        size: '640x360'
      })
      .on('end', () => resolve(`/thumbnails/${thumbFilename}`))
      .on('error', () => resolve(null)); // Thumbnail failed? Continue without it
  });
}

export async function processVideoToHLS(videoId: string, rawFilePath: string) {
  // First, try to copy raw file to public/videos as a fallback
  const publicVideoDir = path.join(process.cwd(), 'public', 'videos', videoId);
  if (!fs.existsSync(publicVideoDir)) {
    fs.mkdirSync(publicVideoDir, { recursive: true });
  }
  const fallbackPath = path.join(publicVideoDir, 'video.mp4');
  fs.copyFileSync(rawFilePath, fallbackPath);

  // Try to generate a thumbnail
  const thumbnailUrl = await generateThumbnail(rawFilePath, videoId);
  if (thumbnailUrl) {
    await prisma.video.update({ where: { id: videoId }, data: { thumbnail: thumbnailUrl } });
  }

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
        
        try {
          await prisma.video.update({
            where: { id: videoId },
            data: {
              status: 'READY',
              hlsUrl: `/videos/${videoId}/video.mp4`
            }
          });
          try { fs.unlinkSync(rawFilePath); } catch {}
          resolve();
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

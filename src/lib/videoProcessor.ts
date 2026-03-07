import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/lib/prisma';

// Quality variants for HLS adaptive streaming
const QUALITY_VARIANTS = [
  { name: '360p', width: 640, height: 360, bitrate: '800k', audioBitrate: '96k' },
  { name: '720p', width: 1280, height: 720, bitrate: '2500k', audioBitrate: '128k' },
  { name: '1080p', width: 1920, height: 1080, bitrate: '5000k', audioBitrate: '192k' },
];

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
      .on('error', () => resolve(null));
  });
}

// Get video duration using ffprobe
function getVideoDuration(filePath: string): Promise<number | null> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err || !metadata?.format?.duration) return resolve(null);
      resolve(Math.floor(metadata.format.duration));
    });
  });
}

// Transcode a single quality variant
function transcodeVariant(
  rawFilePath: string,
  outputDir: string,
  variant: typeof QUALITY_VARIANTS[0]
): Promise<string> {
  const variantDir = path.join(outputDir, variant.name);
  if (!fs.existsSync(variantDir)) fs.mkdirSync(variantDir, { recursive: true });

  const playlistName = `${variant.name}.m3u8`;
  const outputPath = path.join(variantDir, playlistName);

  return new Promise((resolve, reject) => {
    ffmpeg(rawFilePath)
      .outputOptions([
        `-vf scale=${variant.width}:${variant.height}:force_original_aspect_ratio=decrease,pad=${variant.width}:${variant.height}:(ow-iw)/2:(oh-ih)/2`,
        `-b:v ${variant.bitrate}`,
        `-maxrate ${variant.bitrate}`,
        `-bufsize ${parseInt(variant.bitrate) * 2}k`,
        `-b:a ${variant.audioBitrate}`,
        '-profile:v main',
        '-level 4.0',
        '-start_number 0',
        '-hls_time 6',
        '-hls_list_size 0',
        '-hls_segment_filename', path.join(variantDir, 'segment_%03d.ts'),
        '-f hls'
      ])
      .output(outputPath)
      .on('end', () => resolve(playlistName))
      .on('error', (err) => reject(err))
      .run();
  });
}

// Generate the master HLS playlist pointing to all variants
function writeMasterPlaylist(outputDir: string, variants: typeof QUALITY_VARIANTS) {
  let content = '#EXTM3U\n#EXT-X-VERSION:3\n';

  for (const v of variants) {
    const bandwidth = parseInt(v.bitrate) * 1000;
    content += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${v.width}x${v.height},NAME="${v.name}"\n`;
    content += `${v.name}/${v.name}.m3u8\n`;
  }

  fs.writeFileSync(path.join(outputDir, 'master.m3u8'), content);
}

export async function processVideoToHLS(videoId: string, rawFilePath: string) {
  const publicVideoDir = path.join(process.cwd(), 'public', 'videos', videoId);
  if (!fs.existsSync(publicVideoDir)) fs.mkdirSync(publicVideoDir, { recursive: true });

  // Copy raw file as fallback
  const fallbackPath = path.join(publicVideoDir, 'video.mp4');
  fs.copyFileSync(rawFilePath, fallbackPath);

  // Try to get duration
  const duration = await getVideoDuration(rawFilePath);
  if (duration) {
    await prisma.video.update({ where: { id: videoId }, data: { duration } });
  }

  // Try to generate thumbnail
  const thumbnailUrl = await generateThumbnail(rawFilePath, videoId);
  if (thumbnailUrl) {
    await prisma.video.update({ where: { id: videoId }, data: { thumbnail: thumbnailUrl } });
  }

  // Try multi-quality HLS transcoding
  console.log(`Starting multi-quality HLS processing for Video ID: ${videoId}`);

  try {
    // Transcode all quality variants
    const successfulVariants: typeof QUALITY_VARIANTS = [];

    for (const variant of QUALITY_VARIANTS) {
      try {
        console.log(`  Transcoding ${variant.name} for ${videoId}...`);
        await transcodeVariant(rawFilePath, publicVideoDir, variant);
        successfulVariants.push(variant);
        console.log(`  ✓ ${variant.name} complete`);
      } catch (err) {
        console.error(`  ✗ ${variant.name} failed:`, err);
        // Continue with other variants
      }
    }

    if (successfulVariants.length > 0) {
      // Write master playlist
      writeMasterPlaylist(publicVideoDir, successfulVariants);

      await prisma.video.update({
        where: { id: videoId },
        data: { status: 'READY', hlsUrl: `/videos/${videoId}/master.m3u8` }
      });

      // Clean up raw file
      try { fs.unlinkSync(rawFilePath); } catch {}
      console.log(`✓ Multi-quality HLS complete for ${videoId} (${successfulVariants.map(v => v.name).join(', ')})`);
    } else {
      throw new Error('All quality variants failed');
    }
  } catch (err) {
    console.error(`FFmpeg failed for video ${videoId}:`, err);
    console.log(`Falling back to raw MP4 for video ${videoId}`);

    // Fallback: serve the raw MP4 directly
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'READY', hlsUrl: `/videos/${videoId}/video.mp4` }
    });
    try { fs.unlinkSync(rawFilePath); } catch {}
  }
}

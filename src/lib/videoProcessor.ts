import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/lib/prisma';
import { getSourceVideoInfo, isFfmpegAvailable } from '@/lib/ffmpeg';

const QUALITY_VARIANTS = [
  { name: '360p', width: 640, height: 360, bitrate: '800k', audioBitrate: '96k' },
  { name: '720p', width: 1280, height: 720, bitrate: '2500k', audioBitrate: '128k' },
  { name: '1080p', width: 1920, height: 1080, bitrate: '5000k', audioBitrate: '192k' },
];

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
        '-hls_segment_filename', path.join(variantDir, 'segment_%03d.ts').replace(/\\/g, '/'),
        '-f hls'
      ])
      .output(outputPath.replace(/\\/g, '/'))
      .on('end', () => resolve(playlistName))
      .on('error', (err) => reject(err))
      .run();
  });
}

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

  const fallbackPath = path.join(publicVideoDir, 'video.mp4');
  fs.copyFileSync(rawFilePath, fallbackPath);

  const ffmpegReady = await isFfmpegAvailable();
  if (!ffmpegReady) {
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'READY', hlsUrl: `/videos/${videoId}/video.mp4` }
    });
    try { fs.unlinkSync(rawFilePath); } catch {}
    return;
  }

  const sourceInfo = await getSourceVideoInfo(rawFilePath);
  if (sourceInfo?.duration) {
    await prisma.video.update({ where: { id: videoId }, data: { duration: sourceInfo.duration } });
  }

  const existingThumb = await prisma.video.findUnique({ where: { id: videoId }, select: { thumbnail: true } });
  if (!existingThumb?.thumbnail) {
    const thumbnailUrl = await generateThumbnail(rawFilePath, videoId);
    if (thumbnailUrl) {
      await prisma.video.update({ where: { id: videoId }, data: { thumbnail: thumbnailUrl } });
    }
  }

  const maxHeight = sourceInfo?.height || 1080;
  const candidateVariants = QUALITY_VARIANTS.filter(v => v.height <= maxHeight);
  const variantsToTry = candidateVariants.length > 0 ? candidateVariants : [QUALITY_VARIANTS[0]];

  try {
    const successfulVariants: typeof QUALITY_VARIANTS = [];

    for (const variant of variantsToTry) {
      try {
        await transcodeVariant(rawFilePath, publicVideoDir, variant);
        successfulVariants.push(variant);
      } catch {
        // Continue with next variant
      }
    }

    if (successfulVariants.length > 0) {
      writeMasterPlaylist(publicVideoDir, successfulVariants);

      await prisma.video.update({
        where: { id: videoId },
        data: { status: 'READY', hlsUrl: `/videos/${videoId}/master.m3u8` }
      });

      try { fs.unlinkSync(rawFilePath); } catch {}
    } else {
      throw new Error('All quality variants failed');
    }
  } catch {
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'READY', hlsUrl: `/videos/${videoId}/video.mp4` }
    });
    try { fs.unlinkSync(rawFilePath); } catch {}
  }
}

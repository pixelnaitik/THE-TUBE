import { NextResponse } from 'next/server';
import { isFfmpegAvailable } from '@/lib/ffmpeg';

export async function GET() {
  const ffmpeg = await isFfmpegAvailable();

  return NextResponse.json({
    ffmpeg,
    adaptiveStreaming: ffmpeg,
    maxUploadMb: 500,
    qualities: ffmpeg ? ['Auto', '360p', '720p', '1080p'] : ['Single source (MP4 fallback)'],
  });
}

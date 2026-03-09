import ffmpeg from 'fluent-ffmpeg';

let cachedAvailable: boolean | null = null;

export async function isFfmpegAvailable(): Promise<boolean> {
  if (cachedAvailable !== null) return cachedAvailable;

  cachedAvailable = await new Promise<boolean>((resolve) => {
    ffmpeg.getAvailableFormats((err, formats) => {
      if (err || !formats || Object.keys(formats).length === 0) {
        resolve(false);
        return;
      }
      resolve(true);
    });
  });

  return cachedAvailable;
}

export interface SourceVideoInfo {
  width: number;
  height: number;
  duration: number;
}

export async function getSourceVideoInfo(filePath: string): Promise<SourceVideoInfo | null> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return resolve(null);
      const videoStream = metadata.streams?.find((s) => s.codec_type === 'video');
      const width = videoStream?.width || 0;
      const height = videoStream?.height || 0;
      const duration = Math.floor(metadata.format?.duration || 0);
      if (!width || !height) return resolve(null);
      resolve({ width, height, duration });
    });
  });
}

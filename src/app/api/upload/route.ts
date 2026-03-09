import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { processVideoToHLS } from '@/lib/videoProcessor';
import { z } from 'zod';

const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024;
const MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/mkv'
]);
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const uploadMetaSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(5000).optional(),
  tags: z.string().max(500).optional(),
  publishMode: z.enum(['now', 'draft', 'schedule']).default('now'),
  scheduledFor: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = (formData.get('video') || formData.get('file')) as File | null;
    const thumbnail = formData.get('thumbnail') as File | null;
    const rawTitle = (formData.get('title') as string) || '';
    const rawDescription = (formData.get('description') as string) || '';
    const rawTags = (formData.get('tags') as string) || '';
    const rawPublishMode = (formData.get('publishMode') as string) || 'now';
    const rawScheduledFor = (formData.get('scheduledFor') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'File and title are required' }, { status: 400 });
    }

    const isMkvExt = file.name.toLowerCase().endsWith('.mkv');
    if (!ALLOWED_VIDEO_MIME_TYPES.has(file.type) && !isMkvExt) {
      return NextResponse.json({ error: `Unsupported file type (${file.type || 'unknown'})` }, { status: 400 });
    }
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      return NextResponse.json({ error: `File exceeds ${MAX_VIDEO_SIZE_BYTES / (1024 * 1024)}MB limit` }, { status: 400 });
    }

    if (thumbnail && thumbnail.size > 0) {
      if (!ALLOWED_IMAGE_MIME_TYPES.has(thumbnail.type)) {
        return NextResponse.json({ error: 'Unsupported thumbnail type (use JPG/PNG/WebP)' }, { status: 400 });
      }
      if (thumbnail.size > MAX_THUMBNAIL_SIZE_BYTES) {
        return NextResponse.json({ error: 'Thumbnail too large (max 5MB)' }, { status: 400 });
      }
    }

    const parsedMeta = uploadMetaSchema.safeParse({
      title: rawTitle,
      description: rawDescription || undefined,
      tags: rawTags || undefined,
      publishMode: rawPublishMode,
      scheduledFor: rawScheduledFor || undefined,
    });
    if (!parsedMeta.success) {
      return NextResponse.json({ error: parsedMeta.error.issues[0]?.message || 'Invalid metadata' }, { status: 400 });
    }

    const { title, description, tags, publishMode, scheduledFor } = parsedMeta.data;

    let parsedScheduledFor: Date | null = null;
    if (publishMode === 'schedule') {
      if (!scheduledFor) {
        return NextResponse.json({ error: 'Schedule date/time required' }, { status: 400 });
      }
      parsedScheduledFor = new Date(scheduledFor);
      if (Number.isNaN(parsedScheduledFor.getTime()) || parsedScheduledFor <= new Date()) {
        return NextResponse.json({ error: 'Schedule date/time must be in the future' }, { status: 400 });
      }
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const initialStatus = publishMode === 'draft' ? 'DRAFT' : publishMode === 'schedule' ? 'SCHEDULED' : 'PROCESSING';

    const newVideo = await prisma.video.create({
      data: {
        title,
        description: description || null,
        tags: tags || null,
        status: initialStatus,
        scheduledFor: parsedScheduledFor,
        authorId: user.id,
      }
    });

    const rawUploadsDir = path.join(process.cwd(), 'public', 'raw-uploads');
    if (!fs.existsSync(rawUploadsDir)) fs.mkdirSync(rawUploadsDir, { recursive: true });

    const rawFilePath = path.join(rawUploadsDir, `${newVideo.id}.mp4`);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(rawFilePath, buffer);

    if (thumbnail && thumbnail.size > 0) {
      const thumbDir = path.join(process.cwd(), 'public', 'thumbnails');
      if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });
      const ext = thumbnail.type === 'image/png' ? 'png' : thumbnail.type === 'image/webp' ? 'webp' : 'jpg';
      const thumbFile = `${newVideo.id}_custom.${ext}`;
      const thumbPath = path.join(thumbDir, thumbFile);
      fs.writeFileSync(thumbPath, Buffer.from(await thumbnail.arrayBuffer()));
      await prisma.video.update({ where: { id: newVideo.id }, data: { thumbnail: `/thumbnails/${thumbFile}` } });
    }

    if (publishMode === 'now') {
      processVideoToHLS(newVideo.id, rawFilePath).catch(async (err) => {
        console.error('FFmpeg background job failed:', err);
        await prisma.video.update({ where: { id: newVideo.id }, data: { status: 'FAILED' } });
      });

      const subscribers = await prisma.subscription.findMany({
        where: { channelId: user.id }
      });

      if (subscribers.length > 0) {
        await prisma.notification.createMany({
          data: subscribers.map(sub => ({
            userId: sub.subscriberId,
            type: 'NEW_VIDEO',
            message: `${user.name || 'A channel you follow'} uploaded: ${title}`,
            link: `/watch/${newVideo.id}`
          }))
        });
      }
    }

    return NextResponse.json({
      message: publishMode === 'now'
        ? 'Upload successful, processing started'
        : publishMode === 'draft'
          ? 'Draft saved successfully'
          : 'Video scheduled successfully',
      videoId: newVideo.id,
      status: initialStatus,
      scheduledFor: parsedScheduledFor,
    }, { status: 200 });

  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

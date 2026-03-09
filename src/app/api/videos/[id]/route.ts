import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { videoUpdateSchema } from '@/lib/validation';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await prisma.video.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true } } },
  });

  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

  return NextResponse.json({
    id: video.id,
    title: video.title,
    status: video.status,
    scheduledFor: video.scheduledFor,
    hlsUrl: video.hlsUrl,
    thumbnail: video.thumbnail,
    createdAt: video.createdAt,
    author: video.author,
  });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  if (video.authorId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const videoDir = path.join(process.cwd(), 'public', 'videos', id);
  if (fs.existsSync(videoDir)) fs.rmSync(videoDir, { recursive: true, force: true });
  const rawPath = path.join(process.cwd(), 'public', 'raw-uploads', `${id}.mp4`);
  if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);

  const thumbDir = path.join(process.cwd(), 'public', 'thumbnails');
  if (fs.existsSync(thumbDir)) {
    for (const f of fs.readdirSync(thumbDir)) {
      if (f.startsWith(id)) {
        try { fs.unlinkSync(path.join(thumbDir, f)); } catch {}
      }
    }
  }

  await prisma.video.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  if (video.authorId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = videoUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid video metadata' }, { status: 400 });
  }
  const { title, description, tags } = parsed.data;
  const updated = await prisma.video.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(tags !== undefined && { tags }),
    }
  });

  return NextResponse.json(updated);
}

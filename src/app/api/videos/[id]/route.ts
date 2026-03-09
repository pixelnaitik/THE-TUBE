import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { videoUpdateSchema } from '@/lib/validation';

// DELETE /api/videos/[id] — Delete a video (only by author)
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  if (video.authorId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Delete video files
  const videoDir = path.join(process.cwd(), 'public', 'videos', id);
  if (fs.existsSync(videoDir)) fs.rmSync(videoDir, { recursive: true, force: true });
  const thumbPath = path.join(process.cwd(), 'public', 'thumbnails', `${id}.jpg`);
  if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);

  await prisma.video.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// PATCH /api/videos/[id] — Edit video title/description/tags
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

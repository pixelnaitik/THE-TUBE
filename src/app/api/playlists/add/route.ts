import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { playlistId, videoId } = await req.json();

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: { _count: { select: { videos: true } } }
  });

  if (!playlist) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });

  // Verify ownership
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || playlist.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Check if video is already in playlist
  const existing = await prisma.playlistVideo.findUnique({
    where: { playlistId_videoId: { playlistId, videoId } }
  });

  if (existing) {
    // Remove it
    await prisma.playlistVideo.delete({ where: { id: existing.id } });
    return NextResponse.json({ added: false });
  }

  // Add it
  await prisma.playlistVideo.create({
    data: {
      playlistId,
      videoId,
      order: playlist._count.videos
    }
  });

  return NextResponse.json({ added: true });
}

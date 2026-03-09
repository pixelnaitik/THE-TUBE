import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

// GET all playlists for logged in user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const playlists = await prisma.playlist.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { videos: true } },
      videos: { take: 1, orderBy: { addedAt: 'desc' }, include: { video: { select: { thumbnail: true, id: true } } } }
    }
  });

  return NextResponse.json(playlists);
}

// POST create a new playlist
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const playlist = await prisma.playlist.create({
    data: {
      name: name.trim(),
      userId: user.id
    }
  });

  return NextResponse.json(playlist, { status: 201 });
}

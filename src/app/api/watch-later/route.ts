import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { videoId } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const existing = await prisma.watchLater.findUnique({
    where: { userId_videoId: { userId: user.id, videoId } }
  });

  if (existing) {
    await prisma.watchLater.delete({ where: { id: existing.id } });
    return NextResponse.json({ watchLater: false });
  }

  await prisma.watchLater.create({ data: { userId: user.id, videoId } });
  return NextResponse.json({ watchLater: true });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ watchLaterList: [] });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ watchLaterList: [] });

  const list = await prisma.watchLater.findMany({
    where: { userId: user.id },
    select: { videoId: true }
  });

  return NextResponse.json({ watchLaterList: list.map(l => l.videoId) });
}

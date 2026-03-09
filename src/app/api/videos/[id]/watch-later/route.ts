import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ saved: false });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ saved: false });

  const { id: videoId } = await params;
  const item = await prisma.watchLater.findUnique({ where: { userId_videoId: { userId: user.id, videoId } } });
  return NextResponse.json({ saved: !!item });
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { id: videoId } = await params;
  const existing = await prisma.watchLater.findUnique({ where: { userId_videoId: { userId: user.id, videoId } } });

  if (existing) {
    await prisma.watchLater.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  }

  await prisma.watchLater.create({ data: { userId: user.id, videoId } });
  return NextResponse.json({ saved: true });
}

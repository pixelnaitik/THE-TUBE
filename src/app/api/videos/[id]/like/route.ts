import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

// POST /api/videos/[id]/like — Toggle like/dislike
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { id: videoId } = await params;
  const { type } = await req.json(); // "LIKE" or "DISLIKE"
  
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Check existing reaction
  const existing = await prisma.like.findUnique({
    where: { videoId_userId: { videoId, userId: user.id } }
  });

  if (existing) {
    if (existing.type === type) {
      // Same button clicked again → remove reaction
      await prisma.like.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: 'removed' });
    } else {
      // Switch reaction
      await prisma.like.update({ where: { id: existing.id }, data: { type } });
      return NextResponse.json({ action: 'switched', type });
    }
  }

  // New reaction
  await prisma.like.create({ data: { type, videoId, userId: user.id } });
  return NextResponse.json({ action: 'added', type });
}

// GET /api/videos/[id]/like — Get like counts + user's reaction
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: videoId } = await params;
  const session = await getServerSession(authOptions);

  const [likes, dislikes] = await Promise.all([
    prisma.like.count({ where: { videoId, type: 'LIKE' } }),
    prisma.like.count({ where: { videoId, type: 'DISLIKE' } }),
  ]);

  let userReaction: string | null = null;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user) {
      const existing = await prisma.like.findUnique({
        where: { videoId_userId: { videoId, userId: user.id } }
      });
      userReaction = existing?.type || null;
    }
  }

  return NextResponse.json({ likes, dislikes, userReaction });
}

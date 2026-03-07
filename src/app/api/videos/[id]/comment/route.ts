import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

// POST /api/videos/[id]/comment — Add a comment
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: videoId } = await params;
  const { text } = await req.json();

  if (!text?.trim()) return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { text: text.trim(), videoId, userId: user.id },
    include: { user: { select: { id: true, name: true, image: true } } }
  });

  return NextResponse.json(comment, { status: 201 });
}

// GET /api/videos/[id]/comment — Get all comments for a video
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: videoId } = await params;

  const comments = await prisma.comment.findMany({
    where: { videoId },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(comments);
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { commentSchema } from '@/lib/validation';

// POST /api/videos/[id]/comment — Add a comment (with optional parentId for replies)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: videoId } = await params;
  const parsed = commentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid comment' }, { status: 400 });
  }
  const { text, parentId } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const comment = await prisma.comment.create({
    data: {
      text,
      videoId,
      userId: user.id,
      ...(parentId && { parentId }),
    },
    include: { user: { select: { id: true, name: true, image: true } } }
  });

  // Send notification to video author
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (video && video.authorId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: video.authorId,
        type: 'NEW_COMMENT',
        message: `${user.name || 'Someone'} commented on your video: "${text.slice(0, 50)}"`,
        link: `/watch/${videoId}`
      }
    });
  }

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

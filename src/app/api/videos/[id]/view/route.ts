import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { viewSchema } from '@/lib/validation';

// POST /api/videos/[id]/view — Increment view + save to history
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: videoId } = await params;
  const parsedBody = viewSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsedBody.success) {
    return NextResponse.json({ error: parsedBody.error.issues[0]?.message || 'Invalid payload' }, { status: 400 });
  }

  // Increment view count
  await prisma.video.update({
    where: { id: videoId },
    data: { views: { increment: 1 } }
  });

  // Save to watch history if user is logged in
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user) {
      await prisma.watchHistory.upsert({
        where: { userId_videoId: { userId: user.id, videoId } },
        update: { watchedAt: new Date() },
        create: { userId: user.id, videoId }
      });

      const { positionSeconds, durationSeconds } = parsedBody.data;
      if (positionSeconds !== undefined && durationSeconds !== undefined) {
        await prisma.videoProgress.upsert({
          where: { userId_videoId: { userId: user.id, videoId } },
          update: { positionSeconds, durationSeconds },
          create: { userId: user.id, videoId, positionSeconds, durationSeconds },
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}

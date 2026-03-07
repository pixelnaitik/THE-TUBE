import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/videos/[id]/view — Increment view count
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: videoId } = await params;

  await prisma.video.update({
    where: { id: videoId },
    data: { views: { increment: 1 } }
  });

  return NextResponse.json({ success: true });
}

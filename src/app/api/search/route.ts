import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/search?q=query — Search videos by title
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');

  if (!query?.trim()) {
    return NextResponse.json([]);
  }

  const videos = await prisma.video.findMany({
    where: {
      status: 'READY',
      title: { contains: query.trim() }
    },
    include: { author: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  return NextResponse.json(videos);
}

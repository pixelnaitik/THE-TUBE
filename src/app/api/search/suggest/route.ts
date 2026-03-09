import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publishDueScheduledVideos } from '@/lib/scheduler';

export async function GET(req: NextRequest) {
  await publishDueScheduledVideos();

  const query = req.nextUrl.searchParams.get('q')?.trim() || '';

  const trendingSource = await prisma.video.findMany({
    where: { status: 'READY' },
    select: { title: true, tags: true, views: true },
    orderBy: { views: 'desc' },
    take: 80,
  });

  const tagCount = new Map<string, number>();
  for (const v of trendingSource) {
    const tags = (v.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    for (const t of tags) tagCount.set(t, (tagCount.get(t) || 0) + 1);
  }

  const trendingTags = Array.from(tagCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag]) => tag);

  if (!query) {
    return NextResponse.json({ suggestions: [], trendingTags });
  }

  const matches = await prisma.video.findMany({
    where: {
      status: 'READY',
      OR: [
        { title: { contains: query } },
        { tags: { contains: query } },
      ],
    },
    select: { title: true, tags: true },
    take: 20,
  });

  const q = query.toLowerCase();
  const suggestionSet = new Set<string>();

  for (const m of matches) {
    if (m.title.toLowerCase().includes(q)) suggestionSet.add(m.title);
    for (const t of (m.tags || '').split(',').map(v => v.trim()).filter(Boolean)) {
      if (t.toLowerCase().includes(q)) suggestionSet.add(t);
    }
  }

  const suggestions = Array.from(suggestionSet).slice(0, 8);

  return NextResponse.json({ suggestions, trendingTags });
}

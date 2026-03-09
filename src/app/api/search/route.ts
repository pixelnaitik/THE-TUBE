import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publishDueScheduledVideos } from '@/lib/scheduler';

function rankVideo(query: string, title: string, tags?: string | null, description?: string | null, views = 0) {
  const q = query.toLowerCase();
  const t = title.toLowerCase();
  const tagText = (tags || '').toLowerCase();
  const desc = (description || '').toLowerCase();

  let score = 0;
  if (t === q) score += 150;
  if (t.startsWith(q)) score += 80;
  if (t.includes(q)) score += 45;
  if (tagText.includes(q)) score += 30;
  if (desc.includes(q)) score += 15;
  score += Math.min(Math.floor(views / 1000), 25);
  return score;
}

export async function GET(req: NextRequest) {
  await publishDueScheduledVideos();

  const query = req.nextUrl.searchParams.get('q')?.trim() || '';
  if (!query) return NextResponse.json([]);

  const candidateVideos = await prisma.video.findMany({
    where: {
      status: 'READY',
      OR: [
        { title: { contains: query } },
        { tags: { contains: query } },
        { description: { contains: query } },
      ],
    },
    include: { author: true },
    orderBy: [{ views: 'desc' }, { createdAt: 'desc' }],
    take: 80,
  });

  const videos = candidateVideos
    .map(v => ({
      ...v,
      _score: rankVideo(query, v.title, v.tags, v.description, v.views),
    }))
    .sort((a, b) => b._score - a._score || b.views - a.views)
    .slice(0, 24)
    .map(v => ({
      id: v.id,
      title: v.title,
      description: v.description,
      thumbnail: v.thumbnail,
      hlsUrl: v.hlsUrl,
      status: v.status,
      duration: v.duration,
      views: v.views,
      tags: v.tags,
      authorId: v.authorId,
      createdAt: v.createdAt,
      author: v.author,
      scheduledFor: v.scheduledFor,
    }));

  return NextResponse.json(videos);
}


import { publishDueScheduledVideos } from '@/lib/scheduler';
import VideoCard from '@/components/VideoCard';
import { prisma } from '@/lib/prisma';
import HomeFilters from '@/components/HomeFilters';
import EmptyState from '@/components/EmptyState';
import { Video } from 'lucide-react';

interface HomeProps {
  searchParams: Promise<{ sort?: string; tag?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  await publishDueScheduledVideos();

  const params = await searchParams;
  const sort = params.sort || 'newest';
  const tag = params.tag;

  const orderBy = sort === 'views' ? { views: 'desc' as const }
    : sort === 'oldest' ? { createdAt: 'asc' as const }
    : { createdAt: 'desc' as const };

  const videos = await prisma.video.findMany({
    where: {
      status: 'READY',
      ...(tag && tag !== 'All' ? { tags: { contains: tag } } : {}),
    },
    include: { author: true },
    orderBy,
  });

  const trendingTagCounts = new Map<string, number>();
  for (const v of videos.slice(0, 80)) {
    const tags = (v.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    for (const t of tags) trendingTagCounts.set(t, (trendingTagCounts.get(t) || 0) + 1);
  }
  const dynamicTags = ['All', ...Array.from(trendingTagCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t)];

  const timeAgo = (date: Date) => {
    const s = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)} minutes ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
    if (s < 2592000) return `${Math.floor(s / 86400)} days ago`;
    return `${Math.floor(s / 2592000)} months ago`;
  };

  return (
    <>
      <HomeFilters currentSort={sort} currentTag={tag || 'All'} tags={dynamicTags} />

      {videos.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map(video => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.title}
              thumbnail={video.thumbnail || `https://picsum.photos/seed/${video.id}/640/360`}
              channelName={video.author.name || 'Creator'}
              channelAvatar={video.author.image || ''}
              views={`${video.views} views`}
              timestamp={timeAgo(video.createdAt)}
              duration={video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : '0:00'}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={Video}
            title="No videos yet"
            description="Your feed is empty right now. Upload your first video to start building your library."
            ctaHref="/upload"
            ctaLabel="Upload your first video"
          />
        </div>
      )}
    </>
  );
}

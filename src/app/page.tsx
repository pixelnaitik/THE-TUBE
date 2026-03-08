import VideoCard from '@/components/VideoCard';
import { prisma } from '@/lib/prisma';
import HomeFilters from '@/components/HomeFilters';

interface HomeProps {
  searchParams: Promise<{ sort?: string; tag?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
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

  const timeAgo = (date: Date) => {
    const s = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)} minutes ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
    if (s < 2592000) return `${Math.floor(s / 86400)} days ago`;
    return `${Math.floor(s / 2592000)} months ago`;
  };

  return (
    <>
      <HomeFilters currentSort={sort} currentTag={tag || 'All'} />

      {videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
          {videos.map(video => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.title}
              thumbnail={video.thumbnail || `https://picsum.photos/seed/${video.id}/640/360`}
              channelName={video.author.name || 'Creator'}
              channelAvatar={video.author.image || `https://api.dicebear.com/7.x/initials/svg?seed=${video.author.name}`}
              views={`${video.views} views`}
              timestamp={timeAgo(video.createdAt)}
              duration={video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : '0:00'}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No videos available yet.</p>
          <p className="text-gray-500 text-sm mt-1">Sign in and upload a video to see it here!</p>
        </div>
      )}
    </>
  );
}

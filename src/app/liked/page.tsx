import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
import EmptyState from '@/components/EmptyState';
import { ThumbsUp } from 'lucide-react';

export default async function LikedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect('/login');

  const likes = await prisma.like.findMany({
    where: { userId: user.id, type: 'LIKE' },
    include: { video: { include: { author: true } } },
    orderBy: { id: 'desc' }
  });

  const formatDate = (date: Date) => date.toLocaleDateString();

  return (
    <div>
      <h1 className="page-title mb-5 flex items-center gap-2 text-white">
        <ThumbsUp className="h-6 w-6 text-blue-300" /> Liked Videos
      </h1>
      {likes.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {likes.filter(l => l.video.status === 'READY').map(l => (
            <VideoCard
              key={l.id}
              id={l.video.id}
              title={l.video.title}
              thumbnail={l.video.thumbnail || `https://picsum.photos/seed/${l.video.id}/640/360`}
              channelName={l.video.author.name || 'Creator'}
              channelAvatar={l.video.author.image || ''}
              views={`${l.video.views} views`}
              timestamp={formatDate(l.video.createdAt)}
              duration={l.video.duration ? `${Math.floor(l.video.duration / 60)}:${String(l.video.duration % 60).padStart(2, '0')}` : '0:00'}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ThumbsUp}
          title="No liked videos"
          description="Tap like on any video and it will appear here for easy access later."
          ctaHref="/"
          ctaLabel="Find videos"
        />
      )}
    </div>
  );
}


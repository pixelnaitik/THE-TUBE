import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
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

  const timeAgo = (date: Date) => {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <ThumbsUp className="w-6 h-6" /> Liked Videos
      </h1>
      {likes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {likes.filter(l => l.video.status === 'READY').map(l => (
            <VideoCard
              key={l.id}
              id={l.video.id}
              title={l.video.title}
              thumbnail={l.video.thumbnail || `https://picsum.photos/seed/${l.video.id}/640/360`}
              channelName={l.video.author.name || 'Creator'}
              channelAvatar={l.video.author.image || `https://api.dicebear.com/7.x/initials/svg?seed=${l.video.author.name}`}
              views={`${l.video.views} views`}
              timestamp={timeAgo(l.video.createdAt)}
              duration={l.video.duration ? `${Math.floor(l.video.duration / 60)}:${String(l.video.duration % 60).padStart(2, '0')}` : '0:00'}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-16">No liked videos yet. Like some videos to see them here!</p>
      )}
    </div>
  );
}

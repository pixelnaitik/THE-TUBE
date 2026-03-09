import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
import { Clock } from 'lucide-react';

export default async function WatchLaterPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect('/login');

  const items = await prisma.watchLater.findMany({
    where: { userId: user.id },
    include: { video: { include: { author: true } } },
    orderBy: { addedAt: 'desc' }
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
        <Clock className="w-6 h-6" /> Watch Later
      </h1>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.filter(item => item.video.status === 'READY').map(item => (
            <VideoCard
              key={item.id}
              id={item.video.id}
              title={item.video.title}
              thumbnail={item.video.thumbnail || `https://picsum.photos/seed/${item.video.id}/640/360`}
              channelName={item.video.author.name || 'Creator'}
              channelAvatar={item.video.author.image || `https://api.dicebear.com/7.x/initials/svg?seed=${item.video.author.name}`}
              views={`${item.video.views} views`}
              timestamp={timeAgo(item.video.createdAt)}
              duration={item.video.duration ? `${Math.floor(item.video.duration / 60)}:${String(item.video.duration % 60).padStart(2, '0')}` : '0:00'}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-16">No videos saved to Watch Later yet. Save videos to watch them here!</p>
      )}
    </div>
  );
}

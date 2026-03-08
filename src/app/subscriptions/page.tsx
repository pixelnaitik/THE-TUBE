import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
import { Users } from 'lucide-react';

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect('/login');

  const subscriptions = await prisma.subscription.findMany({
    where: { subscriberId: user.id },
    include: {
      channel: {
        include: {
          videos: {
            where: { status: 'READY' },
            orderBy: { createdAt: 'desc' },
          }
        }
      }
    }
  });

  const allVideos = subscriptions
    .flatMap(sub => sub.channel.videos.map(v => ({ ...v, author: sub.channel })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const timeAgo = (date: Date) => {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Users className="w-6 h-6" /> Subscriptions
      </h1>
      {allVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allVideos.map(video => (
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
        <p className="text-gray-500 text-center py-16">No subscriptions yet. Subscribe to channels to see their videos here!</p>
      )}
    </div>
  );
}

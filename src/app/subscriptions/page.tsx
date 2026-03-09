import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
import EmptyState from '@/components/EmptyState';
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

  const formatDate = (date: Date) => date.toLocaleDateString();

  return (
    <div>
      <h1 className="page-title mb-5 flex items-center gap-2 text-white">
        <Users className="h-6 w-6 text-blue-300" /> Subscriptions
      </h1>
      {allVideos.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allVideos.map(video => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.title}
              thumbnail={video.thumbnail || `https://picsum.photos/seed/${video.id}/640/360`}
              channelName={video.author.name || 'Creator'}
              channelAvatar={video.author.image || `https://api.dicebear.com/7.x/initials/svg?seed=${video.author.name}`}
              views={`${video.views} views`}
              timestamp={formatDate(video.createdAt)}
              duration={video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : '0:00'}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No subscriptions yet"
          description="Subscribe to creators you like and their latest uploads will appear here."
          ctaHref="/"
          ctaLabel="Explore videos"
        />
      )}
    </div>
  );
}
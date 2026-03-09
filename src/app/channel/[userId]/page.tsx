import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
import SubscribeButton from '@/components/SubscribeButton';
import EmptyState from '@/components/EmptyState';
import { Video } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';

interface ChannelPageProps {
  params: Promise<{ userId: string }>;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { userId } = await params;

  const channel = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      videos: { where: { status: 'READY' }, orderBy: { createdAt: 'desc' } },
      subscribers: true,
    }
  });

  if (!channel) return notFound();

  const subscriberCount = channel.subscribers.length;
  const formatDate = (date: Date) => date.toLocaleDateString();

  return (
    <div>
      <div className="mb-5 h-24 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 sm:h-32" />

      <section className="surface-card mb-8 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <UserAvatar src={channel.image} alt={channel.name || 'Creator'} sizeClassName="h-16 w-16 border border-[var(--line)] sm:h-20 sm:w-20" className="shrink-0 bg-[var(--surface-2)]" />
          <div className="min-w-0 flex-1">
            <h1 className="page-title text-white">{channel.name || 'Creator'}</h1>
            <p className="mt-1 text-sm text-muted">
              {subscriberCount} subscriber{subscriberCount !== 1 ? 's' : ''} <span className="mx-1">&middot;</span> {channel.videos.length} video{channel.videos.length !== 1 ? 's' : ''}
            </p>
            <div className="mt-3">
              <SubscribeButton channelId={channel.id} />
            </div>
          </div>
        </div>
      </section>

      <h2 className="section-title mb-4 text-white">Videos</h2>
      {channel.videos.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {channel.videos.map(video => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.title}
              thumbnail={video.thumbnail || `https://picsum.photos/seed/${video.id}/640/360`}
              channelName={channel.name || 'Creator'}
              channelAvatar={channel.image || ''}
              views={`${video.views} views`}
              timestamp={formatDate(video.createdAt)}
              duration={video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : '0:00'}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Video}
          title="No uploads yet"
          description="This channel has not published videos yet. Check back soon."
        />
      )}
    </div>
  );
}


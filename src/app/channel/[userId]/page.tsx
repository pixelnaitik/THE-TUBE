import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
import SubscribeButton from '@/components/SubscribeButton';
import EmptyState from '@/components/EmptyState';
import { UserCircle2, Video } from 'lucide-react';

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
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--line)] bg-[var(--surface-2)] sm:h-20 sm:w-20">
            {channel.image ? (
              <img src={channel.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserCircle2 className="h-14 w-14 text-gray-400" />
            )}
          </div>
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
              channelAvatar={channel.image || `https://api.dicebear.com/7.x/initials/svg?seed=${channel.name}`}
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
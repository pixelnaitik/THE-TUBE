import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
import SubscribeButton from '@/components/SubscribeButton';
import { UserCircle2 } from 'lucide-react';

interface ChannelPageProps {
  params: Promise<{ userId: string }>;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { userId } = await params;

  const channel = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      videos: { where: { status: 'READY' }, orderBy: { createdAt: 'desc' }, },
      subscribers: true,
    }
  });

  if (!channel) return notFound();

  const subscriberCount = channel.subscribers.length;

  const formatDate = (date: Date) => date.toLocaleDateString();

  return (
    <div>
      {/* Channel Banner */}
      <div className="mb-4 h-24 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 sm:mb-6 sm:h-32"></div>

      {/* Channel Info */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#303030] sm:h-20 sm:w-20">
          {channel.image ? (
            <img src={channel.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <UserCircle2 className="w-14 h-14 text-gray-400" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white sm:text-2xl">{channel.name || 'Creator'}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {subscriberCount} subscriber{subscriberCount !== 1 ? 's' : ''} - {channel.videos.length} video{channel.videos.length !== 1 ? 's' : ''}
          </p>
          <div className="mt-3">
            <SubscribeButton channelId={channel.id} />
          </div>
        </div>
      </div>

      {/* Videos */}
      <h2 className="text-lg font-semibold text-white mb-4">Videos</h2>
      {channel.videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        <p className="text-gray-500 text-center py-12">No videos uploaded yet.</p>
      )}
    </div>
  );
}



import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import LikeButtons from '@/components/LikeButtons';
import CommentSection from '@/components/CommentSection';
import ViewCounter from '@/components/ViewCounter';
import VideoActions from '@/components/VideoActions';
import SubscribeButton from '@/components/SubscribeButton';
import Link from 'next/link';
import { UserCircle2 } from 'lucide-react';
import VideoCard from '@/components/VideoCard';

interface WatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { id } = await params;
  const video = await prisma.video.findUnique({
    where: { id },
    include: { author: true }
  });

  if (!video) return notFound();

  // Get recommended videos (same author + random others)
  const recommended = await prisma.video.findMany({
    where: { status: 'READY', id: { not: id } },
    include: { author: true },
    orderBy: { views: 'desc' },
    take: 8
  });

  const subscriberCount = await prisma.subscription.count({ where: { channelId: video.authorId } });

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const timeAgo = (date: Date) => {
    const s = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)} minutes ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
    if (s < 2592000) return `${Math.floor(s / 86400)} days ago`;
    return `${Math.floor(s / 2592000)} months ago`;
  };

  return (
    <>
      <ViewCounter videoId={video.id} />

      <div className="max-w-[1280px] mx-auto pt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {video.status === 'READY' && video.hlsUrl ? (
            <VideoPlayer src={video.hlsUrl} />
          ) : (
            <div className="w-full aspect-video bg-[#1a1a1a] rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 text-lg">Video is processing...</p>
              </div>
            </div>
          )}

          <h1 className="text-xl font-semibold text-white mt-4">{video.title}</h1>

          <div className="flex flex-wrap items-center justify-between mt-3 gap-3">
            {/* Channel info */}
            <div className="flex items-center gap-3">
              <Link href={`/channel/${video.authorId}`}>
                <div className="w-10 h-10 rounded-full bg-[#303030] flex items-center justify-center overflow-hidden">
                  {video.author.image ? (
                    <img src={video.author.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle2 className="w-7 h-7 text-gray-400" />
                  )}
                </div>
              </Link>
              <div>
                <Link href={`/channel/${video.authorId}`} className="text-white font-medium text-sm hover:underline">
                  {video.author.name || 'Creator'}
                </Link>
                <p className="text-gray-400 text-xs">{subscriberCount} subscriber{subscriberCount !== 1 ? 's' : ''}</p>
              </div>
              <SubscribeButton channelId={video.authorId} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <LikeButtons videoId={video.id} />
              <VideoActions videoId={video.id} authorId={video.authorId} title={video.title} description={video.description || ''} tags={video.tags || ''} />
            </div>
          </div>

          {/* Video info box */}
          <div className="bg-[#222222] rounded-xl p-3 mt-4">
            <p className="text-sm text-gray-400 mb-1">{formatViews(video.views)} views · {timeAgo(video.createdAt)}</p>
            {video.tags && (
              <div className="flex flex-wrap gap-1 mb-2">
                {video.tags.split(',').map((t: string) => (
                  <span key={t} className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">#{t.trim()}</span>
                ))}
              </div>
            )}
            {video.description && <p className="text-sm text-gray-300 whitespace-pre-wrap">{video.description}</p>}
          </div>

          <CommentSection videoId={video.id} />
        </div>

        {/* Sidebar — Recommended */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <h3 className="text-base font-semibold text-white">Up next</h3>
          {recommended.length > 0 ? recommended.map(v => (
            <Link key={v.id} href={`/watch/${v.id}`} className="flex gap-2 group">
              <div className="w-40 h-24 bg-[#1a1a1a] rounded-lg overflow-hidden shrink-0">
                <img src={v.thumbnail || `https://picsum.photos/seed/${v.id}/320/180`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium line-clamp-2">{v.title}</p>
                <p className="text-xs text-gray-400 mt-1">{v.author.name || 'Creator'}</p>
                <p className="text-xs text-gray-500">{formatViews(v.views)} views · {timeAgo(v.createdAt)}</p>
              </div>
            </Link>
          )) : (
            <p className="text-sm text-gray-500">No more videos yet.</p>
          )}
        </div>
      </div>
    </>
  );
}

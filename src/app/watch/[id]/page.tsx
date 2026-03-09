import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import VideoPlayer from '@/components/VideoPlayer';
import LikeButtons from '@/components/LikeButtons';
import ViewCounter from '@/components/ViewCounter';
import VideoActions from '@/components/VideoActions';
import SubscribeButton from '@/components/SubscribeButton';
import Link from 'next/link';
import { UserCircle2 } from 'lucide-react';
import VideoDescription from '@/components/VideoDescription';

const CommentSection = dynamic(() => import('@/components/CommentSection'), {
  ssr: false,
  loading: () => <div className="mt-6 h-24 animate-pulse rounded-xl bg-[#1a1a1a]" />,
});

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

      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-4 pt-3 md:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 min-w-0">
          {video.status === 'READY' && video.hlsUrl ? (
            <VideoPlayer src={video.hlsUrl} />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-[#1a1a1a]">
              <div className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <p className="text-lg text-gray-400">Video is processing...</p>
              </div>
            </div>
          )}

          <h1 className="mt-4 text-lg font-semibold text-white sm:text-xl">{video.title}</h1>

          <div className="mt-3 flex flex-col gap-3 md:gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/channel/${video.authorId}`}>
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#303030]">
                  {video.author.image ? (
                    <img src={video.author.image} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <UserCircle2 className="h-7 w-7 text-gray-400" />
                  )}
                </div>
              </Link>
              <div className="min-w-0">
                <Link href={`/channel/${video.authorId}`} className="text-sm font-medium text-white hover:underline">
                  {video.author.name || 'Creator'}
                </Link>
                <p className="text-xs text-gray-400">{subscriberCount} subscriber{subscriberCount !== 1 ? 's' : ''}</p>
              </div>
              <SubscribeButton channelId={video.authorId} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <LikeButtons videoId={video.id} />
              <VideoActions videoId={video.id} authorId={video.authorId} title={video.title} description={video.description || ''} tags={video.tags || ''} />
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-[#222222] p-3">
            <p className="mb-1 text-sm text-gray-400">{formatViews(video.views)} views - {timeAgo(video.createdAt)}</p>
            {video.tags && (
              <div className="mb-2 flex flex-wrap gap-1">
                {video.tags.split(',').map((t: string) => (
                  <span key={t} className="rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">#{t.trim()}</span>
                ))}
              </div>
            )}
            <VideoDescription text={video.description || ''} />
          </div>

          <CommentSection videoId={video.id} />
        </div>

        <div className="lg:col-span-1 min-w-0">
          <h3 className="mb-3 text-base font-semibold text-white">Up next</h3>
          {recommended.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 landscape:sm:grid-cols-3 landscape:lg:grid-cols-1">
              {recommended.map(v => (
                <Link key={v.id} href={`/watch/${v.id}`} className="group flex gap-2 min-w-0">
                  <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a] sm:h-24 sm:w-40 lg:w-36 xl:w-40">
                    <img
                      src={v.thumbnail || `https://picsum.photos/seed/${v.id}/320/180`}
                      alt=""
                      width={320}
                      height={180}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-white">{v.title}</p>
                    <p className="mt-1 text-xs text-gray-400">{v.author.name || 'Creator'}</p>
                    <p className="text-xs text-gray-500">{formatViews(v.views)} views - {timeAgo(v.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No more videos yet.</p>
          )}
        </div>
      </div>
    </>
  );
}
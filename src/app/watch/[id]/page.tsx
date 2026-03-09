import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import VideoPlayer from '@/components/VideoPlayer';
import LikeButtons from '@/components/LikeButtons';
import ViewCounter from '@/components/ViewCounter';
import VideoActions from '@/components/VideoActions';
import SubscribeButton from '@/components/SubscribeButton';
import Link from 'next/link';
import VideoDescription from '@/components/VideoDescription';
import UserAvatar from '@/components/UserAvatar';
import { publishDueScheduledVideos } from '@/lib/scheduler';

const CommentSection = dynamic(() => import('@/components/CommentSection'), {
  loading: () => <div className="glass-panel mt-6 h-24 animate-pulse rounded-2xl" />,
});

interface WatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  await publishDueScheduledVideos();
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

      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-5 pt-3 md:gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          {video.status === 'READY' && video.hlsUrl ? (
            <VideoPlayer src={video.hlsUrl} />
          ) : (
            <div className="glass-panel flex aspect-video w-full items-center justify-center rounded-2xl">
              <div className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <p className="text-lg text-muted">Video is processing...</p>
              </div>
            </div>
          )}

          <h1 className="page-title mt-4 text-[var(--foreground)]">{video.title}</h1>

          <section className="glass-panel mt-4 rounded-2xl p-3 sm:p-4">
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/channel/${video.authorId}`}>
                  <UserAvatar src={video.author.image} alt={video.author.name || 'Creator'} sizeClassName="h-10 w-10 border border-[var(--glass-border)]" className="bg-[var(--surface-2)]" />
                </Link>
                <div className="min-w-0">
                  <Link href={`/channel/${video.authorId}`} className="text-sm font-semibold text-[var(--foreground)] hover:underline">
                    {video.author.name || 'Creator'}
                  </Link>
                  <p className="text-xs text-muted">{subscriberCount} subscriber{subscriberCount !== 1 ? 's' : ''}</p>
                </div>
                <SubscribeButton channelId={video.authorId} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <LikeButtons videoId={video.id} />
                <VideoActions videoId={video.id} title={video.title} description={video.description || ''} tags={video.tags || ''} />
              </div>
            </div>
          </section>

          <div className="glass-panel mt-4 rounded-2xl p-3 sm:p-4">
            <p className="mb-2 text-sm font-medium text-muted">
              {formatViews(video.views)} views <span className="mx-1">&middot;</span> {timeAgo(video.createdAt)}
            </p>
            {video.tags && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {video.tags.split(',').map((t: string) => (
                  <span key={t} className="glass-chip rounded-full px-2 py-0.5 text-xs text-blue-200">#{t.trim()}</span>
                ))}
              </div>
            )}
            <VideoDescription text={video.description || ''} />
          </div>

          <CommentSection videoId={video.id} />
        </div>

        <aside className="min-w-0 lg:col-span-1">
          <h3 className="section-title mb-3 text-[var(--foreground)]">Up next</h3>
          {recommended.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 landscape:sm:grid-cols-3 landscape:lg:grid-cols-1">
              {recommended.map(v => (
                <Link key={v.id} href={`/watch/${v.id}`} className="group glass-panel flex min-w-0 gap-2 rounded-xl p-2 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-[var(--glass-border)] bg-[var(--surface-1)] sm:h-24 sm:w-40 lg:w-36 xl:w-40">
                    <img
                      src={v.thumbnail || `https://picsum.photos/seed/${v.id}/320/180`}
                      alt=""
                      width={320}
                      height={180}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-[var(--foreground)]">{v.title}</p>
                    <p className="mt-1 text-xs text-muted">{v.author.name || 'Creator'}</p>
                    <p className="text-xs text-muted">{formatViews(v.views)} views <span className="mx-1">&middot;</span> {timeAgo(v.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No more videos yet.</p>
          )}
        </aside>
      </div>
    </>
  );
}


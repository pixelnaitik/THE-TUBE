import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
import EmptyState from '@/components/EmptyState';
import { ListVideo } from 'lucide-react';
import Link from 'next/link';

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      user: true,
      videos: {
        include: { video: { include: { author: true } } },
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!playlist) notFound();

  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.email === playlist.user.email;

  const validVideos = playlist.videos.filter(v => v.video.status === 'READY');
  const formatDate = (date: Date) => date.toLocaleDateString();

  return (
    <div>
      <div className="mb-8 mt-2 flex flex-col gap-6 md:flex-row">
        <aside className="surface-card group relative flex min-h-[300px] w-full shrink-0 flex-col justify-end overflow-hidden rounded-2xl border border-[var(--line)] p-6 md:w-80">
          {validVideos.length > 0 && validVideos[0].video.thumbnail && (
            <div className="absolute inset-0 z-0 opacity-40 transition-opacity group-hover:opacity-50">
              <img src={validVideos[0].video.thumbnail} alt="" className="h-full w-full scale-110 object-cover blur-md" />
            </div>
          )}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />

          <div className="relative z-20">
            <h1 className="page-title mb-2 text-white leading-tight">{playlist.name}</h1>
            <p className="mb-1 font-medium text-gray-300">{playlist.user.name}</p>
            <div className="mb-6 flex items-center gap-2 text-sm text-gray-300">
              <span>{validVideos.length} videos</span>
              <span>&middot;</span>
              <span>Updated {new Date(playlist.updatedAt).toLocaleDateString()}</span>
            </div>

            {validVideos.length > 0 ? (
              <Link
                href={`/watch/${validVideos[0].video.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 font-semibold text-black transition-colors hover:bg-gray-200"
              >
                <ListVideo className="h-5 w-5" /> Play all
              </Link>
            ) : (
              <button disabled className="w-full cursor-not-allowed rounded-full bg-[var(--surface-3)] px-4 py-3 font-semibold text-gray-400">
                No videos yet
              </button>
            )}
          </div>
        </aside>

        <section className="flex-1">
          {validVideos.length > 0 ? (
            <div className="flex flex-col gap-3">
              {validVideos.map((item, index) => (
                <div key={item.id} className="surface-card group flex items-start gap-4 rounded-xl p-2 transition-colors hover:bg-[var(--surface-2)]">
                  <span className="mt-6 hidden w-6 text-center font-semibold text-muted sm:block">{index + 1}</span>
                  <div className="w-40 shrink-0 sm:w-48">
                    <VideoCard
                      id={item.video.id}
                      title=""
                      thumbnail={item.video.thumbnail || `https://picsum.photos/seed/${item.video.id}/640/360`}
                      channelName=""
                      views=""
                      timestamp=""
                      duration={item.video.duration ? `${Math.floor(item.video.duration / 60)}:${String(item.video.duration % 60).padStart(2, '0')}` : '0:00'}
                      hideDetails
                    />
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <Link href={`/watch/${item.video.id}`} className="mb-1 line-clamp-2 text-base font-semibold text-white transition-colors group-hover:text-blue-300 md:text-lg">
                      {item.video.title}
                    </Link>
                    <p className="mb-1 text-sm text-muted">{item.video.author.name}</p>
                    <p className="text-xs text-muted">{item.video.views} views <span className="mx-1">&middot;</span> {formatDate(item.video.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ListVideo}
              title="This playlist is empty"
              description={isOwner ? 'Find videos you like and save them to this playlist.' : 'No videos have been added to this playlist yet.'}
            />
          )}
        </section>
      </div>
    </div>
  );
}
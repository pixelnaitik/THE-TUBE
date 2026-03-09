import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
import AvatarUpload from '@/components/AvatarUpload';
import EmptyState from '@/components/EmptyState';
import { UserCircle2, Video, Eye, ThumbsUp, ListVideo } from 'lucide-react';
import Link from 'next/link';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      videos: { where: { status: 'READY' }, orderBy: { createdAt: 'desc' } },
      subscribers: true,
      playlists: {
        include: {
          _count: { select: { videos: true } },
          videos: { take: 1, orderBy: { addedAt: 'desc' }, include: { video: { select: { thumbnail: true, id: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) redirect('/login');

  const totalViews = user.videos.reduce((sum, v) => sum + v.views, 0);
  const totalLikes = await prisma.like.count({
    where: { type: 'LIKE', video: { authorId: user.id } }
  });

  const formatDate = (date: Date) => date.toLocaleDateString();

  return (
    <div>
      <div className="mb-5 h-24 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400 sm:h-32" />

      <section className="surface-card mb-9 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative -mt-8 sm:-mt-10">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-[#0b0f17] bg-[var(--surface-2)] sm:h-24 sm:w-24">
              {user.image ? (
                <img src={user.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserCircle2 className="h-16 w-16 text-gray-400" />
              )}
            </div>
            <AvatarUpload />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h1 className="page-title text-white">{user.name || 'Creator'}</h1>
            <p className="text-sm text-muted">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              <div className="flex items-center gap-1.5 text-gray-300">
                <Video className="h-4 w-4" /> <span className="text-sm">{user.videos.length} videos</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300">
                <Eye className="h-4 w-4" /> <span className="text-sm">{totalViews} views</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300">
                <ThumbsUp className="h-4 w-4" /> <span className="text-sm">{totalLikes} likes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <h2 className="section-title mb-4 text-white">Your Videos</h2>
      {user.videos.length > 0 ? (
        <div className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {user.videos.map(video => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.title}
              thumbnail={video.thumbnail || `https://picsum.photos/seed/${video.id}/640/360`}
              channelName={user.name || 'Creator'}
              channelAvatar={user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
              views={`${video.views} views`}
              timestamp={formatDate(video.createdAt)}
              duration={video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : '0:00'}
            />
          ))}
        </div>
      ) : (
        <div className="mb-12">
          <EmptyState
            icon={Video}
            title="You have not uploaded videos"
            description="Publish your first upload to start growing your channel."
            ctaHref="/upload"
            ctaLabel="Upload video"
          />
        </div>
      )}

      <h2 className="section-title mb-4 text-white">Your Playlists</h2>
      {user.playlists.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {user.playlists.map(playlist => (
            <Link key={playlist.id} href={`/playlist/${playlist.id}`} className="group relative aspect-video overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-1)] reveal-up">
              {playlist.videos.length > 0 && playlist.videos[0].video.thumbnail ? (
                <img src={playlist.videos[0].video.thumbnail} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-gray-500">
                  <Video className="mb-2 h-8 w-8 opacity-60" />
                  <span className="text-xs">Empty playlist</span>
                </div>
              )}
              <div className="absolute inset-y-0 right-0 flex w-1/3 flex-col items-center justify-center bg-black/80 text-white transition-opacity group-hover:bg-black/90">
                <span className="text-lg font-semibold">{playlist._count.videos}</span>
                <ListVideo className="mt-1 h-5 w-5" />
              </div>
              <div className="absolute bottom-0 left-0 right-1/3 bg-gradient-to-t from-black/85 to-transparent p-3">
                <h3 className="truncate text-sm font-semibold text-white">{playlist.name}</h3>
                <p className="text-xs text-gray-300">View full playlist</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ListVideo}
          title="No playlists yet"
          description="Create playlists from videos you save to organize your content."
        />
      )}
    </div>
  );
}
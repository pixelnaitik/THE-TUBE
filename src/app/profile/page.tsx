import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
import AvatarUpload from '@/components/AvatarUpload';
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
      {/* Profile Header */}
      <div className="mb-4 h-24 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 sm:mb-6 sm:h-32"></div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative -mt-8 sm:-mt-10">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-[#0f0f0f] bg-[#303030] sm:h-24 sm:w-24">
            {user.image ? (
              <img src={user.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserCircle2 className="w-16 h-16 text-gray-400" />
            )}
          </div>
          <AvatarUpload />
        </div>
        <div className="flex-1 pt-1 sm:pt-2">
          <h1 className="text-xl font-bold text-white sm:text-2xl">{user.name || 'Creator'}</h1>
          <p className="text-sm text-gray-400">{user.email}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <div className="flex items-center gap-1.5 text-gray-300">
              <Video className="w-4 h-4" /> <span className="text-sm">{user.videos.length} videos</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <Eye className="w-4 h-4" /> <span className="text-sm">{totalViews} views</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <ThumbsUp className="w-4 h-4" /> <span className="text-sm">{totalLikes} likes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Your Videos */}
      <h2 className="text-lg font-semibold text-white mb-4">Your Videos</h2>
      {user.videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
          {user.videos.map(video => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.title}
              thumbnail={video.thumbnail || `https://picsum.photos/seed/${video.id}/640/360`}
              channelName={user.name || 'Creator'}
              channelAvatar={user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
              views={`${video.views}`}
              timestamp={formatDate(video.createdAt)}
              duration={video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : '0:00'}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-12 mb-12">No videos yet. Upload your first video!</p>
      )}

      {/* Playlists */}
      <h2 className="text-lg font-semibold text-white mb-4">Your Playlists</h2>
      {user.playlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {user.playlists.map(playlist => (
            <Link key={playlist.id} href={`/playlist/${playlist.id}`} className="group relative rounded-xl overflow-hidden aspect-video bg-[#222]">
              {playlist.videos.length > 0 && playlist.videos[0].video.thumbnail ? (
                <img src={playlist.videos[0].video.thumbnail} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                  <Video className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs">Empty playlist</span>
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-y-0 right-0 w-1/3 bg-black/80 flex flex-col items-center justify-center text-white transition-opacity group-hover:bg-black/90">
                <span className="font-semibold text-lg">{playlist._count.videos}</span>
                <ListVideo className="w-5 h-5 mt-1" />
              </div>
              <div className="absolute bottom-0 left-0 right-1/3 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white font-medium truncate text-sm">{playlist.name}</h3>
                <p className="text-xs text-gray-400">View full playlist</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-12">No playlists yet. Create one from any video!</p>
      )}
    </div>
  );
}



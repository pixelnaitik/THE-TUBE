import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
import AvatarUpload from '@/components/AvatarUpload';
import { UserCircle2, Video, Eye, ThumbsUp } from 'lucide-react';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      videos: { where: { status: 'READY' }, orderBy: { createdAt: 'desc' } },
      subscribers: true,
    }
  });

  if (!user) redirect('/login');

  const totalViews = user.videos.reduce((sum, v) => sum + v.views, 0);
  const totalLikes = await prisma.like.count({
    where: { type: 'LIKE', video: { authorId: user.id } }
  });

  const timeAgo = (date: Date) => {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div>
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 h-32 rounded-xl mb-6"></div>

      <div className="flex items-start gap-4 mb-8">
        <div className="relative -mt-10">
          <div className="w-24 h-24 rounded-full bg-[#303030] border-4 border-[#0f0f0f] flex items-center justify-center overflow-hidden">
            {user.image ? (
              <img src={user.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserCircle2 className="w-16 h-16 text-gray-400" />
            )}
          </div>
          <AvatarUpload />
        </div>
        <div className="flex-1 pt-2">
          <h1 className="text-2xl font-bold text-white">{user.name || 'Creator'}</h1>
          <p className="text-sm text-gray-400">{user.email}</p>
          <div className="flex gap-6 mt-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {user.videos.map(video => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.title}
              thumbnail={video.thumbnail || `https://picsum.photos/seed/${video.id}/640/360`}
              channelName={user.name || 'Creator'}
              channelAvatar={user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
              views={`${video.views} views`}
              timestamp={timeAgo(video.createdAt)}
              duration={video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : '0:00'}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-12">No videos yet. Upload your first video!</p>
      )}
    </div>
  );
}

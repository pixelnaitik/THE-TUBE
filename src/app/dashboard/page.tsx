import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Eye, ThumbsUp, Video as VideoIcon, Users } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      videos: {
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { comments: true, likes: true } } }
      },
      subscribers: true
    }
  });

  if (!user) redirect('/login');

  const totalViews = user.videos.reduce((sum, v) => sum + v.views, 0);
  const totalLikes = user.videos.reduce((sum, v) => sum + v._count.likes, 0);

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) => (
    <div className="flex items-center justify-between rounded-xl border border-[#303030] bg-[#1a1a1a] p-4 sm:p-6">
      <div>
        <p className="mb-1 text-sm font-medium text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold text-white sm:text-3xl">{value}</h3>
      </div>
      <div className={`rounded-full p-3 sm:p-4 ${color} bg-opacity-10`}>
        <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1280px] pt-3 sm:pt-6">
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-white sm:mb-2 sm:text-3xl">Creator Dashboard</h1>
          <p className="text-sm text-gray-400 sm:text-base">Welcome back, {user.name || 'Creator'}</p>
        </div>
        <Link href="/upload" className="w-full rounded-full bg-blue-600 px-6 py-2 text-center font-medium text-white transition-colors hover:bg-blue-700 sm:w-auto">
          Upload Video
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:mb-10 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Views" value={totalViews} icon={Eye} color="bg-blue-500" />
        <StatCard title="Total Likes" value={totalLikes} icon={ThumbsUp} color="bg-green-500" />
        <StatCard title="Subscribers" value={user.subscribers.length} icon={Users} color="bg-purple-500" />
        <StatCard title="Videos Uploaded" value={user.videos.length} icon={VideoIcon} color="bg-red-500" />
      </div>

      <h2 className="mb-4 text-lg font-bold text-white sm:mb-6 sm:text-xl">Recent Content</h2>

      <div className="overflow-hidden rounded-xl border border-[#303030] bg-[#1a1a1a] text-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#303030] text-sm text-gray-400">
                <th className="min-w-[300px] p-4 font-medium">Video</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Views</th>
                <th className="p-4 font-medium">Comments</th>
                <th className="p-4 font-medium">Likes</th>
                <th className="p-4 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303030]">
              {user.videos.slice(0, 10).map((video) => (
                <tr key={video.id} className="transition-colors hover:bg-[#222]">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded bg-black">
                        {video.thumbnail ? (
                          <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#272727] text-gray-500"><VideoIcon className="h-5 w-5" /></div>
                        )}
                        <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[10px]">{video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : '0:00'}</span>
                      </div>
                      <Link href={`/watch/${video.id}`} className="line-clamp-2 text-sm font-medium hover:text-blue-400">
                        {video.title}
                      </Link>
                    </div>
                  </td>
                  <td className="whitespace-nowrap p-4 text-sm text-gray-300">{new Date(video.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-sm text-gray-300">{video.views}</td>
                  <td className="p-4 text-sm text-gray-300">{video._count.comments}</td>
                  <td className="p-4 text-sm text-gray-300">{video._count.likes}</td>
                  <td className="p-4 text-center">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${video.status === 'READY' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {video.status}
                    </span>
                  </td>
                </tr>
              ))}
              {user.videos.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    You haven't uploaded any videos yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


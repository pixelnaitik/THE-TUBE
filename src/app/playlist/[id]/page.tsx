import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import VideoCard from '@/components/VideoCard';
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

  const timeAgo = (date: Date) => {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-6 mb-8 mt-2">
        <div className="w-full md:w-80 shrink-0 bg-[#1a1a1a] rounded-xl p-6 border border-[#303030] flex flex-col justify-end min-h-[300px] relative overflow-hidden group">
          {validVideos.length > 0 && validVideos[0].video.thumbnail && (
            <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-50 transition-opacity">
              <img src={validVideos[0].video.thumbnail} alt="" className="w-full h-full object-cover blur-md scale-110" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10"></div>
          
          <div className="relative z-20">
            <h1 className="text-3xl font-bold text-white mb-2 leading-tight">{playlist.name}</h1>
            <p className="text-gray-300 font-medium mb-1">{playlist.user.name}</p>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
              <span>{validVideos.length} videos</span>
              <span>•</span>
              <span>Updated {new Date(playlist.updatedAt).toLocaleDateString()}</span>
            </div>
            
            {validVideos.length > 0 ? (
              <Link 
                href={`/watch/${validVideos[0].video.id}`}
                className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 font-semibold py-3 px-4 rounded-full transition-colors"
               >
                <ListVideo className="w-5 h-5" /> Play all
              </Link>
            ) : (
              <button disabled className="w-full flex items-center justify-center gap-2 bg-[#303030] text-gray-400 font-semibold py-3 px-4 rounded-full cursor-not-allowed">
                No videos yet
              </button>
            )}
          </div>
        </div>

        <div className="flex-1">
          {validVideos.length > 0 ? (
            <div className="flex flex-col gap-3">
              {validVideos.map((item, index) => (
                <div key={item.id} className="flex items-start gap-4 p-2 hover:bg-[#222] rounded-xl transition-colors group">
                  <span className="text-gray-500 font-medium w-6 text-center mt-6 hidden sm:block">{index + 1}</span>
                  <div className="w-40 sm:w-48 shrink-0">
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
                  <div className="flex-1 py-1">
                    <Link href={`/watch/${item.video.id}`} className="text-white font-medium line-clamp-2 md:text-lg mb-1 group-hover:text-blue-400 transition-colors">
                      {item.video.title}
                    </Link>
                    <p className="text-sm text-gray-400 mb-1">{item.video.author.name}</p>
                    <p className="text-xs text-gray-500">{item.video.views} views • {timeAgo(item.video.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 text-gray-500">
              <ListVideo className="w-16 h-16 mb-4 opacity-20" />
              <h2 className="text-xl font-medium text-gray-300 mb-2">This playlist is empty</h2>
              {isOwner && <p>Find videos you like and save them to this playlist.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

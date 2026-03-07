import VideoCard from '@/components/VideoCard';
import { prisma } from '@/lib/prisma';

export default async function Home() {
  // Fetch only videos that have completed processing
  const videos = await prisma.video.findMany({
    where: {
      status: 'READY'
    },
    include: {
      author: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Utility to format timestamp cleanly
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 mb-6 hide-scrollbar custom-scrollbar">
        {['All', 'Gaming', 'Music', 'Live', 'Mixes', 'Programming', 'News', 'Podcasts', 'Recently Uploaded', 'New to you'].map(chip => (
          <button key={chip} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${chip === 'All' ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'}`}>
            {chip}
          </button>
        ))}
      </div>
      
      {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 mt-20">
              <p className="text-xl font-medium mb-2">No videos available yet</p>
              <p className="text-sm">Sign in and upload a video to see it here!</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-10">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnail={video.thumbnail || "https://picsum.photos/800/450"} // Fallback
                duration={"10:00"} // Assuming 10m for prototype unless extracted from FFmpeg
                channelName={video.author.name || "Anonymous"}
                channelAvatar={`https://api.dicebear.com/7.x/avataaars/svg?seed=${video.authorId}`} // dynamic avatar based on ID
                views={video.views.toString()}
                timestamp={timeAgo(video.createdAt)}
              />
            ))}
          </div>
      )}
    </>
  );
}

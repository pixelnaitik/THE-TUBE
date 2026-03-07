import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import { ThumbsUp, Share2, MoreHorizontal, UserCircle2 } from 'lucide-react';

interface WatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  // Await the params object before accessing properties (per Next.js 15+ App Router rules)
  const resolvedParams = await params;
  const videoId = resolvedParams.id;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { author: true }
  });

  if (!video) {
    notFound();
  }

  // Formatting date nicely
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  }).format(new Date(video.createdAt));

  return (
    <>
      <div className="max-w-[1280px] mx-auto pt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left main content body */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {/* Video Player Area */}
          <div className="w-full">
            {video.status === 'READY' && video.hlsUrl ? (
                <VideoPlayer src={video.hlsUrl} poster={video.thumbnail || undefined} />
            ) : video.status === 'PROCESSING' ? (
                <div className="w-full aspect-video bg-[#181818] rounded-2xl border border-[#303030] flex flex-col items-center justify-center text-center p-6">
                   <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                   <h3 className="text-xl font-bold text-white mb-2">Processing Video</h3>
                   <p className="text-gray-400">Your video is currently being converted to adaptive HLS chunks (144p, 360p, 720p).<br/>This may take a few minutes. Check back soon!</p>
                </div>
            ) : (
                 <div className="w-full aspect-video bg-[#181818] rounded-2xl border border-red-500/30 flex flex-col items-center justify-center text-center p-6 text-red-500">
                   <h3 className="text-xl font-bold mb-2">Processing Failed</h3>
                   <p>There was an error parsing the uploaded video file.</p>
                 </div>
            )}
          </div>

          {/* Video Meta Information */}
          <div className="flex flex-col gap-2 mt-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white break-words">
              {video.title}
            </h1>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
              {/* Channel Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                  <UserCircle2 className="w-8 h-8" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-white text-base">{video.author.name || 'Anonymous User'}</span>
                  <span className="text-xs text-gray-400">1.2M subscribers</span>
                </div>
                <button className="ml-4 bg-white text-black font-semibold px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition-colors">
                  Subscribe
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                <div className="flex items-center bg-[#222222] rounded-full">
                  <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#303030] rounded-l-full transition-colors border-r border-[#303030]">
                    <ThumbsUp className="w-5 h-5" />
                    <span className="text-sm font-medium">Like</span>
                  </button>
                  <button className="px-4 py-2 hover:bg-[#303030] rounded-r-full transition-colors">
                    <ThumbsUp className="w-5 h-5 rotate-180" />
                  </button>
                </div>
                
                <button className="flex items-center gap-2 bg-[#222222] px-4 py-2 rounded-full hover:bg-[#303030] transition-colors shrink-0">
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Share</span>
                </button>
                
                <button className="flex items-center justify-center bg-[#222222] w-10 h-10 rounded-full hover:bg-[#303030] transition-colors shrink-0">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Description Box */}
            <div className="mt-4 bg-[#222222] p-4 rounded-xl hover:bg-[#303030] transition-colors cursor-pointer group">
               <div className="flex items-center gap-2 text-sm font-semibold text-gray-200 mb-2">
                 <span>{video.views} views</span>
                 <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                 <span>{formattedDate}</span>
               </div>
               <p className="text-sm text-gray-300 whitespace-pre-wrap line-clamp-3 group-hover:line-clamp-none transition-all">
                 {video.description || "No description provided."}
               </p>
            </div>
          </div>
          
        </div>

        {/* Right Sidebar (Recommendations) */}
        <div className="flex flex-col gap-3">
             <h3 className="font-semibold text-white mb-2 pb-2 border-b border-[#303030]">Up next</h3>
             {/* Simple mock up next videos */}
             {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex gap-2 group cursor-pointer">
                   <div className="relative w-40 aspect-video rounded-lg overflow-hidden shrink-0 bg-[#222]">
                      <img src={`https://picsum.photos/seed/${i * 123}/320/180`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="thumbnail" />
                   </div>
                   <div className="flex flex-col py-1">
                      <span className="text-sm font-semibold text-white line-clamp-2 leading-tight group-hover:text-blue-400">Next Recommended Video {i}</span>
                      <span className="text-xs text-gray-400 mt-1">Creator Name</span>
                      <span className="text-xs text-gray-400">{i}00K views</span>
                   </div>
                </div>
             ))}
        </div>

      </div>
    </>
  );
}

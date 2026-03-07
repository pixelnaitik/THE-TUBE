import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import LikeButtons from '@/components/LikeButtons';
import CommentSection from '@/components/CommentSection';
import ViewCounter from '@/components/ViewCounter';
import { Share2, MoreHorizontal, UserCircle2 } from 'lucide-react';

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

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
    return `${Math.floor(seconds / 2592000)} months ago`;
  };

  return (
    <>
      {/* Invisible view counter */}
      <ViewCounter videoId={video.id} />

      <div className="max-w-[1280px] mx-auto pt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left main content body */}
        <div className="lg:col-span-2">
          {video.status === 'READY' && video.hlsUrl ? (
            <VideoPlayer src={video.hlsUrl} />
          ) : (
            <div className="w-full aspect-video bg-[#1a1a1a] rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 text-lg">Video is processing...</p>
                <p className="text-gray-500 text-sm mt-1">This may take a few minutes</p>
              </div>
            </div>
          )}

          {/* Title & Metadata */}
          <h1 className="text-xl font-semibold text-white mt-4">{video.title}</h1>

          <div className="flex flex-wrap items-center justify-between mt-3 gap-3">
            {/* Channel info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#303030] flex items-center justify-center overflow-hidden">
                {video.author.image ? (
                  <img src={video.author.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle2 className="w-7 h-7 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{video.author.name || 'Creator'}</p>
                <p className="text-gray-400 text-xs">{formatViews(video.views)} views · {timeAgo(video.createdAt)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <LikeButtons videoId={video.id} />
              <button className="flex items-center gap-2 px-4 py-2 bg-[#222222] hover:bg-[#303030] rounded-full text-white text-sm transition-colors">
                <Share2 className="w-5 h-5" /> Share
              </button>
              <button className="p-2 bg-[#222222] hover:bg-[#303030] rounded-full text-white transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Description */}
          {video.description && (
            <div className="bg-[#222222] rounded-xl p-3 mt-4 text-sm text-gray-300 whitespace-pre-wrap">
              {video.description}
            </div>
          )}

          {/* Comments */}
          <CommentSection videoId={video.id} />
        </div>

        {/* Right sidebar — Recommended (placeholder) */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <h3 className="text-base font-semibold text-white">Up next</h3>
          <p className="text-sm text-gray-500">More videos coming soon...</p>
        </div>
      </div>
    </>
  );
}

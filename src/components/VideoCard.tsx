import Link from 'next/link';
import { MoreVertical } from 'lucide-react';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channelName: string;
  channelAvatar: string;
  views: string;
  timestamp: string;
}

export default function VideoCard({
  id,
  title,
  thumbnail,
  duration,
  channelName,
  channelAvatar,
  views,
  timestamp,
}: VideoCardProps) {
  return (
    <div className="flex flex-col gap-3 group cursor-pointer text-white">
      <Link href={`/watch/${id}`} className="relative block aspect-video w-full rounded-xl overflow-hidden bg-[#222]">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover rounded-xl transition-all duration-300 group-hover:scale-105"
        />
        {/* Playback duration badge */}
        <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-xs font-semibold">
          {duration}
        </div>
      </Link>
      
      <div className="flex gap-3 pr-2">
        <Link href={`#`} className="flex-shrink-0 mt-1">
          <img
            src={channelAvatar}
            alt={channelName}
            className="w-9 h-9 rounded-full object-cover"
          />
        </Link>
        <div className="flex flex-col overflow-hidden">
          <Link href={`/watch/${id}`} className="line-clamp-2 text-base font-semibold leading-tight group-hover:text-blue-400 transition-colors">
            {title}
          </Link>
          <div className="text-sm text-[#AAAAAA] mt-1 flex flex-col">
            <Link href={`#`} className="hover:text-white transition-colors flex items-center gap-1">
              {channelName}
            </Link>
            <div className="flex items-center text-xs mt-0.5">
              <span>{views} views</span>
              <span className="mx-1.5 text-[10px]">•</span>
              <span>{timestamp}</span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 ml-auto pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1 hover:bg-[#272727] rounded-full">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

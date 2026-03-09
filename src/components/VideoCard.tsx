import Link from 'next/link';
import Image from 'next/image';
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
  hideDetails?: boolean;
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
  hideDetails,
}: VideoCardProps) {
  return (
    <div className="flex flex-col gap-3 group cursor-pointer text-white">
      <Link href={`/watch/${id}`} className="relative block aspect-video w-full rounded-xl overflow-hidden bg-[#222]">
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover rounded-xl transition-all duration-300 group-hover:scale-105"
        />
        {/* Playback duration badge */}
        <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
          {duration}
        </div>
      </Link>
      
      {!hideDetails && (
        <div className="flex gap-3 pr-2">
          <Link href={`#`} className="flex-shrink-0 mt-1 relative w-9 h-9">
            <Image
              src={channelAvatar}
              alt={channelName}
              fill
              sizes="36px"
              className="rounded-full object-cover"
            />
          </Link>
          <div className="flex flex-col overflow-hidden flex-1">
            <Link href={`/watch/${id}`} className="line-clamp-2 text-sm md:text-base font-semibold leading-tight group-hover:text-blue-400 transition-colors pr-4 md:pr-0">
              {title}
            </Link>
            <div className="text-sm text-[#AAAAAA] mt-1 flex flex-col">
              <Link href={`#`} className="hover:text-white transition-colors w-fit">
                {channelName}
              </Link>
              <div className="flex flex-wrap items-center text-xs mt-0.5">
                <span>{views}</span>
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
      )}
    </div>
  );
}

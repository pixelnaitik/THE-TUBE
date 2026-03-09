import Link from 'next/link';
import Image from 'next/image';
import { MoreVertical } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';

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
    <article className="group glass-panel flex cursor-pointer flex-col gap-3 rounded-2xl p-2.5 text-[var(--foreground)] reveal-up transition-transform duration-200 hover:-translate-y-0.5">
      <Link
        href={`/watch/${id}`}
        className="relative block aspect-video w-full overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--surface-1)]"
      >
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-75" />
        <div className="absolute inset-0 ring-1 ring-blue-300/0 transition-all duration-300 group-hover:ring-blue-300/30" />
        <div className="glass-pill absolute bottom-2 right-2 rounded-md px-1.5 py-0.5 text-xs font-semibold text-white">
          {duration}
        </div>
      </Link>

      {!hideDetails && (
        <div className="flex gap-3 px-1 pb-1">
          <Link href="#" className="relative mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[var(--glass-border)]">
            <UserAvatar src={channelAvatar} alt={channelName} sizeClassName="h-9 w-9" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/watch/${id}`}
              className="line-clamp-2 text-sm font-semibold leading-tight transition-colors group-hover:text-blue-300 md:text-base"
            >
              {title}
            </Link>
            <div className="mt-1 flex flex-col text-sm text-muted">
              <Link href="#" className="w-fit transition-colors hover:text-[var(--foreground)]">
                {channelName}
              </Link>
              <div className="mt-0.5 flex flex-wrap items-center text-xs">
                <span>{views}</span>
                <span className="mx-1.5 text-[10px]">&middot;</span>
                <span>{timestamp}</span>
              </div>
            </div>
          </div>
          <div className="ml-auto shrink-0 pt-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button className="glass-chip rounded-full p-1 transition-colors hover:bg-[var(--surface-3)]/70" aria-label="More options">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

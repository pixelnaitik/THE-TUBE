"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import VideoCard from "@/components/VideoCard";
import { Search } from "lucide-react";

interface Video {
  id: string;
  title: string;
  thumbnail: string | null;
  views: number;
  createdAt: string;
  duration: number | null;
  author: { name: string | null; image: string | null };
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [result, setResult] = useState<{ query: string; videos: Video[] }>({ query: "", videos: [] });

  useEffect(() => {
    if (!query) return;

    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then((data: Video[]) => {
        setResult({ query, videos: data });
      });
  }, [query]);

  const loading = Boolean(query) && result.query !== query;

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <>
      <h1 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
        <Search className="h-5 w-5" />
        Search results for &quot;{query}&quot;
      </h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : result.videos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {result.videos.map(video => (
            <VideoCard
              key={video.id}
              id={video.id}
              title={video.title}
              thumbnail={video.thumbnail || `https://picsum.photos/seed/${video.id}/640/360`}
              channelName={video.author.name || 'Creator'}
              channelAvatar={video.author.image || `https://api.dicebear.com/7.x/initials/svg?seed=${video.author.name}`}
              views={`${video.views} views`}
              timestamp={timeAgo(video.createdAt)}
              duration={video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : '0:00'}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Search className="mx-auto mb-4 h-16 w-16 text-gray-600" />
          <p className="text-lg text-gray-400">No videos found for &quot;{query}&quot;</p>
          <p className="mt-1 text-sm text-gray-500">Try different keywords or check your spelling</p>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
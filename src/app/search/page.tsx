"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import VideoCard from "@/components/VideoCard";
import EmptyState from "@/components/EmptyState";
import { Search, TrendingUp, Sparkles } from "lucide-react";

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
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [result, setResult] = useState<{ query: string; videos: Video[] }>({ query: "", videos: [] });
  const [trendingTags, setTrendingTags] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/search/suggest')
      .then(r => r.json())
      .then(data => setTrendingTags(data.trendingTags || []))
      .catch(() => setTrendingTags([]));
  }, []);

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
      <h1 className="page-title mb-5 flex items-center gap-2 text-[var(--foreground)]">
        <Search className="h-6 w-6 text-blue-300" />
        Search results for &quot;{query || '...'}&quot;
      </h1>

      {trendingTags.length > 0 && (
        <section className="glass-panel mb-5 rounded-2xl p-3 sm:p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
            <TrendingUp className="h-4 w-4 text-amber-500" /> Trending tags
          </p>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map((tag) => (
              <button
                key={tag}
                onClick={() => router.push(`/search?q=${encodeURIComponent(tag)}`)}
                className="glass-chip rounded-full px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-3)]/70"
              >
                #{tag}
              </button>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="glass-panel flex justify-center rounded-2xl py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : result.videos.length > 0 ? (
        <>
          <p className="mb-3 flex items-center gap-1 text-sm text-muted"><Sparkles className="h-4 w-4" /> Ranked by relevance + popularity</p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.videos.map(video => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnail={video.thumbnail || `https://picsum.photos/seed/${video.id}/640/360`}
                channelName={video.author.name || 'Creator'}
                channelAvatar={video.author.image || ''}
                views={`${video.views} views`}
                timestamp={timeAgo(video.createdAt)}
                duration={video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : '0:00'}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={Search}
          title="No results found"
          description="Try a different keyword, shorten your phrase, or check spelling."
        />
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="glass-panel flex justify-center rounded-2xl py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}

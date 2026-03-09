"use client";

import { useRouter } from "next/navigation";

const TAGS = ['All', 'Gaming', 'Music', 'Live', 'Programming', 'News', 'Podcasts', 'Education', 'Entertainment', 'Sports'];

interface HomeFiltersProps {
  currentSort: string;
  currentTag: string;
}

export default function HomeFilters({ currentSort, currentTag }: HomeFiltersProps) {
  const router = useRouter();

  const setFilter = (sort?: string, tag?: string) => {
    const params = new URLSearchParams();
    if (sort && sort !== 'newest') params.set('sort', sort);
    if (tag && tag !== 'All') params.set('tag', tag);
    router.push(`/?${params.toString()}`);
  };

  return (
    <section className="surface-card reveal-up rounded-2xl p-3 sm:p-4">
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 hide-scrollbar custom-scrollbar">
        {TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => setFilter(currentSort, tag)}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
              currentTag === tag
                ? 'bg-[var(--accent)] text-white shadow-[0_6px_18px_rgba(37,99,235,0.35)]'
                : 'bg-[var(--surface-2)] text-gray-200 hover:bg-[var(--surface-3)]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'newest', label: 'Newest' },
          { key: 'views', label: 'Most Viewed' },
          { key: 'oldest', label: 'Oldest' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key, currentTag)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
              currentSort === key
                ? 'bg-[var(--accent-soft)] text-blue-200 ring-1 ring-blue-300/35'
                : 'bg-[var(--surface-1)] text-muted hover:bg-[var(--surface-2)] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
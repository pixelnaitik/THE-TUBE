"use client";

import { useRouter } from "next/navigation";

const DEFAULT_TAGS = ['All', 'Gaming', 'Music', 'Live', 'Programming', 'News', 'Podcasts', 'Education', 'Entertainment', 'Sports'];

interface HomeFiltersProps {
  currentSort: string;
  currentTag: string;
  tags?: string[];
}

export default function HomeFilters({ currentSort, currentTag, tags }: HomeFiltersProps) {
  const router = useRouter();
  const availableTags = tags && tags.length > 0 ? tags : DEFAULT_TAGS;

  const setFilter = (sort?: string, tag?: string) => {
    const params = new URLSearchParams();
    if (sort && sort !== 'newest') params.set('sort', sort);
    if (tag && tag !== 'All') params.set('tag', tag);
    router.push(`/?${params.toString()}`);
  };

  return (
    <section className="glass-panel reveal-up rounded-2xl p-3 sm:p-4">
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 hide-scrollbar custom-scrollbar">
        {availableTags.map(tag => (
          <button
            key={tag}
            onClick={() => setFilter(currentSort, tag)}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
              currentTag === tag
                ? 'bg-[var(--accent)] text-white shadow-[0_6px_18px_rgba(37,99,235,0.35)]'
                : 'glass-chip hover:bg-[var(--surface-3)]'
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
                : 'glass-chip text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

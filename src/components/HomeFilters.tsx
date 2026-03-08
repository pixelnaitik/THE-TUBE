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
    <div className="flex flex-col gap-3">
      {/* Tag chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar custom-scrollbar">
        {TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => setFilter(currentSort, tag)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentTag === tag ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Sort buttons */}
      <div className="flex gap-2">
        {[
          { key: 'newest', label: 'Newest' },
          { key: 'views', label: 'Most Viewed' },
          { key: 'oldest', label: 'Oldest' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key, currentTag)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              currentSort === key
                ? 'bg-blue-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#272727] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

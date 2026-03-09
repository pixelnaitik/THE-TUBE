"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flame, Users, Clock, Video, ThumbsUp, PlaySquare, BarChart } from 'lucide-react';
import { useSidebarInfo } from '@/store/sidebarStore';

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/shorts', label: 'Shorts', icon: Flame },
  { href: '/subscriptions', label: 'Subscriptions', icon: Users },
  { divider: true },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/profile', label: 'Your videos', icon: Video },
  { href: '/watch-later', label: 'Watch later', icon: PlaySquare },
  { href: '/liked', label: 'Liked videos', icon: ThumbsUp },
  { href: '/dashboard', label: 'Creator Dashboard', icon: BarChart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebarInfo();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/35 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`glass-sidebar fixed left-0 top-14 z-[60] h-[calc(100dvh-56px)] w-56 overflow-y-auto px-2 py-3 hide-scrollbar custom-scrollbar transition-transform duration-300 md:w-20 lg:w-56 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {links.map((item, i) =>
          'divider' in item ? (
            <div key={i} className="my-3 mx-2 hidden border-t border-[var(--glass-border)] lg:block" />
          ) : (
            <Link
              key={item.href}
              href={item.href!}
              title={item.label}
              onClick={() => setIsOpen(false)}
              className={`group relative mb-1 flex items-center rounded-xl px-3 py-2.5 text-sm transition-all md:justify-center lg:justify-start lg:gap-4 ${
                pathname === item.href
                  ? 'glass-chip font-semibold text-[var(--foreground)] ring-1 ring-blue-400/35'
                  : 'text-[var(--muted)] hover:glass-chip hover:text-[var(--foreground)]'
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
              <span className="glass-panel pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded-md px-2 py-1 text-xs text-[var(--foreground)] opacity-0 transition-opacity group-hover:opacity-100 md:block lg:hidden">
                {item.label}
              </span>
            </Link>
          )
        )}
      </aside>
    </>
  );
}

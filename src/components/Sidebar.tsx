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
          className="fixed inset-0 z-[55] bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-14 z-[60] h-[calc(100dvh-56px)] w-56 overflow-y-auto bg-[#0f0f0f] px-2 py-3 hide-scrollbar custom-scrollbar transition-transform duration-300 md:w-20 lg:w-56 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {links.map((item, i) =>
          'divider' in item ? (
            <div key={i} className="my-2 mx-2 border-t border-[#303030] lg:block hidden" />
          ) : (
            <Link
              key={item.href}
              href={item.href!}
              onClick={() => setIsOpen(false)}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors md:justify-center lg:justify-start lg:gap-4 ${
                pathname === item.href
                  ? 'bg-[#272727] font-medium text-white'
                  : 'text-gray-300 hover:bg-[#1a1a1a]'
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          )
        )}
      </aside>
    </>
  );
}
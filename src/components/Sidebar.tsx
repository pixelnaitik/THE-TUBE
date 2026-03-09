"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flame, Users, Clock, Video, ThumbsUp, PlaySquare, BarChart } from 'lucide-react';

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

import { useSidebarInfo } from '@/store/sidebarStore';

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebarInfo();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[55] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`fixed left-0 top-14 w-56 h-[calc(100vh-56px)] bg-[#0f0f0f] overflow-y-auto hide-scrollbar custom-scrollbar py-3 px-2 z-[60] transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {links.map((item, i) =>
          'divider' in item ? (
            <div key={i} className="border-t border-[#303030] my-2 mx-2"></div>
          ) : (
            <Link
              key={item.href}
              href={item.href!}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-[#272727] text-white font-medium'
                  : 'text-gray-300 hover:bg-[#1a1a1a]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        )}
      </aside>
    </>
  );
}

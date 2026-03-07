import React from 'react';
import { Home, Compass, PlaySquare, Clock, ThumbsUp, History, ListVideo } from 'lucide-react';
import Link from 'next/link';

const sidebarItems = [
  { icon: Home, label: 'Home', active: true },
  { icon: Compass, label: 'Shorts' },
  { icon: PlaySquare, label: 'Subscriptions' },
];

const secondaryItems = [
  { icon: History, label: 'History' },
  { icon: ListVideo, label: 'Your videos' },
  { icon: Clock, label: 'Watch later' },
  { icon: ThumbsUp, label: 'Liked videos' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 fixed left-0 top-16 bottom-0 bg-[#0f0f0f] overflow-y-auto hidden md:block pt-4 pb-4 px-3 text-white">
      <div className="flex flex-col gap-1 pb-4 border-b border-[#303030]">
        {sidebarItems.map((item) => (
          <Link
            key={item.label}
            href="#"
            className={`flex items-center px-4 py-3 rounded-lg gap-5 transition-colors ${
              item.active ? 'bg-[#272727]' : 'hover:bg-[#272727]'
            }`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-1 py-4 border-b border-[#303030]">
        <h3 className="px-4 text-sm font-semibold mb-2">You</h3>
        {secondaryItems.map((item) => (
          <Link
            key={item.label}
            href="#"
            className="flex items-center px-4 py-3 rounded-lg gap-5 hover:bg-[#272727] transition-colors"
          >
            <item.icon className="w-6 h-6" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}

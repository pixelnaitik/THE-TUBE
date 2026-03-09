"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flame, Users, User } from 'lucide-react';

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/shorts', label: 'Shorts', icon: Flame },
  { href: '/subscriptions', label: 'Subscriptions', icon: Users },
  { href: '/profile', label: 'You', icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#0f0f0f] border-t border-[#222] z-50 flex items-center justify-around px-2 pb-safe pt-1">
      {links.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
              isActive ? 'text-white' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-[var(--line)] bg-[#0b0f17]/95 px-2 pb-safe pt-1 backdrop-blur-md md:hidden">
      {links.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
              isActive ? 'text-blue-200' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {isActive && <span className="absolute inset-x-4 top-1 h-0.5 rounded-full bg-[var(--accent)]" />}
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="text-[10px] font-semibold leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
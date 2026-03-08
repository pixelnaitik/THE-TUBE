"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, Plus, Search, Video, UserCircle2 } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  useEffect(() => {
    if (session) {
      fetch('/api/notifications').then(r => r.json()).then(setNotifications).catch(() => {});
    }
  }, [session]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const timeAgo = (dateStr: string) => {
    const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (s < 60) return 'now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#0f0f0f] z-50 flex items-center justify-between px-4 h-14 border-b border-[#222]">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-[#272727] rounded-full transition-colors">
          <Menu className="w-5 h-5 text-white" />
        </button>
        <Link href="/" className="flex items-center gap-1">
          <div className="bg-red-600 text-white p-1 rounded-lg">
            <Video className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">MyTube</span>
        </Link>
      </div>

      {/* Center — Search */}
      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-[540px] mx-4">
        <div className="flex w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-[#121212] border border-[#303030] rounded-l-full px-4 py-2 text-white outline-none focus:border-blue-500 placeholder:text-gray-500 transition-colors"
          />
          <button type="submit" className="px-5 bg-[#222] border border-l-0 border-[#303030] rounded-r-full hover:bg-[#303030] transition-colors">
            <Search className="w-5 h-5 text-white" />
          </button>
        </div>
      </form>

      {/* Right */}
      <div className="flex items-center gap-1">
        {session ? (
          <>
            <Link href="/upload" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#303030] rounded-full text-white text-sm font-medium transition-colors mr-1">
              <Plus className="w-4 h-4" /> Create
            </Link>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}
                className="p-2 hover:bg-[#272727] rounded-full transition-colors relative"
              >
                <Bell className="w-5 h-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-[#1a1a1a] border border-[#303030] rounded-xl shadow-2xl">
                  <div className="p-3 border-b border-[#303030]">
                    <h3 className="text-white font-semibold text-sm">Notifications</h3>
                  </div>
                  {notifications.length > 0 ? notifications.map(n => (
                    <Link
                      key={n.id}
                      href={n.link || '#'}
                      onClick={() => setShowNotifs(false)}
                      className={`block px-3 py-2.5 hover:bg-[#272727] transition-colors border-b border-[#222] ${!n.read ? 'bg-blue-500/5' : ''}`}
                    >
                      <p className="text-sm text-white">{n.message}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{timeAgo(n.createdAt)} ago</p>
                    </Link>
                  )) : (
                    <p className="text-gray-500 text-sm text-center py-6">No notifications</p>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <Link href="/profile" className="ml-1 w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-medium flex items-center justify-center hover:ring-2 hover:ring-purple-400 transition-all overflow-hidden">
              {session.user?.name?.charAt(0)?.toUpperCase() || '?'}
            </Link>
          </>
        ) : (
          <Link href="/login" className="flex items-center gap-1.5 text-blue-400 border border-blue-400/40 hover:bg-blue-400/10 rounded-full px-3 py-1.5 text-sm font-medium transition-colors">
            <UserCircle2 className="w-5 h-5" /> Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}

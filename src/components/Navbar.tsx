"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, Plus, Search, Video, UserCircle2, LogOut, User, ArrowLeft } from "lucide-react";
import { useSidebarInfo } from "@/store/sidebarStore";

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { isOpen: sidebarOpen, setIsOpen: setSidebarOpen } = useSidebarInfo();

  useEffect(() => {
    if (session) {
      fetch('/api/notifications').then(r => r.json()).then(setNotifications).catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowMobileSearch(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const timeAgo = (dateStr: string) => {
    const s = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (s < 60) return 'now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-[#222] bg-[#0f0f0f] px-2 pt-safe sm:px-4">
      <div className="min-w-0 flex items-center gap-1.5 sm:gap-4">
        <button
          aria-label="Toggle sidebar"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-full p-2 transition-colors hover:bg-[#272727]"
        >
          <Menu className="h-5 w-5 text-white" />
        </button>
        <Link href="/" className="min-w-0 flex items-center gap-1 sm:gap-2">
          <div className="rounded-lg bg-red-600 p-1 text-white">
            <Video className="h-5 w-5 fill-current" />
          </div>
          <span className="hidden text-lg font-bold tracking-tighter text-white sm:inline md:text-xl">MyTube</span>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mx-4 hidden max-w-[540px] flex-1 md:flex">
        <div className="flex w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-l-full border border-[#303030] bg-[#121212] px-4 py-2 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-blue-500"
          />
          <button type="submit" aria-label="Search" className="rounded-r-full border border-[#303030] border-l-0 bg-[#222] px-5 transition-colors hover:bg-[#303030]">
            <Search className="h-5 w-5 text-white" />
          </button>
        </div>
      </form>

      <div className="flex items-center gap-0.5 sm:gap-1.5">
        <button
          aria-label="Open search"
          onClick={() => setShowMobileSearch(true)}
          className="rounded-full p-2 text-white transition-colors hover:bg-[#272727] md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>

        {session ? (
          <>
            <Link href="/upload" className="mr-0.5 flex items-center gap-1 rounded-full bg-[#222] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#303030] sm:gap-1.5 sm:px-3 sm:text-sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create</span>
            </Link>

            <div className="relative" ref={notifRef}>
              <button
                aria-label="Notifications"
                onClick={() => {
                  setShowNotifs(!showNotifs);
                  if (!showNotifs) markAllRead();
                }}
                className="relative rounded-full p-2 transition-colors hover:bg-[#272727]"
              >
                <Bell className="h-5 w-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-full mt-2 max-h-96 w-[min(22rem,calc(100vw-1rem))] overflow-y-auto rounded-xl border border-[#303030] bg-[#1a1a1a] shadow-2xl">
                  <div className="border-b border-[#303030] p-3">
                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  </div>
                  {notifications.length > 0 ? notifications.map(n => (
                    <Link
                      key={n.id}
                      href={n.link || '#'}
                      onClick={() => setShowNotifs(false)}
                      className={`block border-b border-[#222] px-3 py-2.5 transition-colors hover:bg-[#272727] ${!n.read ? 'bg-blue-500/5' : ''}`}
                    >
                      <p className="text-sm text-white">{n.message}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{timeAgo(n.createdAt)} ago</p>
                    </Link>
                  )) : (
                    <p className="py-6 text-center text-sm text-gray-500">No notifications</p>
                  )}
                </div>
              )}
            </div>

            <div className="relative" ref={userMenuRef}>
              <button
                aria-label="User menu"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="ml-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-purple-600 text-sm font-medium text-white transition-all hover:ring-2 hover:ring-purple-400"
              >
                {session.user?.image ? (
                  <img src={session.user.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  session.user?.name?.charAt(0)?.toUpperCase() || '?'
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 w-[min(16rem,calc(100vw-1rem))] rounded-xl border border-[#303030] bg-[#1a1a1a] py-2 shadow-2xl">
                  <div className="flex items-center gap-3 border-b border-[#303030] px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-purple-600 text-white">
                      {session.user?.image ? (
                        <img src={session.user.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        session.user?.name?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{session.user?.name || 'User'}</p>
                      <p className="truncate text-xs text-gray-400">{session.user?.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="mt-1 flex items-center gap-3 px-4 py-2.5 text-sm text-white transition-colors hover:bg-[#272727]"
                  >
                    <User className="h-4 w-4" /> Your profile
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white transition-colors hover:bg-[#272727]"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link href="/login" className="flex items-center gap-1.5 rounded-full border border-blue-400/40 px-2.5 py-1.5 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-400/10 sm:px-3">
            <UserCircle2 className="h-5 w-5" />
            <span className="hidden sm:inline">Sign in</span>
          </Link>
        )}
      </div>

      {showMobileSearch && (
        <div className="absolute inset-0 z-50 flex items-center bg-[#0f0f0f] px-2 md:hidden">
          <button
            aria-label="Close search"
            onClick={() => setShowMobileSearch(false)}
            className="mr-2 shrink-0 rounded-full p-2 text-white transition-colors hover:bg-[#272727]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <form onSubmit={handleSearch} className="flex w-full flex-1">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-l-full border border-[#303030] bg-[#121212] px-4 py-2 text-white outline-none transition-colors placeholder:text-gray-500 focus:border-blue-500"
            />
            <button type="submit" aria-label="Search" className="shrink-0 rounded-r-full border border-[#303030] border-l-0 bg-[#222] px-4 transition-colors hover:bg-[#303030]">
              <Search className="h-4 w-4 text-white" />
            </button>
          </form>
        </div>
      )}
    </nav>
  );
}
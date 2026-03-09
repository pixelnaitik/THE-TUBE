"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Bell, Menu, Plus, Search, Video, UserCircle2, LogOut, User, ArrowLeft } from "lucide-react";
import { useSidebarInfo } from "@/store/sidebarStore";
import UserAvatar from "@/components/UserAvatar";

const ThemeToggle = dynamic(() => import("@/components/ThemeToggle"), {
  ssr: false,
  loading: () => (
    <button aria-label="Toggle theme" className="glass-pill rounded-full p-2.5 text-[var(--foreground)]">
      <span className="block h-5 w-5" />
    </button>
  ),
});

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
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
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      return;
    }

    const timer = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(data => setSuggestions(data.suggestions || []))
        .catch(() => setSuggestions([]));
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowMobileSearch(false);
      setShowSuggestions(false);
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

  const visibleSuggestions = searchQuery.trim().length < 2 ? [] : suggestions;

  const applySuggestion = (text: string) => {
    setSearchQuery(text);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(text)}`);
  };

  return (
    <nav className="glass-nav fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-2 pt-safe sm:px-4">
      <div className="min-w-0 flex items-center gap-1 sm:gap-3">
        <button
          aria-label="Toggle sidebar"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-full p-2.5 text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]/70"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="min-w-0 flex items-center gap-2">
          <div className="rounded-xl bg-red-600 p-1 text-white shadow-lg shadow-red-600/30">
            <Video className="h-5 w-5 fill-current" />
          </div>
          <span className="hidden text-lg font-bold tracking-tight text-[var(--foreground)] sm:inline md:text-xl">MyTube</span>
        </Link>
      </div>

      <div className="mx-4 hidden max-w-[560px] flex-1 md:block" ref={searchRef}>
        <form onSubmit={handleSearch} className="relative">
          <div className="flex w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search videos"
              className="glass-input w-full rounded-l-full px-4 py-2 outline-none placeholder:text-muted focus:border-blue-400"
            />
            <button type="submit" aria-label="Search" className="glass-input rounded-r-full border-l-0 px-5 transition-colors hover:bg-[var(--surface-3)]/80">
              <Search className="h-5 w-5 text-[var(--foreground)]" />
            </button>
          </div>
          {showSuggestions && visibleSuggestions.length > 0 && (
            <div className="glass-panel absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 overflow-hidden rounded-xl p-1">
              {visibleSuggestions.map((s) => (
                <button key={s} type="button" onClick={() => applySuggestion(s)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--surface-2)]/70">
                  <Search className="h-4 w-4 text-muted" /> {s}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />

        <button
          aria-label="Open search"
          onClick={() => setShowMobileSearch(true)}
          className="rounded-full p-2.5 text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]/70 md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>

        {session ? (
          <>
            <Link href="/upload" className="glass-pill mr-1 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-3)]/70 sm:text-sm">
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
                className="relative rounded-full p-2.5 transition-colors hover:bg-[var(--surface-2)]/70"
              >
                <Bell className="h-5 w-5 text-[var(--foreground)]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="glass-panel absolute right-0 top-full z-50 mt-2 max-h-96 w-[min(22rem,calc(100vw-1rem))] overflow-y-auto rounded-xl">
                  <div className="border-b border-[var(--glass-border)] p-3">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Notifications</h3>
                  </div>
                  {notifications.length > 0 ? notifications.map(n => (
                    <Link
                      key={n.id}
                      href={n.link || '#'}
                      onClick={() => setShowNotifs(false)}
                      className={`block border-b border-[var(--glass-border)] px-3 py-2.5 transition-colors hover:bg-[var(--surface-2)]/60 ${!n.read ? 'bg-blue-500/8' : ''}`}
                    >
                      <p className="text-sm text-[var(--foreground)]">{n.message}</p>
                      <p className="mt-0.5 text-xs text-muted">{timeAgo(n.createdAt)} ago</p>
                    </Link>
                  )) : (
                    <p className="py-6 text-center text-sm text-muted">No notifications</p>
                  )}
                </div>
              )}
            </div>

            <div className="relative" ref={userMenuRef}>
              <button
                aria-label="User menu"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="ml-1 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-indigo-600 text-sm font-semibold text-white transition-all hover:ring-2 hover:ring-blue-300/50"
              >
                <UserAvatar src={session.user?.image} alt="Your avatar" sizeClassName="h-9 w-9" />
              </button>

              {showUserMenu && (
                <div className="glass-panel absolute right-0 top-full z-50 mt-2 w-[min(16rem,calc(100vw-1rem))] rounded-xl py-2">
                  <div className="flex items-center gap-3 border-b border-[var(--glass-border)] px-4 py-3">
                    <UserAvatar src={session.user?.image} alt="Your avatar" sizeClassName="h-10 w-10" className="shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">{session.user?.name || 'User'}</p>
                      <p className="truncate text-xs text-muted">{session.user?.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="mt-1 flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]/60"
                  >
                    <User className="h-4 w-4" /> Your profile
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]/60"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link href="/login" className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-[var(--accent-strong)] transition-colors hover:bg-[var(--surface-3)]/70">
            <UserCircle2 className="h-5 w-5" />
            <span className="hidden sm:inline">Sign in</span>
          </Link>
        )}
      </div>

      {showMobileSearch && (
        <div className="glass-nav absolute inset-0 z-50 flex items-center px-2 md:hidden" ref={searchRef}>
          <button
            aria-label="Close search"
            onClick={() => setShowMobileSearch(false)}
            className="mr-2 shrink-0 rounded-full p-2.5 text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]/70"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <form onSubmit={handleSearch} className="relative flex w-full flex-1">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              placeholder="Search"
              className="glass-input w-full rounded-l-full px-4 py-2 outline-none placeholder:text-muted focus:border-blue-400"
            />
            <button type="submit" aria-label="Search" className="glass-input shrink-0 rounded-r-full border-l-0 px-4 transition-colors hover:bg-[var(--surface-3)]/80">
              <Search className="h-4 w-4 text-[var(--foreground)]" />
            </button>
            {showSuggestions && visibleSuggestions.length > 0 && (
              <div className="glass-panel absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 overflow-hidden rounded-xl p-1">
                {visibleSuggestions.map((s) => (
                  <button key={s} type="button" onClick={() => applySuggestion(s)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--surface-2)]/70">
                    <Search className="h-4 w-4 text-muted" /> {s}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      )}
    </nav>
  );
}


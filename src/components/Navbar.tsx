"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, Mic, Plus, Search, Video, UserCircle2 } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
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
        <button type="button" className="ml-3 p-2.5 bg-[#222] rounded-full hover:bg-[#303030] transition-colors">
          <Mic className="w-5 h-5 text-white" />
        </button>
      </form>

      {/* Right */}
      <div className="flex items-center gap-1">
        {session ? (
          <>
            <Link href="/upload" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#303030] rounded-full text-white text-sm font-medium transition-colors mr-1">
              <Plus className="w-4 h-4" /> Create
            </Link>
            <button className="p-2 hover:bg-[#272727] rounded-full transition-colors">
              <Bell className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => signOut()}
              className="ml-1 w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-medium flex items-center justify-center hover:ring-2 hover:ring-purple-400 transition-all"
            >
              {session.user?.name?.charAt(0)?.toUpperCase() || session.user?.email?.charAt(0)?.toUpperCase() || '?'}
            </button>
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

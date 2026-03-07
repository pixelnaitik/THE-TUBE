"use client";

import React from 'react';
import { Menu, Search, Mic, Bell, User, Video, PlusSquare, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-[#0f0f0f] flex items-center justify-between px-4 z-50 text-white">
      {/* Left section: Menu & Logo */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-[#272727] rounded-full transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <Link href="/" className="flex items-center gap-1">
          <div className="bg-red-600 text-white p-1 rounded-lg">
            <Video className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-semibold tracking-tighter">MyTube</span>
        </Link>
      </div>

      {/* Middle section: Search */}
      <div className="flex items-center flex-1 max-w-2xl px-8">
        <div className="flex w-full items-center">
          <div className="flex w-full bg-[#121212] border border-[#303030] rounded-l-full overflow-hidden px-4 items-center focus-within:border-blue-500 ml-8">
            <Search className="w-4 h-4 text-gray-400 hidden sm:block mr-2" />
            <input 
              type="text" 
              placeholder="Search" 
              className="w-full bg-transparent outline-none py-2 text-white placeholder-gray-400"
            />
          </div>
          <button className="bg-[#222222] border border-l-0 border-[#303030] rounded-r-full px-5 py-2 hover:bg-[#303030] transition-colors">
            <Search className="w-5 h-5 text-gray-200" />
          </button>
        </div>
        <button className="ml-4 p-3 bg-[#181818] hover:bg-[#303030] rounded-full transition-colors">
          <Mic className="w-5 h-5" />
        </button>
      </div>

      {/* Right section: Icons */}
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-[#272727] rounded-full sm:hidden">
          <Search className="w-6 h-6" />
        </button>
        {session ? (
          <>
            <Link href="/upload" className="flex items-center gap-2 p-2 hover:bg-[#272727] rounded-full transition-colors text-gray-200">
              <PlusSquare className="w-6 h-6" />
              <span className="hidden md:inline text-sm font-medium mr-2">Create</span>
            </Link>
            <button className="p-2 hover:bg-[#272727] rounded-full">
              <Bell className="w-6 h-6" />
            </button>
            <button onClick={() => signOut()} className="flex items-center gap-2 p-2 pr-4 bg-[#222] hover:bg-[#303030] border border-[#303030] rounded-full transition-colors">
              <LogOut className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </>
        ) : (
          <Link href="/login" className="flex items-center gap-2 border border-[#3ea6ff] text-[#3ea6ff] px-4 py-1.5 rounded-full hover:bg-[#263850] transition-colors">
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">Sign in</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

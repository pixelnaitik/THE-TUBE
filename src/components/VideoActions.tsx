"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Share2, MoreHorizontal, Pencil, Trash2, PictureInPicture2, Check, X } from "lucide-react";

interface VideoActionsProps {
  videoId: string;
  authorId: string;
  title: string;
  description: string;
  tags: string;
}

export default function VideoActions({ videoId, authorId, title, description, tags }: VideoActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDesc, setEditDesc] = useState(description);
  const [editTags, setEditTags] = useState(tags);
  const [copied, setCopied] = useState(false);

  const isAuthor = session?.user?.email; // We'll check on server side

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    const res = await fetch(`/api/videos/${videoId}`, { method: 'DELETE' });
    if (res.ok) router.push('/');
  };

  const handleSaveEdit = async () => {
    await fetch(`/api/videos/${videoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, description: editDesc, tags: editTags })
    });
    setEditing(false);
    router.refresh();
  };

  return (
    <>
      {/* Share Button */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 bg-[#222222] hover:bg-[#303030] rounded-full text-white text-sm transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Share'}
      </button>

      {/* More Menu */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 bg-[#222222] hover:bg-[#303030] rounded-full text-white transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-[#303030] rounded-xl overflow-hidden shadow-2xl z-10">
            <button
              onClick={() => { setEditing(true); setShowMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#272727] text-white text-sm transition-colors"
            >
              <Pencil className="w-4 h-4" /> Edit video
            </button>
            <button
              onClick={() => { handleDelete(); setShowMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#272727] text-red-400 text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete video
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-lg border border-[#303030]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Edit Video</h3>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <label className="text-sm text-gray-400 block mb-1">Title</label>
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white mb-3 outline-none focus:border-blue-500"
            />
            <label className="text-sm text-gray-400 block mb-1">Description</label>
            <textarea
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={3}
              className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white mb-3 outline-none focus:border-blue-500 resize-none"
            />
            <label className="text-sm text-gray-400 block mb-1">Tags (comma-separated)</label>
            <input
              value={editTags}
              onChange={e => setEditTags(e.target.value)}
              placeholder="Gaming, Music, Vlog"
              className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white mb-4 outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

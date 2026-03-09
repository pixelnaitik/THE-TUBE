"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Share2, MoreHorizontal, Pencil, Trash2, Check, X, Bookmark, BookmarkCheck, PlusCircle } from "lucide-react";
import toast from "react-hot-toast";
import PlaylistModal from "./PlaylistModal";

interface VideoActionsProps {
  videoId: string;
  authorId: string;
  title: string;
  description: string;
  tags: string;
}

export default function VideoActions({ videoId, title, description, tags }: VideoActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDesc, setEditDesc] = useState(description);
  const [editTags, setEditTags] = useState(tags);
  const [copied, setCopied] = useState(false);
  const [savedToWatchLater, setSavedToWatchLater] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  const isAuthor = session?.user?.email;

  useEffect(() => {
    if (session) {
      fetch('/api/watch-later')
        .then(res => res.json())
        .then(data => {
          if (data.watchLaterList?.includes(videoId)) {
            setSavedToWatchLater(true);
          }
        });
    }
  }, [session, videoId]);

  const handleToggleWatchLater = async () => {
    if (!session) {
      toast.error('Sign in to save videos');
      return router.push('/login');
    }

    setSavedToWatchLater(!savedToWatchLater);
    const prev = savedToWatchLater;

    try {
      const res = await fetch('/api/watch-later', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId })
      });
      const data = await res.json();
      setSavedToWatchLater(data.watchLater);
      toast.success(data.watchLater ? 'Saved to Watch Later' : 'Removed from Watch Later');
    } catch {
      setSavedToWatchLater(prev);
      toast.error('Failed to update Watch Later');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    const toastId = toast.loading('Deleting video...');
    const res = await fetch(`/api/videos/${videoId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Video deleted', { id: toastId });
      router.push('/');
    } else {
      toast.error('Failed to delete video', { id: toastId });
    }
  };

  const handleSaveEdit = async () => {
    const toastId = toast.loading('Saving changes...');
    try {
      await fetch(`/api/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, description: editDesc, tags: editTags })
      });
      setEditing(false);
      toast.success('Changes saved', { id: toastId });
      router.refresh();
    } catch {
      toast.error('Failed to save changes', { id: toastId });
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleToggleWatchLater}
          className={`glass-pill flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            savedToWatchLater ? 'bg-[var(--accent-soft)] text-blue-200' : 'text-[var(--foreground)] hover:bg-[var(--surface-3)]/70'
          }`}
        >
          {savedToWatchLater ? <BookmarkCheck className="h-4 w-4 fill-current" /> : <Bookmark className="h-4 w-4" />}
          {savedToWatchLater ? 'Saved' : 'Save'}
        </button>

        <button
          onClick={handleShare}
          className="glass-pill flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-3)]/70"
        >
          {copied ? <Check className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
          Share
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="glass-pill rounded-full p-2 text-[var(--foreground)] transition-colors hover:bg-[var(--surface-3)]/70"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          {showMenu && (
            <div className="glass-panel absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl">
              <button
                onClick={() => { setShowPlaylistModal(true); setShowMenu(false); }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]/70"
              >
                <PlusCircle className="h-4 w-4" /> Save to playlist
              </button>

              {isAuthor && (
                <>
                  <div className="border-t border-[var(--glass-border)]" />
                  <button
                    onClick={() => { setEditing(true); setShowMenu(false); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]/70"
                  >
                    <Pencil className="h-4 w-4" /> Edit video
                  </button>
                  <button
                    onClick={() => { handleDelete(); setShowMenu(false); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-300 transition-colors hover:bg-[var(--surface-2)]/70"
                  >
                    <Trash2 className="h-4 w-4" /> Delete video
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showPlaylistModal && <PlaylistModal videoId={videoId} onClose={() => setShowPlaylistModal(false)} />}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="glass-panel w-full max-w-lg rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Edit Video</h3>
              <button onClick={() => setEditing(false)} className="text-muted hover:text-[var(--foreground)]"><X className="h-5 w-5" /></button>
            </div>
            <label className="mb-1 block text-sm text-muted">Title</label>
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="glass-input mb-3 w-full rounded-lg px-3 py-2 outline-none focus:border-blue-400"
            />
            <label className="mb-1 block text-sm text-muted">Description</label>
            <textarea
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={3}
              className="glass-input mb-3 w-full resize-none rounded-lg px-3 py-2 outline-none focus:border-blue-400"
            />
            <label className="mb-1 block text-sm text-muted">Tags (comma-separated)</label>
            <input
              value={editTags}
              onChange={e => setEditTags(e.target.value)}
              placeholder="Gaming, Music, Vlog"
              className="glass-input mb-4 w-full rounded-lg px-3 py-2 outline-none focus:border-blue-400"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-muted hover:text-[var(--foreground)]">Cancel</button>
              <button onClick={handleSaveEdit} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

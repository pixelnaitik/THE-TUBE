"use client";

import { useState, useEffect } from "react";
import { X, Plus, Check } from "lucide-react";
import toast from "react-hot-toast";

interface Playlist {
  id: string;
  name: string;
  _count: { videos: number };
  videos: { video: { id: string } }[];
}

interface PlaylistModalProps {
  videoId: string;
  onClose: () => void;
}

export default function PlaylistModal({ videoId, onClose }: PlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/playlists");
      if (res.ok) setPlaylists(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleToggleVideo = async (playlistId: string, currentlyHas: boolean) => {
    // Optimistic UI
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return {
          ...p,
          videos: currentlyHas ? [] : [{ video: { id: videoId } }] // Mock truthy state for UI
        };
      }
      return p;
    }));

    try {
      const res = await fetch("/api/playlists/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId, videoId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      toast.success(data.added ? 'Added to playlist' : 'Removed from playlist');
    } catch {
      toast.error('Failed to update playlist');
      fetchPlaylists(); // Revert on error
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlaylistName })
      });
      
      if (res.ok) {
        const newPlaylist = await res.json();
        setNewPlaylistName("");
        setCreating(false);
        // Automatically add the video to the newly created playlist
        await handleToggleVideo(newPlaylist.id, false);
        fetchPlaylists();
      }
    } catch {
      toast.error("Failed to create playlist");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
      <div className="bg-[#222] rounded-xl w-full max-w-sm border border-[#303030] overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-[#303030]">
          <h3 className="text-lg font-semibold text-white">Save to playlist</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-[#303030]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : playlists.length > 0 ? (
            <div className="flex flex-col gap-1">
              {playlists.map(p => {
                const hasVideo = p.videos?.some(v => v.video.id === videoId);
                return (
                  <label key={p.id} className="flex items-center gap-3 p-3 hover:bg-[#303030] rounded-lg cursor-pointer transition-colors">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${hasVideo ? 'bg-blue-600 border-blue-600' : 'border-gray-500'}`}>
                      {hasVideo && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-white text-sm">{p.name}</span>
                  </label>
                );
              })}
            </div>
          ) : (
             <p className="text-gray-400 text-sm text-center py-6">No playlists yet.</p>
          )}

          {/* Create new playlist toggle is below */}
        </div>
        
        <div className="p-4 border-t border-[#303030]">
          {creating ? (
            <form onSubmit={handleCreatePlaylist} className="flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Name"
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                maxLength={150}
                className="w-full bg-transparent border-b border-blue-500 text-white text-sm py-1 outline-none"
              />
              <div className="flex justify-end gap-2 mt-1">
                <button type="button" onClick={() => setCreating(false)} className="text-sm font-medium text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={!newPlaylistName.trim()} className="text-sm font-medium text-blue-500 hover:text-blue-400 disabled:opacity-50">Create</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setCreating(true)} className="flex items-center gap-2 text-white font-medium text-sm hover:bg-[#303030] w-full p-2.5 rounded-lg transition-colors">
              <Plus className="w-5 h-5" /> Create new playlist
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

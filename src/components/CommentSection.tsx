"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, Send, UserCircle2 } from "lucide-react";

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

interface CommentSectionProps {
  videoId: string;
}

export default function CommentSection({ videoId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/videos/${videoId}/comment`)
      .then(r => r.json())
      .then(setComments);
  }, [videoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session) return;

    setLoading(true);
    const res = await fetch(`/api/videos/${videoId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newComment })
    });

    if (res.ok) {
      const comment = await res.json();
      setComments([comment, ...comments]);
      setNewComment("");
    }
    setLoading(false);
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        {comments.length} Comments
      </h3>

      {/* Add Comment */}
      {session ? (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
            <UserCircle2 className="w-7 h-7" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-transparent border-b border-[#303030] focus:border-blue-500 outline-none py-2 text-white placeholder-gray-500 transition-colors"
            />
            {newComment.trim() && (
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setNewComment("")} className="px-4 py-1.5 text-sm text-gray-400 hover:text-white rounded-full transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium flex items-center gap-1 transition-colors disabled:opacity-50">
                  <Send className="w-3.5 h-3.5" /> Comment
                </button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <p className="text-gray-500 text-sm mb-6">
          <a href="/login" className="text-blue-500 hover:underline">Sign in</a> to leave a comment.
        </p>
      )}

      {/* Comments List */}
      <div className="flex flex-col gap-4">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3 group">
            <div className="w-10 h-10 rounded-full bg-[#303030] flex items-center justify-center shrink-0 overflow-hidden">
              {comment.user.image ? (
                <img src={comment.user.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 className="w-7 h-7 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{comment.user.name || 'Anonymous'}</span>
                <span className="text-xs text-gray-500">{timeAgo(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-300 mt-0.5">{comment.text}</p>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">No comments yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}

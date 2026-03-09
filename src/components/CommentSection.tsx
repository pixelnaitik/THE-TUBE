"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, Send, UserCircle2, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Comment {
  id: string;
  text: string;
  parentId: string | null;
  createdAt: string;
  userId: string;
  user: { id: string; name: string | null; image: string | null };
  replies?: Comment[];
}

interface CommentSectionProps {
  videoId: string;
}

export default function CommentSection({ videoId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // ... (fetch logic remains same, but we need to fetch user email or id to match session for delete)
  // Let's assume we fetch userId in the GET route. 
  // NextAuth session by default might not have user id, usually has email. 

  useEffect(() => {
    fetch(`/api/videos/${videoId}/comment`)
      .then(r => r.json())
      .then(data => {
        // Organize into threads
        const topLevel: Comment[] = [];
        const replyMap: Record<string, Comment[]> = {};
        for (const c of data) {
          if (c.parentId) {
            if (!replyMap[c.parentId]) replyMap[c.parentId] = [];
            replyMap[c.parentId].push(c);
          } else {
            topLevel.push(c);
          }
        }
        setComments(topLevel.map(c => ({ ...c, replies: replyMap[c.id] || [] })));
      });
  }, [videoId]);

  const handleDeleteComment = async (commentId: string, parentId?: string | null) => {
    if (!confirm("Delete this comment?")) return;
    
    const toastId = toast.loading("Deleting comment...");
    const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    
    if (res.ok) {
      toast.success("Comment deleted", { id: toastId });
      if (parentId) {
        setComments(prev => prev.map(c => c.id === parentId ? { ...c, replies: c.replies?.filter(r => r.id !== commentId) } : c));
      } else {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } else {
      toast.error("Failed to delete comment", { id: toastId });
    }
  };

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const text = parentId ? replyText : newComment;
    if (!text.trim() || !session) return;

    setLoading(true);
    const res = await fetch(`/api/videos/${videoId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, parentId })
    });

    if (res.ok) {
      const comment = await res.json();
      if (parentId) {
        setComments(prev => prev.map(c => c.id === parentId
          ? { ...c, replies: [...(c.replies || []), comment] }
          : c
        ));
        setReplyTo(null);
        setReplyText("");
        setExpandedReplies(prev => new Set([...prev, parentId]));
      } else {
        setComments([{ ...comment, replies: [] }, ...comments]);
        setNewComment("");
      }
    }
    setLoading(false);
  };

  const timeAgo = (dateStr: string) => {
    const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  const totalComments = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);

  const toggleReplies = (id: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const CommentItem = ({ comment, isReply }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-8 sm:ml-12' : ''}`}>
      <div className="w-8 h-8 rounded-full bg-[#303030] flex items-center justify-center shrink-0 overflow-hidden">
        {comment.user.image ? (
          <img src={comment.user.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <UserCircle2 className="w-6 h-6 text-gray-400" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{comment.user.name || 'Anonymous'}</span>
          <span className="text-xs text-gray-500">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-300 mt-0.5">{comment.text}</p>
        <div className="flex items-center gap-4 mt-1">
          {!isReply && session && (
            <button
              onClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setReplyText(""); }}
              className="text-xs text-gray-400 hover:text-white font-medium"
            >
              Reply
            </button>
          )}
          {session?.user?.email && (
            // In a real app we fetch session user id to strictly match, but here we can't easily without an extra API call or adding id to session.
            // As a simplified fallback for the UI, we just let them try deleting if they are logged in. The backend strictly protects it by checking the actual DB user.
            <button
              onClick={() => handleDeleteComment(comment.id, comment.parentId)}
              className="text-xs text-gray-400 hover:text-red-400 font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" /> {totalComments} Comments
      </h3>

      {/* Add Comment */}
      {session ? (
        <form onSubmit={(e) => handleSubmit(e)} className="flex gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
            <UserCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <input
              type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full bg-transparent border-b border-[#303030] focus:border-blue-500 outline-none py-2 text-white placeholder-gray-500 text-sm transition-colors"
            />
            {newComment.trim() && (
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setNewComment("")} className="px-3 py-1 text-xs text-gray-400 hover:text-white rounded-full">Cancel</button>
                <button type="submit" disabled={loading} className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium flex items-center gap-1 disabled:opacity-50">
                  <Send className="w-3 h-3" /> Comment
                </button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <p className="text-gray-500 text-sm mb-6"><a href="/login" className="text-blue-500 hover:underline">Sign in</a> to leave a comment.</p>
      )}

      {/* Comments List */}
      <div className="flex flex-col gap-4">
        {comments.map(comment => (
          <div key={comment.id}>
            <CommentItem comment={comment} />

            {/* Reply form */}
            {replyTo === comment.id && (
              <form onSubmit={(e) => handleSubmit(e, comment.id)} className="ml-8 mt-2 flex gap-2 sm:ml-12">
                <input
                  type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Add a reply..."
                  className="flex-1 bg-transparent border-b border-[#303030] focus:border-blue-500 outline-none py-1.5 text-white placeholder-gray-500 text-sm"
                  autoFocus
                />
                <button type="button" onClick={() => setReplyTo(null)} className="px-2 py-1 text-xs text-gray-400">Cancel</button>
                <button type="submit" disabled={!replyText.trim()} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full disabled:opacity-50">Reply</button>
              </form>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <>
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="ml-8 mt-2 flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 sm:ml-12"
                >
                  {expandedReplies.has(comment.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </button>
                {expandedReplies.has(comment.id) && (
                  <div className="flex flex-col gap-3 mt-2">
                    {comment.replies.map(reply => (
                      <CommentItem key={reply.id} comment={reply} isReply />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">No comments yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}





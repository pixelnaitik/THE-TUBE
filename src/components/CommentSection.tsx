"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, Send, UserCircle2, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import UserAvatar from "@/components/UserAvatar";

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

  useEffect(() => {
    fetch(`/api/videos/${videoId}/comment`)
      .then(r => r.json())
      .then(data => {
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

  const formatTimeAgo = (dateStr: string) => {
    const sec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (sec < 60) return "now";
    if (sec < 3600) return `${Math.floor(sec / 60)}m`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
    if (sec < 2592000) return `${Math.floor(sec / 86400)}d`;
    return `${Math.floor(sec / 2592000)}mo`;
  };

  const handleDeleteComment = async (commentId: string, parentId?: string | null) => {
    if (!confirm("Delete this comment?")) return;

    const toastId = toast.loading("Deleting comment...");
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });

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
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  const totalComments = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);

  const toggleReplies = (id: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const CommentItem = ({ comment, isReply }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? "ml-8 sm:ml-12" : ""}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#303030]">
        <UserAvatar src={comment.user.image} alt={comment.user.name || "User"} sizeClassName="h-8 w-8" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">{comment.user.name || "Anonymous"}</span>
          <span className="text-xs text-muted">{formatTimeAgo(comment.createdAt)}</span>
        </div>
        <p className="mt-0.5 text-sm text-[var(--foreground)]/80">{comment.text}</p>
        <div className="mt-1 flex items-center gap-4">
          {!isReply && session && (
            <button
              onClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setReplyText(""); }}
              className="text-xs font-medium text-muted hover:text-[var(--foreground)]"
            >
              Reply
            </button>
          )}
          {session?.user?.email && (
            <button
              onClick={() => handleDeleteComment(comment.id, comment.parentId)}
              className="text-xs font-medium text-muted hover:text-red-400"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="glass-panel mt-6 rounded-2xl p-4 sm:p-5">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
        <MessageCircle className="h-5 w-5" /> {totalComments} Comments
      </h3>

      {session ? (
        <form onSubmit={(e) => handleSubmit(e)} className="mb-6 flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">
            <UserCircle2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full border-b border-[var(--glass-border)] bg-transparent py-2 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-muted focus:border-blue-500"
            />
            {newComment.trim() && (
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setNewComment("")} className="rounded-full px-3 py-1 text-xs text-muted hover:text-[var(--foreground)]">Cancel</button>
                <button type="submit" disabled={loading} className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
                  <Send className="mr-1 inline h-3 w-3" /> Comment
                </button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <p className="mb-6 text-sm text-muted"><a href="/login" className="text-blue-500 hover:underline">Sign in</a> to leave a comment.</p>
      )}

      <div className="flex flex-col gap-4">
        {comments.map(comment => (
          <div key={comment.id}>
            <CommentItem comment={comment} />

            {replyTo === comment.id && (
              <form onSubmit={(e) => handleSubmit(e, comment.id)} className="ml-8 mt-2 flex gap-2 sm:ml-12">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Add a reply..."
                  className="flex-1 border-b border-[var(--glass-border)] bg-transparent py-1.5 text-sm text-[var(--foreground)] outline-none placeholder:text-muted focus:border-blue-500"
                  autoFocus
                />
                <button type="button" onClick={() => setReplyTo(null)} className="px-2 py-1 text-xs text-muted">Cancel</button>
                <button type="submit" disabled={!replyText.trim()} className="rounded-full bg-blue-600 px-3 py-1 text-xs text-white disabled:opacity-50">Reply</button>
              </form>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <>
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="ml-8 mt-2 flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 sm:ml-12"
                >
                  {expandedReplies.has(comment.id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                </button>
                {expandedReplies.has(comment.id) && (
                  <div className="mt-2 flex flex-col gap-3">
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
          <p className="py-6 text-center text-sm text-muted">No comments yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}

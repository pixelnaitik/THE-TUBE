"use client";

import { useEffect, useState } from "react";
import { ThumbsUp } from "lucide-react";
import { useSession } from "next-auth/react";

interface LikeButtonsProps {
  videoId: string;
}

export default function LikeButtons({ videoId }: LikeButtonsProps) {
  const { data: session } = useSession();
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userReaction, setUserReaction] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/videos/${videoId}/like`)
      .then(r => r.json())
      .then(data => {
        setLikes(data.likes);
        setDislikes(data.dislikes);
        setUserReaction(data.userReaction);
      });
  }, [videoId]);

  const handleReaction = async (type: "LIKE" | "DISLIKE") => {
    if (!session) {
      window.location.href = '/login';
      return;
    }

    const res = await fetch(`/api/videos/${videoId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    const data = await res.json();

    if (data.action === 'added') {
      if (type === 'LIKE') setLikes(l => l + 1);
      else setDislikes(d => d + 1);
      setUserReaction(type);
    } else if (data.action === 'removed') {
      if (type === 'LIKE') setLikes(l => l - 1);
      else setDislikes(d => d - 1);
      setUserReaction(null);
    } else if (data.action === 'switched') {
      if (type === 'LIKE') {
        setLikes(l => l + 1);
        setDislikes(d => d - 1);
      } else {
        setDislikes(d => d + 1);
        setLikes(l => l - 1);
      }
      setUserReaction(type);
    }
  };

  return (
    <div className="overflow-hidden rounded-full border border-[var(--line)] bg-[var(--surface-2)]">
      <button
        onClick={() => handleReaction('LIKE')}
        className={`flex items-center gap-2 border-r border-[var(--line)] px-4 py-2 text-sm font-semibold transition-colors ${
          userReaction === 'LIKE' ? 'bg-[var(--accent-soft)] text-blue-200' : 'text-white hover:bg-[var(--surface-3)]'
        }`}
      >
        <ThumbsUp className={`h-4 w-4 ${userReaction === 'LIKE' ? 'fill-current' : ''}`} />
        <span>{likes || ''}</span>
      </button>
      <button
        onClick={() => handleReaction('DISLIKE')}
        className={`px-4 py-2 transition-colors ${
          userReaction === 'DISLIKE' ? 'bg-red-500/20 text-red-300' : 'text-white hover:bg-[var(--surface-3)]'
        }`}
      >
        <ThumbsUp className={`h-4 w-4 rotate-180 ${userReaction === 'DISLIKE' ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
}
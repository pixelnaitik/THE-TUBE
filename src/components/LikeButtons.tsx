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

    // Optimistic update based on action
    if (data.action === 'added') {
      if (type === 'LIKE') setLikes(l => l + 1);
      else setDislikes(d => d + 1);
      setUserReaction(type);
    } else if (data.action === 'removed') {
      if (type === 'LIKE') setLikes(l => l - 1);
      else setDislikes(d => d - 1);
      setUserReaction(null);
    } else if (data.action === 'switched') {
      if (type === 'LIKE') { setLikes(l => l + 1); setDislikes(d => d - 1); }
      else { setDislikes(d => d + 1); setLikes(l => l - 1); }
      setUserReaction(type);
    }
  };

  return (
    <div className="flex items-center bg-[#222222] rounded-full">
      <button
        onClick={() => handleReaction('LIKE')}
        className={`flex items-center gap-2 px-4 py-2 rounded-l-full transition-colors border-r border-[#303030] ${userReaction === 'LIKE' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-[#303030]'}`}
      >
        <ThumbsUp className={`w-5 h-5 ${userReaction === 'LIKE' ? 'fill-current' : ''}`} />
        <span className="text-sm font-medium">{likes || ''}</span>
      </button>
      <button
        onClick={() => handleReaction('DISLIKE')}
        className={`px-4 py-2 rounded-r-full transition-colors ${userReaction === 'DISLIKE' ? 'bg-red-500/20 text-red-400' : 'hover:bg-[#303030]'}`}
      >
        <ThumbsUp className={`w-5 h-5 rotate-180 ${userReaction === 'DISLIKE' ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
}

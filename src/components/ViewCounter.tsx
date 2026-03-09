"use client";

import { useEffect, useRef } from "react";

export default function ViewCounter({ videoId }: { videoId: string }) {
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current) return;

    // Check if this video was already viewed in this browser session
    const viewedKey = `viewed_${videoId}`;
    if (sessionStorage.getItem(viewedKey)) return;

    // Wait 5 seconds before counting a view (prevents refresh spam)
    const timer = setTimeout(() => {
      if (counted.current) return;
      counted.current = true;
      sessionStorage.setItem(viewedKey, '1');
      fetch(`/api/videos/${videoId}/view`, { method: 'POST' });
    }, 5000);

    return () => clearTimeout(timer);
  }, [videoId]);

  return null;
}

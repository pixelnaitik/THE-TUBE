"use client";

import { useEffect } from "react";

export default function ViewCounter({ videoId }: { videoId: string }) {
  useEffect(() => {
    // Fire once on mount to increment view
    fetch(`/api/videos/${videoId}/view`, { method: 'POST' });
  }, [videoId]);

  return null; // Invisible component — just tracks the view
}

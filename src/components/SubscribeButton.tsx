"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function SubscribeButton({ channelId }: { channelId: string }) {
  const { data: session } = useSession();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetch(`/api/subscribe/status?channelId=${channelId}`)
        .then(r => r.json())
        .then(d => setSubscribed(d.subscribed))
        .catch(() => {});
    }
  }, [session, channelId]);

  const toggle = async () => {
    if (!session) { window.location.href = '/login'; return; }
    setLoading(true);
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId })
    });
    const data = await res.json();
    setSubscribed(data.subscribed);
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
        subscribed
          ? 'bg-[#303030] text-white hover:bg-[#404040]'
          : 'bg-white text-black hover:bg-gray-200'
      }`}
    >
      {subscribed ? 'Subscribed' : 'Subscribe'}
    </button>
  );
}

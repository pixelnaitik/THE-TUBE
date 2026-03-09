"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, Clock3, Loader2, TriangleAlert } from "lucide-react";

interface VideoStatus {
  id: string;
  title: string;
  status: string;
  scheduledFor?: string | null;
}

export default function UploadStatusPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [video, setVideo] = useState<VideoStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    let stop = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/videos/${id}`);
        if (!res.ok) throw new Error("Failed to fetch status");
        const data = await res.json();
        if (!stop) setVideo(data);
      } catch {
        if (!stop) setError("Could not fetch video status.");
      }
    };

    poll();
    const timer = setInterval(poll, 3000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [id]);

  const statusUi = useMemo(() => {
    switch (video?.status) {
      case "READY":
        return { icon: CheckCircle2, color: "text-green-500", label: "Published", hint: "Your video is now live." };
      case "SCHEDULED":
        return {
          icon: Clock3,
          color: "text-amber-500",
          label: "Scheduled",
          hint: video?.scheduledFor ? `Will publish on ${new Date(video.scheduledFor).toLocaleString()}` : "Waiting for schedule time."
        };
      case "DRAFT":
        return { icon: Clock3, color: "text-sky-500", label: "Draft", hint: "Saved as draft. Publish from creator tools later." };
      case "FAILED":
        return { icon: TriangleAlert, color: "text-red-500", label: "Processing failed", hint: "Try re-uploading or reprocess from dashboard." };
      default:
        return { icon: Loader2, color: "text-blue-500", label: "Processing", hint: "Generating adaptive streaming qualities and thumbnail..." };
    }
  }, [video]);

  const StatusIcon = statusUi.icon;

  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="glass-panel rounded-2xl p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <StatusIcon className={`h-7 w-7 ${statusUi.color} ${video?.status === "PROCESSING" ? "animate-spin" : ""}`} />
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">{statusUi.label}</h1>
            <p className="text-sm text-muted">{statusUi.hint}</p>
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        <div className="glass-chip mb-5 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Video</p>
          <p className="mt-1 text-base font-semibold text-[var(--foreground)]">{video?.title || "Loading..."}</p>
          <p className="mt-1 text-xs text-muted">ID: {id}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className="glass-pill rounded-full px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-3)]/70">
            Open Dashboard
          </Link>
          {video?.status === "READY" && (
            <Link href={`/watch/${id}`} className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-strong)]">
              Watch Video
            </Link>
          )}
          <Link href="/upload" className="rounded-full border border-[var(--glass-border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-2)]/70">
            Upload another
          </Link>
        </div>
      </div>
    </div>
  );
}

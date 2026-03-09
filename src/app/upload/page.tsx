"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Upload, X, FileVideo, ImagePlus, Clock3, AlertTriangle } from "lucide-react";

interface Capabilities {
  ffmpeg: boolean;
  adaptiveStreaming: boolean;
  maxUploadMb: number;
  qualities: string[];
}

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [publishMode, setPublishMode] = useState<'now' | 'draft' | 'schedule'>('now');
  const [scheduledFor, setScheduledFor] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState<string>("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    fetch('/api/system/capabilities').then(r => r.json()).then(setCapabilities).catch(() => {});
  }, []);

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.push("/login");
    }
  }, [session, status, router]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  const handleFile = (f: File) => {
    const isMkvExt = f.name.toLowerCase().endsWith('.mkv');
    if (!f.type.startsWith("video/") && !isMkvExt) {
      setError("Please select a video file");
      return;
    }
    if (f.size > 500 * 1024 * 1024) {
      setError("File too large (max 500MB)");
      return;
    }
    setFile(f);
    setError("");
    setCanRetry(false);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
  };

  const handleThumbnail = (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('Thumbnail must be an image');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Thumbnail too large (max 5MB)');
      return;
    }
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(f);
    setThumbnailPreview(URL.createObjectURL(f));
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setUploading(false);
    setEta("");
    setCanRetry(true);
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    if (publishMode === 'schedule' && !scheduledFor) {
      setError('Please choose a schedule date and time');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");
    setEta("");
    setCanRetry(false);
    const startedAt = Date.now();

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("tags", tags.trim());
    formData.append("publishMode", publishMode);
    if (publishMode === 'schedule') formData.append('scheduledFor', new Date(scheduledFor).toISOString());
    if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open('POST', '/api/upload');

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const pct = Math.round((e.loaded / e.total) * 100);
      setProgress(pct);

      const elapsedSec = (Date.now() - startedAt) / 1000;
      const bytesPerSec = e.loaded / Math.max(elapsedSec, 1);
      const remainingBytes = e.total - e.loaded;
      const etaSec = Math.ceil(remainingBytes / Math.max(bytesPerSec, 1));
      if (pct < 100) {
        const mm = Math.floor(etaSec / 60);
        const ss = etaSec % 60;
        setEta(`${mm}:${String(ss).padStart(2, '0')}`);
      } else {
        setEta('finishing...');
      }
    };

    xhr.onload = () => {
      xhrRef.current = null;
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        if (data.status === 'DRAFT') {
          router.push('/dashboard');
        } else {
          router.push(`/upload/status/${data.videoId}`);
        }
      } else {
        const data = xhr.responseText ? JSON.parse(xhr.responseText) : { error: 'Upload failed. Please try again.' };
        setError(data.error || 'Upload failed. Please try again.');
        setUploading(false);
        setCanRetry(true);
      }
    };

    xhr.onerror = () => {
      xhrRef.current = null;
      setError("Upload failed. Please try again.");
      setUploading(false);
      setCanRetry(true);
    };

    xhr.onabort = () => {
      setError('Upload cancelled.');
      setUploading(false);
    };

    xhr.send(formData);
  };

  if (status === "loading") return null;
  if (!session) return null;

  return (
    <div className="mx-auto max-w-3xl py-4 sm:py-8">
      <h1 className="mb-4 text-2xl font-bold text-[var(--foreground)] sm:mb-6">Upload Video</h1>

      {capabilities && !capabilities.ffmpeg && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>FFmpeg not available. Upload works, but adaptive quality (360p/720p/1080p) may fall back to single MP4 quality.</p>
        </div>
      )}

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`glass-panel cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors sm:p-16 ${
            dragOver ? "border-blue-500 bg-blue-500/8" : "border-[var(--glass-border)] hover:border-blue-400/60"
          }`}
        >
          <Upload className="mx-auto mb-4 h-12 w-12 text-muted" />
          <p className="font-medium text-[var(--foreground)]">Drag and drop or click to upload</p>
          <p className="mt-1 text-sm text-muted">MP4, WebM, AVI, MOV up to 500MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mkv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-panel flex items-center gap-3 rounded-lg p-3">
            <FileVideo className="h-8 w-8 text-blue-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[var(--foreground)]">{file.name}</p>
              <p className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            {!uploading && (
              <button onClick={() => setFile(null)} className="text-muted hover:text-[var(--foreground)]" aria-label="Remove file">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="glass-panel rounded-lg p-3">
            <p className="mb-2 text-sm font-medium text-[var(--foreground)]">Custom Thumbnail (optional)</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                className="glass-pill flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-[var(--foreground)]"
                disabled={uploading}
              >
                <ImagePlus className="h-4 w-4" /> Select image
              </button>
              {thumbnailPreview && (
                <img src={thumbnailPreview} alt="Thumbnail preview" className="h-16 w-28 rounded-md border border-[var(--glass-border)] object-cover" />
              )}
              {thumbnailFile && !uploading && (
                <button type="button" className="text-xs text-muted hover:text-[var(--foreground)]" onClick={() => { setThumbnailFile(null); setThumbnailPreview(''); }}>
                  Remove
                </button>
              )}
            </div>
            <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleThumbnail(e.target.files[0])} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input w-full rounded-lg px-3 py-2.5 text-[var(--foreground)] outline-none transition-colors focus:border-blue-500"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="glass-input w-full resize-none rounded-lg px-3 py-2.5 text-[var(--foreground)] outline-none transition-colors focus:border-blue-500"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted">Tags (comma-separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Gaming, Music, Vlog"
              className="glass-input w-full rounded-lg px-3 py-2.5 text-[var(--foreground)] outline-none transition-colors placeholder:text-muted focus:border-blue-500"
              disabled={uploading}
            />
          </div>

          <div className="glass-panel rounded-lg p-3">
            <p className="mb-2 text-sm font-medium text-[var(--foreground)]">Publish Options</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { key: 'now', label: 'Publish now' },
                { key: 'draft', label: 'Save draft' },
                { key: 'schedule', label: 'Schedule' },
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPublishMode(opt.key as 'now' | 'draft' | 'schedule')}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${publishMode === opt.key ? 'border-blue-500 bg-blue-500/15 text-blue-300' : 'border-[var(--glass-border)] text-[var(--foreground)] hover:bg-[var(--surface-2)]/70'}`}
                  disabled={uploading}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {publishMode === 'schedule' && (
              <div className="mt-3">
                <label className="mb-1 flex items-center gap-1 text-sm text-muted"><Clock3 className="h-4 w-4" /> Publish on</label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="glass-input w-full rounded-lg px-3 py-2.5 text-[var(--foreground)] outline-none focus:border-blue-500"
                  disabled={uploading}
                />
              </div>
            )}
          </div>

          {uploading && (
            <div>
              <div className="mb-1 flex justify-between text-sm text-muted">
                <span>Uploading...</span>
                <span>{progress}% {eta ? `(ETA ${eta})` : ''}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              {progress === 100 && (
                <p className="mt-2 text-sm text-green-500">Upload complete. Finalizing...</p>
              )}
              <button onClick={cancelUpload} className="mt-3 rounded-full border border-red-500/40 px-4 py-1.5 text-sm text-red-500 hover:bg-red-500/10">
                Cancel upload
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading || !title.trim()}
              className="flex-1 rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? `Uploading (${progress}%)...` : publishMode === 'draft' ? 'Save Draft' : publishMode === 'schedule' ? 'Schedule Video' : 'Upload Video'}
            </button>
            {canRetry && (
              <button onClick={handleUpload} className="rounded-lg border border-[var(--glass-border)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-2)]/70">
                Retry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

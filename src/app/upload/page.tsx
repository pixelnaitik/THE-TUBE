"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Upload, X, FileVideo } from "lucide-react";

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("video/")) {
      setError("Please select a video file");
      return;
    }
    if (f.size > 500 * 1024 * 1024) {
      setError("File too large (max 500MB)");
      return;
    }
    setFile(f);
    setError("");
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("tags", tags.trim());

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        router.push(`/watch/${data.videoId}`);
      } else {
        setError("Upload failed. Please try again.");
        setUploading(false);
      }
    };

    xhr.onerror = () => {
      setError("Upload failed. Please try again.");
      setUploading(false);
    };

    xhr.send(formData);
  };

  if (status === "loading") return null;
  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl py-4 sm:py-8">
      <h1 className="mb-4 text-2xl font-bold text-white sm:mb-6">Upload Video</h1>

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors sm:p-16 ${
            dragOver ? 'border-blue-500 bg-blue-500/5' : 'border-[#303030] hover:border-[#505050]'
          }`}
        >
          <Upload className="mx-auto mb-4 h-12 w-12 text-gray-500" />
          <p className="font-medium text-white">Drag and drop or click to upload</p>
          <p className="mt-1 text-sm text-gray-500">MP4, WebM, AVI, MOV up to 500MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-[#303030] bg-[#1a1a1a] p-3">
            <FileVideo className="h-8 w-8 text-blue-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            {!uploading && (
              <button onClick={() => setFile(null)} className="text-gray-400 hover:text-white" aria-label="Remove file">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[#303030] bg-[#1a1a1a] px-3 py-2.5 text-white outline-none transition-colors focus:border-blue-500"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-[#303030] bg-[#1a1a1a] px-3 py-2.5 text-white outline-none transition-colors focus:border-blue-500"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Tags (comma-separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Gaming, Music, Vlog"
              className="w-full rounded-lg border border-[#303030] bg-[#1a1a1a] px-3 py-2.5 text-white outline-none transition-colors focus:border-blue-500"
              disabled={uploading}
            />
          </div>

          {uploading && (
            <div>
              <div className="mb-1 flex justify-between text-sm text-gray-400">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#303030]">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {progress === 100 && (
                <p className="mt-2 text-sm text-green-400">Upload complete! Processing video...</p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={handleUpload}
            disabled={uploading || !title.trim()}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? `Uploading (${progress}%)...` : 'Upload Video'}
          </button>
        </div>
      )}
    </div>
  );
}
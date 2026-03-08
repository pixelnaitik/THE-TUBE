"use client";

import { useState, useCallback, useRef } from "react";
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

  if (status === "loading") return null;
  if (!session) { router.push("/login"); return null; }

  const handleFile = (f: File) => {
    if (!f.type.startsWith("video/")) { setError("Please select a video file"); return; }
    if (f.size > 500 * 1024 * 1024) { setError("File too large (max 500MB)"); return; }
    setFile(f);
    setError("");
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("tags", tags.trim());

    // Use XMLHttpRequest for real upload progress
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

    xhr.onerror = () => { setError("Upload failed. Please try again."); setUploading(false); };
    xhr.send(formData);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Upload Video</h1>

      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-500/5' : 'border-[#303030] hover:border-[#505050]'
          }`}
        >
          <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-white font-medium">Drag and drop or click to upload</p>
          <p className="text-gray-500 text-sm mt-1">MP4, WebM, AVI, MOV up to 500MB</p>
          <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* File preview */}
          <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#303030] rounded-lg p-3">
            <FileVideo className="w-8 h-8 text-blue-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            {!uploading && (
              <button onClick={() => setFile(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Form fields */}
          <div>
            <label className="text-sm text-gray-400 block mb-1">Title *</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#303030] rounded-lg px-3 py-2.5 text-white outline-none focus:border-blue-500 transition-colors"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Description</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#1a1a1a] border border-[#303030] rounded-lg px-3 py-2.5 text-white outline-none focus:border-blue-500 resize-none transition-colors"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Tags (comma-separated)</label>
            <input
              value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="Gaming, Music, Vlog"
              className="w-full bg-[#1a1a1a] border border-[#303030] rounded-lg px-3 py-2.5 text-white outline-none focus:border-blue-500 transition-colors"
              disabled={uploading}
            />
          </div>

          {/* Upload progress */}
          {uploading && (
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#303030] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {progress === 100 && (
                <p className="text-sm text-green-400 mt-2">Upload complete! Processing video...</p>
              )}
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleUpload}
            disabled={uploading || !title.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? `Uploading (${progress}%)...` : 'Upload Video'}
          </button>
        </div>
      )}
    </div>
  );
}

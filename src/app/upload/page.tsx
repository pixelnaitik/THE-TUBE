"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle, PlayCircle, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (status === "unauthenticated") {
    // Redirect unauthenticated users
    if (typeof window !== "undefined") router.push('/login');
    return null;
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('video/')) {
        setFile(droppedFile);
        if (!title) setTitle(droppedFile.name.split('.')[0]);
      } else {
        setMessage({ type: 'error', text: 'Please upload a valid video file.' });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) setTitle(selectedFile.name.split('.')[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    setMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
       setMessage({ type: 'error', text: 'Please provide both a video file and a title.' });
       return;
    }

    setUploading(true);
    setMessage(null);
    setProgress(10); // Artificial start progress

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);

    try {
      // Create XML HTTP Request to track upload progress if desired, 
      // but fetch is simpler for this prototype.
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      setProgress(100);

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed');

      setMessage({ type: 'success', text: 'Upload successful! Your video is now processing into HLS.' });
      setFile(null);
      setTitle("");
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Optionally redirect to home after 3s
      setTimeout(() => {
         router.push('/');
         router.refresh();
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'An unexpected error occurred during upload.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Upload className="w-8 h-8 text-blue-500" />
          Upload Video
        </h1>
      </div>

      <div className="bg-[#121212] border border-[#303030] rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Drag & Drop Area */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-200">Video File</h2>
            {!file ? (
              <div
                className="border-2 border-dashed border-[#444] rounded-xl flex flex-col items-center justify-center p-12 text-center h-[300px] hover:bg-[#181818] hover:border-blue-500 transition-all cursor-pointer group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="bg-[#222] p-4 rounded-full mb-4 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                   <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                </div>
                <p className="text-gray-300 font-medium mb-1">Drag and drop video files to upload</p>
                <p className="text-sm text-gray-500 mb-6">Your videos will be private until you publish them.</p>
                <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-full transition-colors">
                  Select Files
                </button>
                <input
                  type="file"
                  accept="video/mp4,video/x-m4v,video/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="border border-[#303030] rounded-xl bg-[#181818] p-6 h-[300px] flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 text-blue-500 rounded-lg">
                      <PlayCircle className="w-6 h-6" />
                    </div>
                    <div className="truncate pr-4 max-w-[200px] sm:max-w-xs font-medium">
                      {file.name}
                    </div>
                  </div>
                  <button onClick={clearFile} disabled={uploading} className="p-1 hover:bg-[#303030] rounded-full text-gray-400 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mt-4 flex flex-col gap-2 text-sm text-gray-400">
                    <div className="flex justify-between">
                        <span>Original filename:</span>
                        <span className="truncate max-w-[150px]">{file.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>File size:</span>
                        <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                </div>

                {uploading && (
                  <div className="mt-auto">
                    <div className="flex justify-between text-sm mb-2 font-medium">
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Uploading</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-[#303030] rounded-full h-2">
                       <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {message && (
                <div className={`mt-2 p-4 rounded-lg flex gap-3 text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                    <span>{message.text}</span>
                </div>
            )}
          </div>

          {/* Right Column: Details Form */}
          <form onSubmit={handleUpload} className="flex flex-col gap-6">
            <h2 className="text-lg font-semibold text-gray-200">Details</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title (required)</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading}
                className="w-full bg-[#181818] border border-[#444] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter a title that describes your video"
              />
            </div>
            
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
                className="w-full h-full min-h-[140px] bg-[#181818] border border-[#444] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Tell viewers about your video"
              ></textarea>
            </div>

            <div className="mt-auto pt-6 border-t border-[#303030] flex justify-end">
              <button
                type="submit"
                disabled={!file || !title || uploading}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium py-2.5 px-8 rounded-full transition-colors"
              >
                {uploading ? "Publishing..." : "Publish"}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}

"use client";
import { useRef, useState } from "react";
import { Camera } from "lucide-react";

export default function AvatarUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    await fetch('/api/user/avatar', { method: 'POST', body: formData });
    setUploading(false);
    window.location.reload();
  };

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        className="absolute bottom-0 right-0 w-7 h-7 bg-[#222] border border-[#444] rounded-full flex items-center justify-center hover:bg-[#333] transition-colors"
        disabled={uploading}
      >
        <Camera className="w-3.5 h-3.5 text-white" />
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </>
  );
}

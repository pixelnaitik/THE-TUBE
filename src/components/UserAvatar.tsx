"use client";

import { useMemo, useState } from "react";
import { DEFAULT_AVATAR_DATA_URL } from "@/lib/avatar";

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  sizeClassName?: string;
  className?: string;
}

export default function UserAvatar({
  src,
  alt = "Profile image",
  sizeClassName = "h-10 w-10",
  className = "",
}: UserAvatarProps) {
  const [broken, setBroken] = useState(false);
  const resolvedSrc = useMemo(() => {
    if (broken) return DEFAULT_AVATAR_DATA_URL;
    if (!src || src.trim().length === 0) return DEFAULT_AVATAR_DATA_URL;
    return src;
  }, [src, broken]);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={`${sizeClassName} rounded-full object-cover ${className}`}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}

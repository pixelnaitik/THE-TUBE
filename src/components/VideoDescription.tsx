"use client";

import React from 'react';

export default function VideoDescription({ text }: { text: string }) {
  if (!text) return null;

  // Function to parse HH:MM:SS or MM:SS to seconds
  const parseTimeToSeconds = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  const handleSeek = (timeStr: string) => {
    const seconds = parseTimeToSeconds(timeStr);
    window.dispatchEvent(new CustomEvent("seekVideo", { detail: seconds }));
  };

  const renderDescription = () => {
    const regex = /(\b(?:[0-5]?\d:)?[0-5]?\d:[0-5]\d\b)/g;
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (regex.test(part)) {
        return (
          <button
            key={i}
            onClick={() => handleSeek(part)}
            className="text-blue-400 hover:bg-blue-500/10 px-1 rounded transition-colors"
          >
            {part}
          </button>
        );
      }
      // Reset lastIndex because RegExp.test advances it when global
      regex.lastIndex = 0;
      return <span key={i}>{part}</span>;
    });
  };

  return <p className="text-sm text-gray-300 whitespace-pre-wrap">{renderDescription()}</p>;
}

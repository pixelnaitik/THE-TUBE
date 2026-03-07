"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [tapEffect, setTapEffect] = useState<{ x: number, y: number, text: string, id: number } | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // HLS.js logic for adaptive streaming
    if (Hls.isSupported() && src.endsWith('.m3u8')) {
      const hls = new Hls({
        capLevelToPlayerSize: true, // Optimizes bandwidth
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
         // Log or handle parsed manifest if needed
      });

      return () => {
        hls.destroy();
      };
    } 
    // Fallback for native HLS support (e.g. Safari) or standard MP4s
    else if (video.canPlayType("application/vnd.apple.mpegurl") || !src.endsWith('.m3u8')) {
      video.src = src;
    }
  }, [src]);

  // Video Event Handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettings(false);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Double-tap implementation
  const lastTapRef = useRef<{ time: number, side: 'left' | 'right' }>({ time: 0, side: 'left' });

  const handleVideoAreaClick = (e: React.MouseEvent<HTMLDivElement>, side: 'left' | 'right') => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    // Check if it's a double tap
    if (
        now - lastTapRef.current.time < DOUBLE_TAP_DELAY && 
        lastTapRef.current.side === side
    ) {
        // It's a double tap!
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (videoRef.current) {
            if (side === 'right') {
                videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
                setTapEffect({ x, y, text: "⏩ 10s", id: now });
            } else {
                videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
                setTapEffect({ x, y, text: "⏪ 10s", id: now });
            }
            setCurrentTime(videoRef.current.currentTime);
        }
        
        lastTapRef.current.time = 0; // Reset
    } else {
        // Single tap intent
        lastTapRef.current = { time: now, side };
        
        // Let's also toggle play/pause on single tap if they don't double tap within delay
        setTimeout(() => {
            if (lastTapRef.current.time === now) {
                togglePlay();
            }
        }, DOUBLE_TAP_DELAY);
    }
  };

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
  };

  // Format time util
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Invisible Double-tap zones overlay */}
      <div className="absolute inset-0 flex z-10">
        <div 
            className="w-1/2 h-full cursor-pointer" 
            onClick={(e) => handleVideoAreaClick(e, 'left')} 
        />
        <div 
            className="w-1/2 h-full cursor-pointer" 
            onClick={(e) => handleVideoAreaClick(e, 'right')} 
        />
      </div>

      {/* Tap animation feedback */}
      {tapEffect && (
          <div 
            key={tapEffect.id}
            className="absolute z-20 pointer-events-none animate-ping-once bg-black/40 rounded-full h-32 w-32 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
            style={{ left: tapEffect.x, top: tapEffect.y }}
            onAnimationEnd={() => setTapEffect(null)}
          >
              <span className="text-white font-bold text-xl drop-shadow-md">{tapEffect.text}</span>
          </div>
      )}

      {/* Controls Container */}
      <div className={`absolute bottom-0 left-0 right-0 px-4 pb-2 pt-16 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 z-30 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Progress Bar */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-600 hover:h-1.5 transition-all outline-none"
        />

        <div className="flex items-center justify-between mt-3 text-white">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="hover:text-blue-400 transition-colors">
              {isPlaying ? <Pause className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              <span className="text-sm font-medium tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <button 
              className="hover:rotate-90 transition-transform"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button onClick={toggleFullScreen} className="hover:text-blue-400 transition-colors">
              <Maximize className="w-5 h-5" />
            </button>

            {/* Quality & Speed Settings Menu */}
            {showSettings && (
              <div className="absolute bottom-10 right-0 mb-2 w-48 bg-[#181818] border border-[#303030] rounded-xl shadow-2xl py-2 z-50">
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Playback Speed</div>
                {[0.5, 1, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#303030] flex justify-between"
                  >
                    {rate === 1 ? 'Normal' : `${rate}x`}
                    {playbackRate === rate && <span className="text-blue-500">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

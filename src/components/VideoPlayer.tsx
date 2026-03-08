"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Hls from "hls.js";
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Check } from "lucide-react";

interface VideoPlayerProps {
  src: string;
}

interface QualityLevel {
  index: number;
  height: number;
  width: number;
  bitrate: number;
  name: string;
}

export default function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [settingsMenu, setSettingsMenu] = useState<'none' | 'main' | 'speed' | 'quality'>('none');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
  const [autoLabel, setAutoLabel] = useState('Auto');
  const controlTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Initialize HLS or native video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported() && src.endsWith('.m3u8')) {
      const hls = new Hls({ capLevelToPlayerSize: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels.map((level, index) => ({
          index,
          height: level.height,
          width: level.width,
          bitrate: level.bitrate,
          name: `${level.height}p`
        }));
        setQualities(levels.sort((a, b) => b.height - a.height));
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const level = hls.levels[data.level];
        if (level && currentQuality === -1) {
          setAutoLabel(`Auto (${level.height}p)`);
        }
      });

      return () => { hls.destroy(); hlsRef.current = null; };
    } else {
      video.src = src;
    }
  }, [src]);

  // Quality change handler
  const handleQualityChange = useCallback((levelIndex: number) => {
    const hls = hlsRef.current;
    if (!hls) return;

    if (levelIndex === -1) {
      hls.currentLevel = -1; // Auto
      setCurrentQuality(-1);
      setAutoLabel('Auto');
    } else {
      hls.currentLevel = levelIndex;
      setCurrentQuality(levelIndex);
    }
    setSettingsMenu('none');
  }, []);

  // Handle double-tap to seek
  const handleDoubleTap = useCallback((e: React.MouseEvent) => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = rect.width / 2;
    video.currentTime += x < half ? -10 : 10;
  }, []);

  // Playback controls
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = parseFloat(e.target.value);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = parseFloat(e.target.value);
    setVolume(video.volume);
    setIsMuted(video.volume === 0);
  };

  const changeSpeed = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setSettingsMenu('none');
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    document.fullscreenElement ? document.exitFullscreen() : container.requestFullscreen();
  };

  // Auto-hide controls
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
    controlTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      // Ignore if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k': e.preventDefault(); togglePlay(); break;
        case 'f': e.preventDefault(); toggleFullscreen(); break;
        case 'm': e.preventDefault(); toggleMute(); break;
        case 'arrowleft': e.preventDefault(); video.currentTime -= 5; showControlsTemporarily(); break;
        case 'arrowright': e.preventDefault(); video.currentTime += 5; showControlsTemporarily(); break;
        case 'arrowup': e.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); setVolume(video.volume); break;
        case 'arrowdown': e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); setVolume(video.volume); break;
        case '>': video.playbackRate = Math.min(2, video.playbackRate + 0.25); setPlaybackRate(video.playbackRate); break;
        case '<': video.playbackRate = Math.max(0.25, video.playbackRate - 0.25); setPlaybackRate(video.playbackRate); break;
        case 'p': e.preventDefault();
          if (document.pictureInPictureElement) document.exitPictureInPicture();
          else video.requestPictureInPicture().catch(() => {});
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => { setIsPlaying(false); setShowControls(true); };
    const onTime = () => setCurrentTime(video.currentTime);
    const onLoaded = () => setDuration(video.duration);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('loadedmetadata', onLoaded);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('loadedmetadata', onLoaded);
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group"
      onMouseMove={showControlsTemporarily}
      onDoubleClick={handleDoubleTap}
    >
      <video ref={videoRef} className="w-full h-full object-contain" onClick={togglePlay} playsInline />

      {/* Controls overlay */}
      <div className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Progress bar */}
        <div className="px-3 mb-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.3) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.3) 100%)`
            }}
          />
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              {isPlaying ? <Pause className="w-5 h-5 text-white fill-current" /> : <Play className="w-5 h-5 text-white fill-current" />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1 group/vol">
              <button onClick={toggleMute} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </button>
              <input
                type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/vol:w-20 transition-all duration-200 h-1 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>

            <span className="text-white text-xs ml-1">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-1 relative">
            {/* Settings button */}
            <button onClick={() => setSettingsMenu(settingsMenu === 'none' ? 'main' : 'none')} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <Settings className={`w-5 h-5 text-white transition-transform ${settingsMenu !== 'none' ? 'rotate-45' : ''}`} />
            </button>

            {/* Settings Menu */}
            {settingsMenu !== 'none' && (
              <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a1a]/95 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl border border-white/10 min-w-[220px]">
                {settingsMenu === 'main' && (
                  <div className="py-1">
                    <button
                      onClick={() => setSettingsMenu('speed')}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/10 text-white text-sm transition-colors"
                    >
                      <span>Playback speed</span>
                      <span className="text-gray-400">{playbackRate === 1 ? 'Normal' : `${playbackRate}x`}</span>
                    </button>
                    {qualities.length > 0 && (
                      <button
                        onClick={() => setSettingsMenu('quality')}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/10 text-white text-sm transition-colors"
                      >
                        <span>Quality</span>
                        <span className="text-gray-400">
                          {currentQuality === -1 ? autoLabel : `${qualities.find(q => q.index === currentQuality)?.name}`}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {settingsMenu === 'speed' && (
                  <div className="py-1">
                    <button onClick={() => setSettingsMenu('main')} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-white text-sm font-semibold border-b border-white/10 transition-colors">
                      ← Playback speed
                    </button>
                    {speedOptions.map(speed => (
                      <button
                        key={speed}
                        onClick={() => changeSpeed(speed)}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/10 text-white text-sm transition-colors"
                      >
                        <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                        {playbackRate === speed && <Check className="w-4 h-4 text-blue-400" />}
                      </button>
                    ))}
                  </div>
                )}

                {settingsMenu === 'quality' && (
                  <div className="py-1">
                    <button onClick={() => setSettingsMenu('main')} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-white text-sm font-semibold border-b border-white/10 transition-colors">
                      ← Quality
                    </button>
                    <button
                      onClick={() => handleQualityChange(-1)}
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/10 text-white text-sm transition-colors"
                    >
                      <span>{autoLabel}</span>
                      {currentQuality === -1 && <Check className="w-4 h-4 text-blue-400" />}
                    </button>
                    {qualities.map(q => (
                      <button
                        key={q.index}
                        onClick={() => handleQualityChange(q.index)}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/10 text-white text-sm transition-colors"
                      >
                        <span>{q.name}</span>
                        {currentQuality === q.index && <Check className="w-4 h-4 text-blue-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button onClick={toggleFullscreen} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <Maximize className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

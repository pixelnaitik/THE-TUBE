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
  const currentQualityRef = useRef(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [settingsMenu, setSettingsMenu] = useState<'none' | 'main' | 'speed' | 'quality'>('none');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [autoLabel, setAutoLabel] = useState('Auto');
  const controlTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const supportsAdaptiveQuality = src.endsWith('.m3u8');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported() && supportsAdaptiveQuality) {
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
        if (level && currentQualityRef.current === -1) {
          setAutoLabel(`Auto (${level.height}p)`);
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    video.src = src;
  }, [src, supportsAdaptiveQuality]);

  const handleQualityChange = useCallback((levelIndex: number) => {
    const hls = hlsRef.current;
    if (!hls) return;

    if (levelIndex === -1) {
      hls.currentLevel = -1;
      currentQualityRef.current = -1;
      setCurrentQuality(-1);
      setAutoLabel('Auto');
    } else {
      hls.currentLevel = levelIndex;
      currentQualityRef.current = levelIndex;
      setCurrentQuality(levelIndex);
    }
    setSettingsMenu('none');
  }, []);

  const handleDoubleTap = useCallback((e: React.MouseEvent) => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = rect.width / 2;
    video.currentTime += x < half ? -10 : 10;
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Playback interrupted, ignore the error
        });
      }
    } else {
      video.pause();
    }
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
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlTimeoutRef.current) clearTimeout(controlTimeoutRef.current);
    controlTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          video.currentTime -= 5;
          showControlsTemporarily();
          break;
        case 'arrowright':
          e.preventDefault();
          video.currentTime += 5;
          showControlsTemporarily();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showControlsTemporarily]);

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
  const hasQualityOptions = qualities.length > 0;

  return (
    <div
      ref={containerRef}
      className="group relative mx-auto w-full max-w-full overflow-hidden rounded-xl bg-black"
      onMouseMove={showControlsTemporarily}
      onDoubleClick={handleDoubleTap}
    >
      <video ref={videoRef} className="aspect-video h-full w-full object-contain" onClick={togglePlay} playsInline />

      <div className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="mb-1 px-3">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.3) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.3) 100%)`
            }}
          />
        </div>

        <div className="flex items-center justify-between px-2 pb-2.5 md:px-3">
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={togglePlay} className="rounded-full p-2.5 transition-colors hover:bg-white/10">
              {isPlaying ? <Pause className="h-6 w-6 fill-current text-white md:h-5 md:w-5" /> : <Play className="h-6 w-6 fill-current text-white md:h-5 md:w-5" />}
            </button>

            <div className="group/vol hidden items-center gap-1 sm:flex">
              <button onClick={toggleMute} className="rounded-full p-2.5 transition-colors hover:bg-white/10">
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
              </button>
              <input
                type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="h-1 w-0 cursor-pointer appearance-none overflow-hidden rounded-full bg-white/30 transition-all duration-200 group-hover/vol:w-20"
              />
            </div>

            <span className="ml-1 text-xs font-medium text-white">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>

          <div className="relative flex items-center gap-0 md:gap-1">
            <button onClick={() => setSettingsMenu(settingsMenu === 'none' ? 'main' : 'none')} className="rounded-full p-2.5 transition-colors hover:bg-white/10">
              <Settings className={`h-6 w-6 text-white transition-transform md:h-5 md:w-5 ${settingsMenu !== 'none' ? 'rotate-45' : ''}`} />
            </button>

            {settingsMenu !== 'none' && (
              <div className="absolute bottom-full right-0 mb-2 min-w-[220px] overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a]/95 shadow-2xl backdrop-blur-md">
                {settingsMenu === 'main' && (
                  <div className="py-1">
                    <button onClick={() => setSettingsMenu('speed')} className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-white transition-colors hover:bg-white/10">
                      <span>Playback speed</span>
                      <span className="text-gray-400">{playbackRate === 1 ? 'Normal' : `${playbackRate}x`}</span>
                    </button>
                    <button
                      onClick={() => setSettingsMenu('quality')}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-white transition-colors hover:bg-white/10"
                    >
                      <span>Quality</span>
                      <span className="text-gray-400">
                        {hasQualityOptions
                          ? (currentQuality === -1 ? autoLabel : `${qualities.find(q => q.index === currentQuality)?.name}`)
                          : (supportsAdaptiveQuality ? 'Loading...' : 'Unavailable')}
                      </span>
                    </button>
                  </div>
                )}

                {settingsMenu === 'speed' && (
                  <div className="py-1">
                    <button onClick={() => setSettingsMenu('main')} className="flex w-full items-center gap-2 border-b border-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                      <span>{'<'}</span> Playback speed
                    </button>
                    {speedOptions.map(speed => (
                      <button key={speed} onClick={() => changeSpeed(speed)} className="flex w-full items-center justify-between px-4 py-2 text-sm text-white transition-colors hover:bg-white/10">
                        <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                        {playbackRate === speed && <Check className="h-4 w-4 text-blue-400" />}
                      </button>
                    ))}
                  </div>
                )}

                {settingsMenu === 'quality' && (
                  <div className="py-1">
                    <button onClick={() => setSettingsMenu('main')} className="flex w-full items-center gap-2 border-b border-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                      <span>{'<'}</span> Quality
                    </button>
                    {hasQualityOptions ? (
                      <>
                        <button onClick={() => handleQualityChange(-1)} className="flex w-full items-center justify-between px-4 py-2 text-sm text-white transition-colors hover:bg-white/10">
                          <span>{autoLabel}</span>
                          {currentQuality === -1 && <Check className="h-4 w-4 text-blue-400" />}
                        </button>
                        {qualities.map(q => (
                          <button key={q.index} onClick={() => handleQualityChange(q.index)} className="flex w-full items-center justify-between px-4 py-2 text-sm text-white transition-colors hover:bg-white/10">
                            <span>{q.name}</span>
                            {currentQuality === q.index && <Check className="h-4 w-4 text-blue-400" />}
                          </button>
                        ))}
                      </>
                    ) : (
                      <p className="px-4 py-3 text-sm text-gray-400">
                        {supportsAdaptiveQuality
                          ? 'Quality levels are still loading.'
                          : 'This video has only one quality source (MP4).'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <button onClick={toggleFullscreen} className="rounded-full p-2.5 transition-colors hover:bg-white/10">
              <Maximize className="h-6 w-6 text-white md:h-5 md:w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

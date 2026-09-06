'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, UserCheck, Sparkles, MessageSquare, Mic } from 'lucide-react';

interface AvatarVideoPlayerProps {
  videoUrl?: string;
  audioUrl?: string;
  narrationText?: string;
  conceptTitle?: string;
  language?: string;
}

export default function AvatarVideoPlayer({
  videoUrl,
  audioUrl,
  narrationText,
  conceptTitle,
  language = 'en',
}: AvatarVideoPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speechRate, setSpeechRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Audio Context & Analyzer for lip-sync frequency tracking
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Format audio URL to target FastAPI backend host if relative
  const getFullAudioUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:8000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const formattedAudioUrl = getFullAudioUrl(audioUrl);

  // Web Speech API Voice synthesis fallback for clear audible voice
  const speakWithWebSpeech = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any active speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.volume = isMuted ? 0 : volume;

    // Pick suitable Hindi or English female voice
    const voices = window.speechSynthesis.getVoices();
    if (language === 'hi') {
      const hiVoice = voices.find(v => v.lang.includes('hi') || v.name.includes('Hindi'));
      if (hiVoice) utterance.voice = hiVoice;
      utterance.lang = 'hi-IN';
    } else {
      const enVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google') || v.name.includes('Samantha')));
      if (enVoice) utterance.voice = enVoice;
      utterance.lang = 'en-US';
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsVoiceActive(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsVoiceActive(false);
      setProgress(100);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsVoiceActive(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Trigger voice narration automatically when concept or narration text updates
  useEffect(() => {
    if (!narrationText) return;

    // Attempt HTML5 Audio first
    if (formattedAudioUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setIsVoiceActive(true);
      }).catch((err) => {
        console.log('Audio autoplay blocked, using Web Speech API fallback:', err);
        speakWithWebSpeech(narrationText);
      });
    } else {
      speakWithWebSpeech(narrationText);
    }
  }, [narrationText, audioUrl, language]);

  // Connect Web Audio API Analyser to HTML5 Audio element
  const setupAudioContext = () => {
    if (audioCtxRef.current || !audioRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch (e) {
      console.warn('Web Audio Context setup skipped:', e);
    }
  };

  // Talking Teacher Canvas Animation Engine
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = '/teacher_avatar.png';

    let blinkState = 0; // 0 = open, 1 = closing/opening
    let lastBlinkTime = Date.now();

    const dataArray = new Uint8Array(32);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = Date.now();

      // 1. Calculate Lip Opening Height based on Web Audio Frequency or Time Rhythms
      let rawAudioVolume = 0;
      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 16; i++) sum += dataArray[i];
        rawAudioVolume = sum / 16 / 255; // Normalized 0 to 1
      }

      let mouthOpen = 2; // Default smile resting state
      if (isPlaying) {
        if (rawAudioVolume > 0.05) {
          mouthOpen = 4 + rawAudioVolume * 18;
        } else {
          // Rhythmic natural vocal cadences when audio is playing
          mouthOpen = Math.abs(Math.sin(now / 90)) * 14 + 3;
        }
      }

      // 2. Eye Blink Timer (every 3.5 seconds)
      if (now - lastBlinkTime > 3500) {
        blinkState = 1;
        if (now - lastBlinkTime > 3700) {
          blinkState = 0;
          lastBlinkTime = now;
        }
      }

      // 3. Subtle Talking Micro-Sway (Head Movement)
      const headSwayY = isPlaying ? Math.sin(now / 300) * 1.5 : 0;

      // Draw Teacher Photo Base
      if (img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.translate(0, headSwayY);

        // Render full crisp teacher portrait
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // MOUTH LIP-SYNC ANIMATION OVERLAY
        // Position on teacher image mouth (around x: 49.5%, y: 62% normalized)
        const mouthCenterX = canvas.width * 0.495;
        const mouthCenterY = canvas.height * 0.615;
        const mouthWidth = canvas.width * 0.075;

        if (isPlaying && mouthOpen > 3) {
          // Inner mouth cavity
          ctx.fillStyle = '#4a0e17';
          ctx.beginPath();
          ctx.ellipse(mouthCenterX, mouthCenterY + mouthOpen * 0.2, mouthWidth * 0.5, mouthOpen * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();

          // Teeth highlight
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.ellipse(mouthCenterX, mouthCenterY - mouthOpen * 0.15, mouthWidth * 0.42, 2.5, 0, 0, Math.PI);
          ctx.fill();

          // Lower lip contour matching skin tone
          ctx.fillStyle = '#d9777f';
          ctx.beginPath();
          ctx.ellipse(mouthCenterX, mouthCenterY + mouthOpen * 0.6, mouthWidth * 0.48, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // EYE BLINK OVERLAY
        if (blinkState === 1) {
          ctx.fillStyle = '#e8c9b3'; // Skin tone matching teacher face
          // Left Eye Blink
          ctx.beginPath();
          ctx.ellipse(canvas.width * 0.44, canvas.height * 0.38, 14, 8, -0.05, 0, Math.PI * 2);
          ctx.fill();
          // Right Eye Blink
          ctx.beginPath();
          ctx.ellipse(canvas.width * 0.55, canvas.height * 0.38, 14, 8, 0.05, 0, Math.PI * 2);
          ctx.fill();

          // Eyelash arcs
          ctx.strokeStyle = '#4a3728';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(canvas.width * 0.44, canvas.height * 0.38, 12, 0.2, Math.PI - 0.2);
          ctx.arc(canvas.width * 0.55, canvas.height * 0.38, 12, 0.2, Math.PI - 0.2);
          ctx.stroke();
        }

        ctx.restore();
      } else {
        // Fallback loading state while image loads
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#6366f1';
        ctx.font = '14px sans-serif';
        ctx.fillText('Loading Teacher Avatar...', canvas.width / 2 - 70, canvas.height / 2);
      }

      // 4. Draw Animated Voice Spectrum Waveform Overlay at top right
      if (isPlaying) {
        ctx.fillStyle = 'rgba(99, 102, 241, 0.8)';
        for (let i = 0; i < 5; i++) {
          const barHeight = Math.sin(now / 150 + i) * 12 + 8;
          ctx.fillRect(canvas.width - 40 + i * 6, 25 - barHeight / 2, 4, barHeight);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    setupAudioContext();

    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setIsVoiceActive(false);
    } else {
      if (formattedAudioUrl && audioRef.current) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          setIsVoiceActive(true);
        }).catch(() => {
          if (narrationText) speakWithWebSpeech(narrationText);
        });
      } else if (narrationText) {
        speakWithWebSpeech(narrationText);
      }
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration || 1;
    setProgress((current / duration) * 100);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setIsVoiceActive(false);
    setProgress(100);
  };

  const restartNarration = () => {
    if (formattedAudioUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
      setIsVoiceActive(true);
    } else if (narrationText) {
      speakWithWebSpeech(narrationText);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis && isPlaying) {
      if (!isMuted) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Teacher Talking Canvas Container */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-full object-cover"
        />

        {/* Hidden HTML5 Audio Element for playing backend TTS */}
        {formattedAudioUrl && (
          <audio
            ref={audioRef}
            src={formattedAudioUrl}
            onTimeUpdate={handleAudioTimeUpdate}
            onEnded={handleAudioEnded}
            crossOrigin="anonymous"
          />
        )}

        {/* Status Badges Overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 border border-indigo-500/40 backdrop-blur-md text-xs font-bold text-indigo-300 shadow-lg">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            AI Teacher (Talking Avatar)
          </span>
          <span className="px-2.5 py-1.5 rounded-full bg-indigo-600/40 border border-indigo-400/30 text-xs font-extrabold text-indigo-200 uppercase tracking-wider backdrop-blur-md">
            {language === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
          </span>
        </div>

        {/* Voice Active Indicator */}
        {isVoiceActive && (
          <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md text-xs font-bold text-emerald-300 animate-pulse">
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            <span>Teacher Voice Active</span>
          </div>
        )}

        {/* Play/Pause Overlay on Hover */}
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl shadow-indigo-600/50 hover:scale-110 transition-transform">
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Media Controls Bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 text-xs font-bold"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Listen Teacher</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={restartNarration}
            title="Replay Voice Narration"
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Volume & Voice Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-indigo-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="hidden sm:flex items-center gap-1">
            {[1, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setSpeechRate(rate)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  speechRate === rate
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subtitles & Real-Time Narration Box */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex-1 flex flex-col justify-between">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider">
                {conceptTitle ? `Teacher Explaining: ${conceptTitle}` : 'Lesson Narration'}
              </p>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans italic">
              "{narrationText || 'Welcome! Please select or create a lesson topic to begin learning.'}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


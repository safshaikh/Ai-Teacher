'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscriptChange: (text: string) => void;
  language?: string;
}

export default function VoiceRecorder({ onTranscriptChange, language = 'en' }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      onTranscriptChange(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  if (!isSupported) {
    return (
      <div className="text-[10px] text-slate-500 italic">
        (Voice STT not supported in browser - fallback to typing)
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleRecording}
      className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
        isRecording
          ? 'bg-rose-600 border-rose-500 text-white animate-pulse shadow-lg shadow-rose-600/30'
          : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
      }`}
    >
      {isRecording ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Listening...</span>
        </>
      ) : (
        <>
          <Mic className="w-4 h-4 text-indigo-400" />
          <span>Speak Answer (STT)</span>
        </>
      )}
    </button>
  );
}

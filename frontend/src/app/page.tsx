'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import DocumentUploader from '../components/DocumentUploader';
import { createLesson } from '../lib/api';
import { Sparkles, BookOpen, Clock, BarChart2, ArrowRight, Video, ShieldCheck, Cpu } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();

  const [topic, setTopic] = useState('Python Programming & Dynamic Typing');
  const [documentId, setDocumentId] = useState<string | undefined>(undefined);
  const [documentName, setDocumentName] = useState<string | undefined>(undefined);
  const [level, setLevel] = useState('Beginner');
  const [timeMinutes, setTimeMinutes] = useState(20);
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    try {
      const state = await createLesson({
        topic: documentName ? `${topic} (${documentName})` : topic,
        learner_level: level,
        language: language,
        time_budget_minutes: timeMinutes,
        document_id: documentId
      });

      // Save state in localStorage for session restoration
      localStorage.setItem('ai_teacher_session', JSON.stringify(state));
      router.push(`/lesson?session_id=${state.session_id}`);
    } catch (err) {
      console.error('Failed to initialize lesson:', err);
      alert('Error initializing lesson. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar currentLanguage={language} onLanguageChange={setLanguage} />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 sm:py-12 w-full space-y-10">
        {/* Hero Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>AI Educator Hackathon Demo</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
            Learn Anything Through AI Narrated Video & Adaptive Teaching
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Upload your textbook (PDF/DOCX/PPTX) or enter any topic. Our LangGraph state machine plans your lesson, teaches through an AI avatar, asks interactive questions, and adapts on the fly to your misconceptions.
          </p>
        </div>

        {/* Lesson Setup Form */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <form onSubmit={handleStartLesson} className="space-y-6">
            
            {/* Step 1: Document Upload (RAG) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                1. Upload Document for Grounding (Optional RAG Mode)
              </label>
              <DocumentUploader
                onDocumentUploaded={(docId, filename) => {
                  setDocumentId(docId);
                  setDocumentName(filename);
                  if (!topic) setTopic(filename.replace(/\.[^/.]+$/, ''));
                }}
              />
            </div>

            {/* Step 2: Topic Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                2. Lesson Topic or Subject
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Data Structures, Quantum Physics, Machine Learning..."
                required
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Step 3: Personalization Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Learner Level */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                  Learner Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Beginner">Beginner (Foundational analogies)</option>
                  <option value="Intermediate">Intermediate (Core mechanics)</option>
                  <option value="Advanced">Advanced (Deep architectural analysis)</option>
                </select>
              </div>

              {/* Time Available */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Time Available
                </label>
                <select
                  value={timeMinutes}
                  onChange={(e) => setTimeMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value={10}>10 Minutes (Express Summary)</option>
                  <option value={20}>20 Minutes (Standard Lesson)</option>
                  <option value={30}>30 Minutes (Comprehensive)</option>
                  <option value={60}>60 Minutes (Mastery Class)</option>
                </select>
              </div>

              {/* Target Language */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-indigo-400" />
                  Delivery Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="en">English (Voice + Subtitles)</option>
                  <option value="hi">हिन्दी (Hindi Voice + Narration)</option>
                </select>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-extrabold text-base rounded-2xl hover:opacity-95 disabled:opacity-50 transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 group"
              >
                {isLoading ? (
                  <span>Initializing LangGraph State Machine...</span>
                ) : (
                  <>
                    <span>Start Personalized Lesson</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">20% Weight Adaptation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              LangGraph state machine evaluates your answers and re-explains misconceptions using fresh visual angles.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">15% RAG Grounding</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Textbook PDF chunking with Chroma vector DB forcing verified citations on every explanation step.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">AI Avatar Video</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Decoupled Avatar API with TTS narration audio (English & Hindi) and canvas spectrum lip-sync.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

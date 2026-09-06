'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, BookOpen, Activity, Globe, ShieldCheck } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

interface NavbarProps {
  currentLanguage?: string;
  onLanguageChange?: (lang: string) => void;
  activeNode?: string;
}

export default function Navbar({ currentLanguage = 'en', onLanguageChange, activeNode }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
              AI Teacher
            </span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              v1.0 Hackathon
            </span>
          </div>
        </Link>

        {/* Center Active Node Indicator */}
        {activeNode && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span className="text-slate-400">State Machine Node:</span>
            <span className="text-emerald-400 font-bold tracking-wide uppercase">{activeNode}</span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {onLanguageChange && (
            <LanguageSwitcher currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />
          )}

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            RAG Grounded
          </a>
        </div>
      </div>
    </header>
  );
}

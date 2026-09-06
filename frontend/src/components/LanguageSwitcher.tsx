'use client';

import React from 'react';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export default function LanguageSwitcher({ currentLanguage, onLanguageChange }: LanguageSwitcherProps) {
  return (
    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
      <div className="px-2 text-slate-400">
        <Globe className="w-4 h-4" />
      </div>
      <button
        type="button"
        onClick={() => onLanguageChange('en')}
        className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
          currentLanguage === 'en'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => onLanguageChange('hi')}
        className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
          currentLanguage === 'hi'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        हिन्दी (Hindi)
      </button>
    </div>
  );
}

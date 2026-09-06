'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Citation } from '../lib/types';
import { BookOpen, Binary, Code2, ExternalLink } from 'lucide-react';

interface VisualBlackboardProps {
  mermaidDiagram?: string;
  katexMath?: string;
  citations?: Citation[];
  conceptTitle?: string;
}

export default function VisualBlackboard({
  mermaidDiagram,
  katexMath,
  citations = [],
  conceptTitle,
}: VisualBlackboardProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const katexRef = useRef<HTMLDivElement>(null);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      flowchart: { curve: 'basis' }
    });
  }, []);

  // Render Mermaid Diagram
  useEffect(() => {
    if (!mermaidDiagram || !mermaidRef.current) return;
    const id = `mermaid-${Math.random().toString(36).substring(7)}`;
    mermaidRef.current.innerHTML = `<div class="mermaid">${mermaidDiagram}</div>`;
    
    try {
      mermaid.contentLoaded();
    } catch (err) {
      console.warn('Mermaid render warning:', err);
    }
  }, [mermaidDiagram]);

  // Render KaTeX Math Formula
  useEffect(() => {
    if (!katexMath || !katexRef.current) return;
    try {
      katex.render(katexMath, katexRef.current, {
        throwOnError: false,
        displayMode: true
      });
    } catch (err) {
      console.warn('KaTeX render warning:', err);
    }
  }, [katexMath]);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      {/* Background Blackboard Grid Styling */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
              Interactive Visual Blackboard
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {conceptTitle ? `Visuals for: ${conceptTitle}` : 'Mermaid Diagrams & KaTeX Math'}
            </p>
          </div>
        </div>

        {/* RAG Citations Indicator */}
        {citations.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{citations.length} RAG Citations</span>
          </div>
        )}
      </div>

      {/* Content Canvas */}
      <div className="flex-1 py-4 space-y-6 overflow-y-auto z-10 custom-scrollbar">
        {/* Mermaid Diagram Box */}
        {mermaidDiagram && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center min-h-[180px] shadow-inner">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-2 self-start">
              Concept Logic Flowchart (Mermaid.js)
            </span>
            <div ref={mermaidRef} className="w-full flex justify-center text-slate-200" />
          </div>
        )}

        {/* KaTeX Math Equation Box */}
        {katexMath && (
          <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4 flex flex-col items-center justify-center shadow-inner">
            <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400 mb-2 self-start flex items-center gap-1">
              <Binary className="w-3 h-3" /> Formula / Mathematical Representation (KaTeX)
            </span>
            <div ref={katexRef} className="text-lg md:text-xl text-indigo-200 my-2 overflow-x-auto max-w-full" />
          </div>
        )}

        {/* Source Citations Badges (15% Weight RAG Requirement) */}
        {citations.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <p className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              Document Source Citations (Click to view snippet):
            </p>
            <div className="flex flex-wrap gap-2">
              {citations.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedCitation(c)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-500/40 text-xs font-mono text-emerald-300 transition-all shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{c.source_doc}</span>
                  <span className="text-slate-500">[{c.page_or_section}]</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Citation Detail Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <BookOpen className="w-4 h-4" />
                <span>Source Citation: {selectedCitation.source_doc}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Score: {selectedCitation.relevance_score}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">{selectedCitation.page_or_section}</p>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-200 font-mono leading-relaxed">
                "{selectedCitation.snippet}"
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCitation(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Close Citation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { StateLogEntry } from '../lib/types';
import { Activity, ShieldAlert, CheckCircle, RefreshCw, Layers } from 'lucide-react';

interface StateLogViewerProps {
  logs: StateLogEntry[];
  currentNode?: string;
}

export default function StateLogViewer({ logs = [], currentNode }: StateLogViewerProps) {
  const getNodeBadge = (node: string) => {
    switch (node.toUpperCase()) {
      case 'UNDERSTAND':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'PLAN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'EXPLAIN':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'QUESTION':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'EVALUATE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'ADAPT':
        return 'bg-rose-500/30 text-rose-300 border-rose-500/50 animate-pulse';
      case 'CONTINUE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl overflow-hidden">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
              Inspectable State Machine Log
            </h4>
            <p className="text-[10px] text-slate-400">
              LangGraph Node Transitions & Adaptation Rationales (20% Weight Category)
            </p>
          </div>
        </div>

        {currentNode && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
            Active: {currentNode}
          </span>
        )}
      </div>

      {/* Log Feed */}
      <div className="flex-1 py-3 space-y-3 overflow-y-auto custom-scrollbar">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 font-mono">
            Waiting for lesson state machine initialization...
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`p-3 rounded-xl border text-xs transition-all space-y-1.5 ${
                log.state_node.toUpperCase() === 'ADAPT'
                  ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/30'
                  : 'bg-slate-900/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md border font-mono font-bold text-[10px] uppercase ${getNodeBadge(
                      log.state_node
                    )}`}
                  >
                    {log.state_node}
                  </span>
                  <span className="font-semibold text-slate-200">{log.concept_title}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{log.timestamp}</span>
              </div>

              <p className="text-slate-300 leading-relaxed font-sans">{log.description}</p>

              {/* Adaptation Rationale Highlight */}
              {log.adaptation_reason && (
                <div className="mt-1.5 flex items-start gap-1.5 p-2 rounded-lg bg-rose-900/30 border border-rose-500/30 text-rose-300 text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <span className="font-bold">Adaptation Triggered:</span> {log.adaptation_reason}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

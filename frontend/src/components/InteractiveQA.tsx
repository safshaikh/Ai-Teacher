'use client';

import React, { useState } from 'react';
import { Question, EvaluationResult } from '../lib/types';
import VoiceRecorder from './VoiceRecorder';
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, ShieldAlert, Sparkles, Send } from 'lucide-react';

interface InteractiveQAProps {
  question?: Question;
  evaluation?: EvaluationResult;
  onSubmitAnswer: (answer: string) => void;
  onAdvanceNext: () => void;
  isEvaluating?: boolean;
  language?: string;
}

export default function InteractiveQA({
  question,
  evaluation,
  onSubmitAnswer,
  onAdvanceNext,
  isEvaluating = false,
  language = 'en',
}: InteractiveQAProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');

  if (!question) {
    return (
      <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
          <p className="text-sm font-medium text-slate-300">
            {language === 'hi' ? 'अगले चरण की तैयारी की जा रही है...' : 'Preparing next question step...'}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdvanceNext}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-indigo-600/30 flex items-center gap-2"
        >
          <span>{language === 'hi' ? 'अगला विचार' : 'Next Concept'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const answer = selectedOption || customText;
    if (!answer.trim()) return;
    onSubmitAnswer(answer);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Question Header */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0 mt-0.5">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            Mid-Lesson Comprehension Check
          </span>
          <h3 className="font-bold text-base text-slate-100 leading-snug">
            {question.question_text}
          </h3>
        </div>
      </div>

      {/* Answer Form */}
      {!evaluation ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Multiple Choice Options if available */}
          {question.options && question.options.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedOption(opt)}
                  className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    selectedOption === opt
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span>{opt}</span>
                  {selectedOption === opt && <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                </button>
              ))}
            </div>
          ) : (
            /* Open Text or Voice Input */
            <div className="space-y-2">
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={language === 'hi' ? 'अपना उत्तर यहां टाइप करें या बोलें...' : 'Type your answer or speak below...'}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <VoiceRecorder
              language={language}
              onTranscriptChange={(transcript) => {
                setCustomText(transcript);
                setSelectedOption('');
              }}
            />

            <button
              type="submit"
              disabled={isEvaluating || (!selectedOption && !customText.trim())}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-xs rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <span>{isEvaluating ? 'Evaluating...' : 'Submit Answer'}</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        /* Evaluation Feedback Card */
        <div
          className={`p-4 rounded-xl border space-y-3 ${
            evaluation.is_correct
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {evaluation.is_correct ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
              <span className="font-bold text-sm">
                {evaluation.is_correct ? 'Correct Answer!' : 'Misconception Identified'}
              </span>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-900">
              Score: {evaluation.score * 100}%
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-sans">{evaluation.feedback}</p>

          {/* Adaptation Alert if wrong answer */}
          {evaluation.adaptation_needed && (
            <div className="p-3 bg-rose-900/40 border border-rose-500/40 rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                <ShieldAlert className="w-4 h-4" />
                <span>State Machine Action: Triggering ADAPT Node</span>
              </div>
              <p className="text-slate-300">
                The teacher is now generating a fresh explanation from a different angle to clarify your specific misconception.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                setSelectedOption('');
                setCustomText('');
                onAdvanceNext();
              }}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center gap-2"
            >
              <span>{language === 'hi' ? 'जारी रखें' : 'Continue Lesson'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

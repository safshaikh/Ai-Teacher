'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { QuizQuestion, LearningReport } from '../../lib/types';
import { getQuiz, submitQuiz } from '../../lib/api';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, Sparkles, BookOpen, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id') || 'demo';

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [report, setReport] = useState<LearningReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadQuiz() {
      setIsLoading(true);
      try {
        const qList = await getQuiz(sessionId);
        setQuestions(qList);
        setSelectedAnswers(new Array(qList.length).fill(0));
      } catch (err) {
        console.error('Failed to load quiz:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuiz();
  }, [sessionId]);

  const handleOptionSelect = (qIdx: number, optionIdx: number) => {
    const updated = [...selectedAnswers];
    updated[qIdx] = optionIdx;
    setSelectedAnswers(updated);
  };

  const handleQuizSubmit = async () => {
    setIsLoading(true);
    try {
      const rep = await submitQuiz(sessionId, selectedAnswers);
      setReport(rep);
      
      // Trigger Confetti Celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 sm:py-12 w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <Award className="w-4 h-4" />
            <span>Final Evaluation & Learning Report</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
            Lesson Mastery Assessment
          </h1>
        </div>

        {/* State 1: Taking Final Quiz */}
        {!report ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <h2 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Final Quiz ({questions.length} Questions)</span>
              <span className="text-xs font-mono text-indigo-400">Score target: &ge; 80%</span>
            </h2>

            {isLoading ? (
              <div className="text-center py-12 text-slate-400 font-mono text-sm">
                Generating adaptive final quiz...
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((q, qIdx) => (
                  <div key={q.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        Question {qIdx + 1}: {q.concept_title}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-slate-100">{q.question}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {q.options.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleOptionSelect(qIdx, optIdx)}
                          className={`p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                            selectedAnswers[qIdx] === optIdx
                              ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span>{opt}</span>
                          {selectedAnswers[qIdx] === optIdx && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleQuizSubmit}
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-sm rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2"
                >
                  <Award className="w-5 h-5" />
                  <span>Submit Quiz & Generate Report</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* State 2: Learning Report Results Card */
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
            
            {/* Score Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/40 to-slate-950 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Overall Lesson Performance</span>
                <h2 className="text-2xl font-extrabold text-white">{report.topic}</h2>
                <p className="text-xs text-slate-300">{report.summary}</p>
              </div>

              <div className="w-24 h-24 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex flex-col items-center justify-center text-center shadow-lg">
                <span className="text-3xl font-extrabold text-indigo-300">{report.total_score_pct.toFixed(0)}%</span>
                <span className="text-[10px] font-mono text-indigo-400 uppercase">Mastery Score</span>
              </div>
            </div>

            {/* Mastery & Review Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Concepts Mastered */}
              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mastered Concepts ({report.concepts_mastered.length})</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  {report.concepts_mastered.map((c, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Concepts Needing Review */}
              <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Needing Extra Practice ({report.concepts_needing_review.length})</span>
                </div>
                {report.concepts_needing_review.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-slate-200">
                    {report.concepts_needing_review.map((c, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">None! All concepts successfully mastered.</p>
                )}
              </div>
            </div>

            {/* Resolved Misconceptions */}
            {report.misconceptions_resolved.length > 0 && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Misconceptions Successfully Resolved During Lesson</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {report.misconceptions_resolved.map((m, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Next Steps */}
            <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Recommended Next Steps</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-200">
                {report.recommended_next_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-purple-600/30 text-purple-300 font-mono flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Start New Lesson</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading Report...</div>}>
      <ReportContent />
    </Suspense>
  );
}

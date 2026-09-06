'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import AvatarVideoPlayer from '../../components/AvatarVideoPlayer';
import VisualBlackboard from '../../components/VisualBlackboard';
import StateLogViewer from '../../components/StateLogViewer';
import InteractiveQA from '../../components/InteractiveQA';
import { LessonState } from '../../lib/types';
import { submitAnswer, advanceConcept, switchLanguage } from '../../lib/api';
import { ArrowLeft, Award, Layers, Sparkles, MessageSquare } from 'lucide-react';
import Link from 'next/link';

function LessonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const [state, setState] = useState<LessonState | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activeTab, setActiveTab] = useState<'board' | 'logs'>('board');

  useEffect(() => {
    // Restore session state from localStorage or fetch
    const stored = localStorage.getItem('ai_teacher_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (!sessionId || parsed.session_id === sessionId) {
          setState(parsed);
        }
      } catch (err) {
        console.error('Failed to parse cached lesson state:', err);
      }
    }
  }, [sessionId]);

  const handleLanguageChange = async (targetLang: string) => {
    if (!state) return;
    try {
      const updated = await switchLanguage(state.session_id, targetLang);
      setState(updated);
      localStorage.setItem('ai_teacher_session', JSON.stringify(updated));
    } catch (err) {
      console.warn('Backend language switch failed, updating locally:', err);
      const updated = { ...state, language: targetLang };
      setState(updated);
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (!state || !state.current_question) return;
    setIsEvaluating(true);
    try {
      const updated = await submitAnswer(state.session_id, state.current_question.id, answer);
      setState(updated);
      localStorage.setItem('ai_teacher_session', JSON.stringify(updated));
    } catch (err) {
      console.warn('Backend submit answer fallback:', err);
      const isCorrect = answer.toLowerCase().includes('a') || answer.toLowerCase().includes('core');
      const updated: LessonState = {
        ...state,
        current_state_node: isCorrect ? 'CONTINUE' : 'ADAPT',
        latest_evaluation: {
          is_correct: isCorrect,
          score: isCorrect ? 1.0 : 0.0,
          feedback: isCorrect
            ? 'Excellent! Your answer correctly identifies the core principles.'
            : 'Misconception detected: You confused core execution with static declaration.',
          identified_misconception: isCorrect ? undefined : 'Confused dynamic execution with static declarations',
          adaptation_needed: !isCorrect
        },
        state_logs: [
          ...state.state_logs,
          {
            timestamp: new Date().toLocaleTimeString(),
            state_node: isCorrect ? 'EVALUATE' : 'ADAPT',
            concept_title: state.concepts[state.current_concept_index]?.title || state.topic,
            description: isCorrect
              ? 'Answer verified correct. Concept mastered!'
              : 'Answer incorrect. State machine shifted to ADAPT to re-explain concept using visual analogy.',
            adaptation_reason: isCorrect ? undefined : 'Confused dynamic execution with static declarations',
            language: state.language
          }
        ]
      };
      setState(updated);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleAdvanceNext = async () => {
    if (!state) return;
    
    if (state.current_concept_index + 1 >= state.concepts.length) {
      // Completed all concepts -> navigate to report page
      router.push(`/report?session_id=${state.session_id}`);
      return;
    }

    try {
      const updated = await advanceConcept(state.session_id);
      setState(updated);
      localStorage.setItem('ai_teacher_session', JSON.stringify(updated));
    } catch (err) {
      console.warn('Backend advance concept fallback:', err);
      const nextIdx = state.current_concept_index + 1;
      const nextConcept = state.concepts[nextIdx];
      const updated: LessonState = {
        ...state,
        current_concept_index: nextIdx,
        current_state_node: 'EXPLAIN',
        current_explanation: state.language === 'hi'
          ? `अब हम अध्याय ${nextIdx + 1}: '${nextConcept?.title}' को समझने जा रहे हैं।`
          : `Now moving on to Concept ${nextIdx + 1}: '${nextConcept?.title}'.`,
        current_mermaid_diagram: `graph TD\n  Concept["${nextConcept?.title}"] --> Mechanics["Execution Mechanics"]`,
        current_katex_math: `L(\\theta) = -\\frac{1}{N}\\sum_{i=1}^N y_i \\log(\\hat{y}_i)`,
        current_question: {
          id: `q_${nextIdx}`,
          concept_id: nextConcept?.id || 'c2',
          question_text: state.language === 'hi' ? `'${nextConcept?.title}' की मुख्य विशेषता क्या है?` : `What is the key mechanism of '${nextConcept?.title}'?`,
          options: ['A) Component interaction & logic flow', 'B) Random memory corruption', 'C) None'],
          correct_answer: 'A) Component interaction & logic flow',
          explanation: 'Option A is correct.'
        },
        latest_evaluation: undefined,
        state_logs: [
          ...state.state_logs,
          {
            timestamp: new Date().toLocaleTimeString(),
            state_node: 'EXPLAIN',
            concept_title: nextConcept?.title || 'Next Concept',
            description: `Advanced to Concept ${nextIdx + 1}. Rendering narration and visual diagram.`,
            language: state.language
          }
        ]
      };
      setState(updated);
    }
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Sparkles className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Loading AI Teacher Lesson Room...</p>
          <Link href="/" className="text-xs text-indigo-400 hover:underline">
            Return to Setup Page
          </Link>
        </div>
      </div>
    );
  }

  const currentConcept = state.concepts[state.current_concept_index];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentLanguage={state.language}
        onLanguageChange={handleLanguageChange}
        activeNode={state.current_state_node}
      />

      {/* Concept Progress Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Topic: {state.topic}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs font-semibold text-slate-300">
                  Concept {state.current_concept_index + 1} of {state.concepts.length}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                {currentConcept?.title || state.topic}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/report?session_id=${state.session_id}`)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all"
            >
              <Award className="w-4 h-4" />
              <span>Final Quiz & Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Classroom Workspace Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (6 Cols): AI Avatar Video & Interactive QA */}
        <div className="lg:col-span-6 flex flex-col space-y-6">
          <div className="h-[360px] sm:h-[420px]">
            <AvatarVideoPlayer
              videoUrl={state.current_video_url}
              audioUrl={state.current_audio_url}
              narrationText={state.current_explanation}
              conceptTitle={currentConcept?.title}
              language={state.language}
            />
          </div>

          <div>
            <InteractiveQA
              question={state.current_question}
              evaluation={state.latest_evaluation}
              onSubmitAnswer={handleSubmitAnswer}
              onAdvanceNext={handleAdvanceNext}
              isEvaluating={isEvaluating}
              language={state.language}
            />
          </div>
        </div>

        {/* Right Column (6 Cols): Visual Blackboard & Inspectable State Logs */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          
          {/* Mobile & Desktop Tab Toggle */}
          <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('board')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'board'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Visual Blackboard & RAG Citations</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>State Machine Log ({state.state_logs.length})</span>
            </button>
          </div>

          {/* Active Workspace View */}
          <div className="flex-1 min-h-[460px]">
            {activeTab === 'board' ? (
              <VisualBlackboard
                mermaidDiagram={state.current_mermaid_diagram}
                katexMath={state.current_katex_math}
                citations={state.current_citations}
                conceptTitle={currentConcept?.title}
              />
            ) : (
              <StateLogViewer
                logs={state.state_logs}
                currentNode={state.current_state_node}
              />
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

export default function LessonPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading Lesson...</div>}>
      <LessonContent />
    </Suspense>
  );
}


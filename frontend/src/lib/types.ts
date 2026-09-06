export interface Citation {
  source_doc: string;
  page_or_section: string;
  snippet: string;
  relevance_score: number;
}

export interface Concept {
  id: string;
  title: string;
  summary: string;
  key_points: string[];
  complexity: string;
}

export interface Question {
  id: string;
  concept_id: string;
  question_text: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
}

export interface EvaluationResult {
  is_correct: boolean;
  score: number;
  feedback: string;
  identified_misconception?: string;
  adaptation_needed: boolean;
}

export interface StateLogEntry {
  timestamp: string;
  state_node: string;
  concept_title: string;
  description: string;
  adaptation_reason?: string;
  language: string;
}

export interface LessonState {
  session_id: string;
  topic: string;
  learner_level: string;
  language: string;
  time_budget_minutes: number;
  document_id?: string;
  current_state_node: string;
  current_concept_index: number;
  concepts: Concept[];
  current_explanation?: string;
  current_mermaid_diagram?: string;
  current_katex_math?: string;
  current_citations: Citation[];
  current_audio_url?: string;
  current_video_url?: string;
  current_question?: Question;
  latest_evaluation?: EvaluationResult;
  misconception_history: any[];
  score_history: any[];
  state_logs: StateLogEntry[];
  is_completed: boolean;
}

export interface LessonCreateRequest {
  topic: string;
  learner_level: string;
  language: string;
  time_budget_minutes: number;
  document_id?: string;
}

export interface QuizQuestion {
  id: string;
  concept_title: string;
  question: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
}

export interface LearningReport {
  session_id: string;
  topic: string;
  total_score_pct: number;
  concepts_mastered: string[];
  concepts_needing_review: string[];
  misconceptions_resolved: string[];
  recommended_next_steps: string[];
  summary: string;
}

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Citation(BaseModel):
    source_doc: str
    page_or_section: str
    snippet: str
    relevance_score: float = 0.0

class Concept(BaseModel):
    id: str
    title: str
    summary: str
    key_points: List[str]
    complexity: str = "Beginner"  # Beginner, Intermediate, Advanced

class Question(BaseModel):
    id: str
    concept_id: str
    question_text: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str

class AnswerSubmission(BaseModel):
    session_id: str
    question_id: str
    student_answer: str
    mode: str = "text"  # text or voice

class EvaluationResult(BaseModel):
    is_correct: bool
    score: float  # 0.0 to 1.0
    feedback: str
    identified_misconception: Optional[str] = None
    adaptation_needed: bool = False

class StateLogEntry(BaseModel):
    timestamp: str
    state_node: str
    concept_title: str
    description: str
    adaptation_reason: Optional[str] = None
    language: str = "en"

class LessonState(BaseModel):
    session_id: str
    topic: str
    learner_level: str = "Beginner"  # Beginner, Intermediate, Advanced
    language: str = "en"  # en, hi
    time_budget_minutes: int = 20
    document_id: Optional[str] = None
    
    current_state_node: str = "UNDERSTAND"  # UNDERSTAND, PLAN, EXPLAIN, QUESTION, EVALUATE, ADAPT, CONTINUE, QUIZ, REPORT
    current_concept_index: int = 0
    concepts: List[Concept] = []
    
    current_explanation: Optional[str] = None
    current_mermaid_diagram: Optional[str] = None
    current_katex_math: Optional[str] = None
    current_citations: List[Citation] = []
    current_audio_url: Optional[str] = None
    current_video_url: Optional[str] = None
    
    current_question: Optional[Question] = None
    latest_evaluation: Optional[EvaluationResult] = None
    
    misconception_history: List[Dict[str, Any]] = []
    score_history: List[Dict[str, Any]] = []
    state_logs: List[StateLogEntry] = []
    
    is_completed: bool = False

class LessonCreateRequest(BaseModel):
    topic: str
    learner_level: str = "Beginner"
    language: str = "en"
    time_budget_minutes: int = 20
    document_id: Optional[str] = None

class LanguageSwitchRequest(BaseModel):
    session_id: str
    target_language: str  # "en" or "hi"

class QuizQuestion(BaseModel):
    id: str
    concept_title: str
    question: str
    options: List[str]
    correct_option_index: int
    explanation: str

class LearningReport(BaseModel):
    session_id: str
    topic: str
    total_score_pct: float
    concepts_mastered: List[str]
    concepts_needing_review: List[str]
    misconceptions_resolved: List[str]
    recommended_next_steps: List[str]
    summary: str

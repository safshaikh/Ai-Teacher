import datetime
import uuid
from typing import Dict, Any, Optional
from app.models import (
    LessonState, StateLogEntry, AnswerSubmission, EvaluationResult, LanguageSwitchRequest
)
from app.llm_service import llm_service
from app.rag_engine import rag_engine
from app.tts_service import tts_service
from app.avatar_service import avatar_service

class LessonStateMachine:
    def __init__(self):
        self.active_sessions: Dict[str, LessonState] = {}

    def _log_state(self, state: LessonState, node_name: str, description: str, adaptation_reason: Optional[str] = None):
        now_str = datetime.datetime.now().strftime("%H:%M:%S")
        concept_title = state.concepts[state.current_concept_index].title if state.concepts and state.current_concept_index < len(state.concepts) else state.topic
        
        entry = StateLogEntry(
            timestamp=now_str,
            state_node=node_name,
            concept_title=concept_title,
            description=description,
            adaptation_reason=adaptation_reason,
            language=state.language
        )
        state.state_logs.append(entry)
        state.current_state_node = node_name

    async def initialize_lesson(self, topic: str, level: str, time_budget: int, language: str, document_id: Optional[str] = None) -> LessonState:
        session_id = str(uuid.uuid4())[:8]
        
        state = LessonState(
            session_id=session_id,
            topic=topic,
            learner_level=level,
            language=language,
            time_budget_minutes=time_budget,
            document_id=document_id
        )
        
        # 1. Node: UNDERSTAND
        doc_summary = None
        if document_id and document_id in rag_engine.documents:
            doc_meta = rag_engine.documents[document_id]
            doc_summary = f"Uploaded PDF: {doc_meta['filename']} ({doc_meta['total_chunks']} chunks)"
            
        self._log_state(state, "UNDERSTAND", f"Analyzed learner profile ({level}, {time_budget}m, language={language}) & document context.")
        
        # 2. Node: PLAN
        concepts = llm_service.generate_lesson_plan(topic, level, time_budget, doc_summary=doc_summary, language=language)
        state.concepts = concepts
        self._log_state(state, "PLAN", f"Generated structured lesson plan with {len(concepts)} sequenced concepts.")
        
        # 3. Node: EXPLAIN (First concept)
        await self._execute_explain_node(state)
        
        self.active_sessions[session_id] = state
        return state

    async def _execute_explain_node(self, state: LessonState, misconception: Optional[str] = None):
        concept = state.concepts[state.current_concept_index]
        
        # Retrieve RAG citations if document attached
        citations = []
        if state.document_id:
            citations = rag_engine.query_citations(state.document_id, query=f"{concept.title} {concept.summary}", top_k=2)
            state.current_citations = citations

        # Generate LLM explanation + Mermaid diagram + KaTeX formula
        exp_data = llm_service.generate_explanation(concept, state.learner_level, state.language, citations, misconception=misconception)
        
        state.current_explanation = exp_data["narration"]
        state.current_mermaid_diagram = exp_data.get("mermaid_diagram")
        state.current_katex_math = exp_data.get("katex_math")
        
        # Generate TTS audio
        audio_url = await tts_service.generate_speech(state.current_explanation, language=state.language)
        state.current_audio_url = audio_url
        
        # Generate Avatar video
        video_url = avatar_service.generate_avatar_video(audio_url)
        state.current_video_url = video_url

        if misconception:
            self._log_state(state, "ADAPT", f"Adapted explanation for '{concept.title}' addressing misconception: {misconception}", adaptation_reason=misconception)
        else:
            self._log_state(state, "EXPLAIN", f"Explaining Concept {state.current_concept_index + 1}/{len(state.concepts)}: '{concept.title}' through avatar narration & visual diagram.")

        # Generate question for next step
        question = llm_service.generate_question(concept, language=state.language)
        state.current_question = question

    async def submit_answer(self, submission: AnswerSubmission) -> LessonState:
        session_id = submission.session_id
        if session_id not in self.active_sessions:
            raise ValueError("Session not found")
            
        state = self.active_sessions[session_id]
        question = state.current_question
        
        if not question:
            raise ValueError("No active question found for evaluation")

        # 1. Node: EVALUATE
        self._log_state(state, "EVALUATE", f"Evaluating student answer: '{submission.student_answer}'")
        eval_result = llm_service.evaluate_answer(question, submission.student_answer, language=state.language)
        state.latest_evaluation = eval_result
        
        state.score_history.append({
            "concept_index": state.current_concept_index,
            "concept_title": state.concepts[state.current_concept_index].title,
            "is_correct": eval_result.is_correct,
            "score": eval_result.score
        })

        if eval_result.adaptation_needed:
            # Trigger ADAPT
            state.misconception_history.append({
                "concept_id": question.concept_id,
                "description": eval_result.identified_misconception,
                "wrong_answer": submission.student_answer
            })
            await self._execute_explain_node(state, misconception=eval_result.identified_misconception)
        else:
            # Advance to CONTINUE or next concept
            self._log_state(state, "CONTINUE", f"Concept {state.current_concept_index + 1} mastered! Preparing next lesson step.")

        return state

    async def advance_next_concept(self, session_id: str) -> LessonState:
        if session_id not in self.active_sessions:
            raise ValueError("Session not found")
            
        state = self.active_sessions[session_id]
        
        if state.current_concept_index + 1 < len(state.concepts):
            state.current_concept_index += 1
            await self._execute_explain_node(state)
        else:
            # All concepts finished -> Node: QUIZ
            state.current_state_node = "QUIZ"
            self._log_state(state, "QUIZ", "All lesson concepts completed! Initiating final evaluation quiz.")
            state.is_completed = True
            
        return state

    async def switch_language(self, request: LanguageSwitchRequest) -> LessonState:
        session_id = request.session_id
        if session_id not in self.active_sessions:
            raise ValueError("Session not found")
            
        state = self.active_sessions[session_id]
        target_lang = request.target_language
        
        if state.language == target_lang:
            return state

        state.language = target_lang
        self._log_state(state, "ADAPT", f"Mid-lesson language switched to '{target_lang.upper()}'. Re-rendering narration & audio without resetting progress.")
        
        # Re-run explain node for current concept in new language
        await self._execute_explain_node(state)
        return state

state_machine = LessonStateMachine()

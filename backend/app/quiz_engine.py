from typing import List
from app.models import LessonState, QuizQuestion, LearningReport
from app.llm_service import llm_service

class QuizEngine:
    def generate_final_quiz(self, state: LessonState) -> List[QuizQuestion]:
        quiz_questions = []
        lang_hi = (state.language == "hi")
        
        for i, concept in enumerate(state.concepts):
            q = llm_service.generate_question(concept, language=state.language)
            opts = q.options or [
                f"A) {concept.key_points[0] if concept.key_points else 'Core Principle'}",
                "B) Invalid concept state",
                "C) Arbitrary value",
                "D) None of the above"
            ]
            quiz_questions.append(QuizQuestion(
                id=f"quiz_q_{i+1}",
                concept_title=concept.title,
                question=q.question_text,
                options=opts,
                correct_option_index=0,
                explanation=q.explanation
            ))
            
        return quiz_questions

    def generate_learning_report(self, state: LessonState, quiz_answers: List[int]) -> LearningReport:
        total_questions = len(quiz_answers)
        correct_count = 0
        mastered = []
        needing_review = []
        
        for idx, concept in enumerate(state.concepts):
            selected = quiz_answers[idx] if idx < len(quiz_answers) else -1
            if selected == 0:  # Correct option is index 0 in default generated quiz
                correct_count += 1
                mastered.append(concept.title)
            else:
                needing_review.append(concept.title)

        pct = (correct_count / max(total_questions, 1)) * 100.0
        lang_hi = (state.language == "hi")
        
        resolved_misconceptions = [m.get("description", "Concept clarification") for m in state.misconception_history]
        
        if lang_hi:
            summary = f"आपने '{state.topic}' पाठ पूरा कर लिया है! आपका कुल स्कोर {pct:.1f}% रहा।"
            next_steps = [
                f"मास्टर की गई अवधारणा का अभ्यास जारी रखें: {mastered[0] if mastered else state.topic}",
                f"समीक्षा करें: {needing_review[0] if needing_review else 'उन्नत अनुप्रयोग'}",
                "अगला संबंधित अध्याय शुरू करें"
            ]
        else:
            summary = f"Congratulations! You completed the lesson on '{state.topic}' with an overall score of {pct:.1f}%."
            next_steps = [
                f"Reinforce mastered concepts: {', '.join(mastered) if mastered else state.topic}",
                f"Focus extra practice on: {', '.join(needing_review) if needing_review else 'Advanced edge cases'}",
                "Proceed to the next module in your personalized learning path."
            ]

        return LearningReport(
            session_id=state.session_id,
            topic=state.topic,
            total_score_pct=pct,
            concepts_mastered=mastered,
            concepts_needing_review=needing_review,
            misconceptions_resolved=resolved_misconceptions,
            recommended_next_steps=next_steps,
            summary=summary
        )

quiz_engine = QuizEngine()

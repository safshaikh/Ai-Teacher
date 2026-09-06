import json
import os
import re
from typing import List, Dict, Any, Optional
from app.config import settings
from app.models import Concept, Question, EvaluationResult, Citation

class LLMService:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER

    def _call_gemini(self, prompt: str) -> str:
        try:
            import google.generativeai as genai
            api_key = settings.GEMINI_API_KEY or settings.LLM_API_KEY
            if api_key:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                res = model.generate_content(prompt)
                return res.text
        except Exception as e:
            print(f"Gemini call failed: {e}")
        return ""

    def _call_openai(self, prompt: str) -> str:
        try:
            import requests
            api_key = settings.OPENAI_API_KEY or settings.LLM_API_KEY
            if api_key:
                headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7
                }
                resp = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=15)
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"OpenAI call failed: {e}")
        return ""

    def generate_text(self, prompt: str) -> str:
        if self.provider == "gemini":
            res = self._call_gemini(prompt)
            if res:
                return res
        elif self.provider == "openai":
            res = self._call_openai(prompt)
            if res:
                return res
        return ""

    def generate_lesson_plan(self, topic: str, level: str, time_minutes: int, doc_summary: Optional[str] = None, language: str = "en") -> List[Concept]:
        prompt = f"""
Create a structured lesson plan for topic: '{topic}'.
Learner Level: {level}. Time available: {time_minutes} minutes. Target Language: {language}.
Document Context: {doc_summary or 'None'}.

Output MUST be a valid JSON array of 3 to 4 concept objects. Each object has:
- "id": string ("concept_1", "concept_2", etc.)
- "title": string (Clear title)
- "summary": string (Brief summary of concept)
- "key_points": list of 3 bullet strings
- "complexity": string ("Beginner", "Intermediate", or "Advanced")

Output raw JSON array only, no markdown code block backticks.
        """
        raw = self.generate_text(prompt)
        if raw:
            try:
                cleaned = re.sub(r'```json\s*|\s*```', '', raw).strip()
                items = json.loads(cleaned)
                return [Concept(**item) for item in items]
            except Exception as e:
                print(f"Failed to parse LLM lesson plan: {e}")

        # Structured Fallback Lesson Plan Generator
        lang_hi = (language == "hi")
        if "python" in topic.lower() or "code" in topic.lower() or "programming" in topic.lower():
            return [
                Concept(
                    id="concept_1",
                    title="बुनियादी अवधारणाएं और सिंटैक्स (Basic Syntax & Variables)" if lang_hi else "Core Variables & Dynamic Typing",
                    summary="समझें कि डेटा मेमोरी में कैसे संग्रहीत होता है और पायथन वेरिएबल्स कैसे काम करते हैं।" if lang_hi else "Understand how memory allocation and dynamic typing work in Python.",
                    key_points=[
                        "वेरिएबल निर्माण और प्रकार अनुमान (Variables & type inference)" if lang_hi else "Variable creation & dynamic type inference",
                        "मूलभूत डेटा प्रकार: int, float, string, bool" if lang_hi else "Primitive types: int, float, string, boolean",
                        "मेमोरी संदर्भ और म्यूटैबिलिटी" if lang_hi else "Memory references and mutability fundamentals"
                    ],
                    complexity="Beginner"
                ),
                Concept(
                    id="concept_2",
                    title="नियंत्रण प्रवाह और लूप्स (Control Flow & Iteration)" if lang_hi else "Control Flow & Conditional Logic",
                    summary="सशर्त कथनों और लूप्स के साथ निष्पादन का प्रबंधन करें।" if lang_hi else "Manage program execution branching with conditional statements and loops.",
                    key_points=[
                        "If-elif-else निर्णय संरचनाएं" if lang_hi else "If-elif-else execution branching",
                        "For and while लूप निष्पादन" if lang_hi else "For loops, while loops, and range generation",
                        "Break, continue और पास कीवर्ड" if lang_hi else "Break, continue, and loop control statements"
                    ],
                    complexity="Intermediate"
                ),
                Concept(
                    id="concept_3",
                    title="फ़ंक्शन और मॉड्यूलैरिटी (Functions & Modular Design)" if lang_hi else "Modular Functions & Scope",
                    summary="पुनः प्रयोज्य कोड ब्लॉक बनाएं और स्कोप प्रबंधित करें।" if lang_hi else "Encapsulate clean, reusable logic blocks with scoping controls.",
                    key_points=[
                        "Def कीवर्ड के साथ फ़ंक्शन परिभाषाएं" if lang_hi else "Function definition with def keyword & parameters",
                        "रिटर्न मान और डिफ़ॉल्ट तर्क" if lang_hi else "Return values, default positional & keyword arguments",
                        "लोकल बनाम ग्लोबल वेरिएबल स्कोप" if lang_hi else "Local vs global variable scope boundaries"
                    ],
                    complexity="Advanced"
                )
            ]
        else:
            return [
                Concept(
                    id="concept_1",
                    title=f"परिचय: {topic} (Foundations of {topic})" if lang_hi else f"Foundations of {topic}",
                    summary=f"{topic} के मूल सिद्धांतों और मूल अवधारणाओं को समझें।" if lang_hi else f"Master the essential core principles behind {topic}.",
                    key_points=[
                        "मुख्य शब्दावली और परिभाषाएं" if lang_hi else "Key definitions and core terminology",
                        "यह विषय क्यों महत्वपूर्ण है" if lang_hi else "Real-world significance and practical use cases",
                        "मूलभूत तंत्र और प्रवाह" if lang_hi else "Underlying mechanism and step-by-step framework"
                    ],
                    complexity="Beginner"
                ),
                Concept(
                    id="concept_2",
                    title=f"{topic} का गहराई से विश्लेषण (Deep Analysis)" if lang_hi else f"Deep Architectural Analysis of {topic}",
                    summary=f"{topic} के घटकों के बीच संबंधों की जांच करें।" if lang_hi else f"Examine key relationships and sub-components of {topic}.",
                    key_points=[
                        "घटक इंटरैक्शन" if lang_hi else "Inter-component interaction & logic flow",
                        "सामान्य पैटर्न और नियम" if lang_hi else "Common structural patterns & operational constraints",
                        "प्रैक्टिकल उदाहरण विश्लेषण" if lang_hi else "Applied practical walkthrough"
                    ],
                    complexity="Intermediate"
                ),
                Concept(
                    id="concept_3",
                    title=f"{topic} में उन्नत अनुप्रयोग (Advanced Applications)" if lang_hi else f"Advanced Strategy & Optimization of {topic}",
                    summary=f"{topic} में जटिल समस्याओं को हल करें और अनुकूलित करें।" if lang_hi else f"Apply high-level problem solving and optimization in {topic}.",
                    key_points=[
                        "सर्वोत्तम अभ्यास और दिशानिर्देश" if lang_hi else "Industry best practices and edge case management",
                        "प्रदर्शन और स्केलेबिलिटी" if lang_hi else "Efficiency optimization techniques",
                        "वास्तविक दुनिया का मामला अध्ययन" if lang_hi else "Comprehensive case study evaluation"
                    ],
                    complexity="Advanced"
                )
            ]

    def generate_explanation(self, concept: Concept, level: str, language: str, citations: List[Citation], misconception: Optional[str] = None) -> Dict[str, Any]:
        citation_text = ""
        if citations:
            citation_text = "\nVerified Source Grounding (Citations):\n" + "\n".join([f"- [{c.source_doc} {c.page_or_section}]: {c.snippet}" for c in citations])

        prompt = f"""
You are an expert, encouraging AI Teacher teaching the concept: '{concept.title}'.
Learner Level: {level}. Language: {language}.
{citation_text}
{f"Address this misconception: {misconception}" if misconception else ""}

Provide a clear explanation with:
1. Clear narration text (suitable for video TTS audio).
2. A Mermaid.js diagram definition (graph TD or sequenceDiagram).
3. A KaTeX math formula or code snippet.

Output JSON only with keys: "narration", "mermaid_diagram", "katex_math".
        """
        raw = self.generate_text(prompt)
        if raw:
            try:
                cleaned = re.sub(r'```json\s*|\s*```', '', raw).strip()
                return json.loads(cleaned)
            except Exception as e:
                print(f"Failed to parse LLM explanation JSON: {e}")

        # Fallback explanation generator
        lang_hi = (language == "hi")
        if lang_hi:
            narration = f"नमस्ते! आज हम '{concept.title}' सीखने जा रहे हैं। {concept.summary} मुख्य बात यह है कि हमें इसके प्रवाह को समझना होगा। आइए स्क्रीन पर दिए गए चित्र और सूत्र को देखें।"
            mermaid = """graph TD
    A[शुरुआत: मुख्य विचार] --> B[प्रक्रिया और विश्लेषण]
    B --> C[निष्कर्ष और परिणाम]
    B --> D[व्यावहारिक उपयोग]"""
            katex = r"f(x) = \sum_{i=1}^{n} w_i \cdot x_i + b \quad \text{(अनुकूलित परिणाम)}"
        else:
            narration = f"Welcome! Today we are exploring '{concept.title}'. {concept.summary} To truly master this, let's break down how each element connects step-by-step. Take a look at our visual diagram on the board."
            mermaid = f"""graph TD
    Start["{concept.title}"] --> Process["Core Logic & Processing"]
    Process --> Output["Mastery & Practical Application"]
    Process --> Feedback["Adaptive Loop & Evaluation"]"""
            katex = r"E(x) = \lim_{n \to \infty} \left(1 + \frac{x}{n}\right)^n \quad \text{and} \quad \nabla L(\theta) = 0"

        if citations:
            c = citations[0]
            narration += f" As referenced in our textbook source '{c.source_doc}', {c.snippet[:100]}..."

        return {
            "narration": narration,
            "mermaid_diagram": mermaid,
            "katex_math": katex
        }

    def generate_question(self, concept: Concept, language: str = "en") -> Question:
        prompt = f"""
Generate a multiple-choice question to test understanding of concept: '{concept.title}'.
Language: {language}.

Output JSON object with keys:
- "id": string ("q1", "q2", etc.)
- "concept_id": string ("{concept.id}")
- "question_text": string
- "options": list of 4 option strings (A, B, C, D)
- "correct_answer": string (must match one option exactly)
- "explanation": string (why it is correct)
        """
        raw = self.generate_text(prompt)
        if raw:
            try:
                cleaned = re.sub(r'```json\s*|\s*```', '', raw).strip()
                data = json.loads(cleaned)
                return Question(**data)
            except Exception as e:
                print(f"Failed to parse LLM question JSON: {e}")

        # Fallback question
        lang_hi = (language == "hi")
        if lang_hi:
            return Question(
                id=f"q_{concept.id}",
                concept_id=concept.id,
                question_text=f"'{concept.title}' का मुख्य उद्देश्य क्या है?",
                options=[
                    f"A) {concept.key_points[0] if concept.key_points else 'मूल सिद्धांत'}",
                    "B) बिना किसी नियम के यादृच्छिक निष्पादन",
                    "C) केवल डेटा मिटाना",
                    "D) ऊपर से कोई भी नहीं"
                ],
                correct_answer=f"A) {concept.key_points[0] if concept.key_points else 'मूल सिद्धांत'}",
                explanation=f"विकल्प A सही है क्योंकि '{concept.title}' की प्राथमिक नींव इसी नियम पर आधारित है।"
            )
        else:
            return Question(
                id=f"q_{concept.id}",
                concept_id=concept.id,
                question_text=f"What is the primary operational objective of '{concept.title}'?",
                options=[
                    f"A) {concept.key_points[0] if concept.key_points else 'Core principle execution'}",
                    "B) Arbitrary memory deletion without state persistence",
                    "C) Static non-executing code declaration",
                    "D) None of the above"
                ],
                correct_answer=f"A) {concept.key_points[0] if concept.key_points else 'Core principle execution'}",
                explanation=f"Option A accurately describes the primary functional role of {concept.title}."
            )

    def evaluate_answer(self, question: Question, student_answer: str, language: str = "en") -> EvaluationResult:
        # Check simple matching first
        answer_clean = student_answer.strip().lower()
        correct_clean = question.correct_answer.strip().lower()
        
        is_correct = (correct_clean in answer_clean) or (answer_clean in correct_clean) or ("a" in answer_clean and "a)" in correct_clean)
        
        if is_correct:
            feedback = "शाबाश! आपका उत्तर बिल्कुल सही है।" if language == "hi" else "Excellent! Your answer is spot on."
            return EvaluationResult(
                is_correct=True,
                score=1.0,
                feedback=feedback,
                identified_misconception=None,
                adaptation_needed=False
            )
        else:
            feedback = f"अच्छा प्रयास! सही उत्तर था: {question.correct_answer}. {question.explanation}" if language == "hi" else f"Good attempt! The correct answer is: {question.correct_answer}. {question.explanation}"
            misconception = f"Student confused {question.question_text} with alternative options."
            return EvaluationResult(
                is_correct=False,
                score=0.0,
                feedback=feedback,
                identified_misconception=misconception,
                adaptation_needed=True
            )

llm_service = LLMService()

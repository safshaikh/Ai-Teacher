# RAG & Adaptive Teaching Specification

## 1. RAG & Knowledge Grounding (15% Weight)

### Ingestion & Chunking
1. **Document Parsers**:
   - `PyMuPDF` (`fitz`): Extracts text from PDF files page-by-page.
   - `python-docx`: Extracts text from Word documents preserving section headings.
   - `python-pptx`: Extracts text from PowerPoint slides.
2. **Text Chunking**:
   - Recursive text splitter divides document text into ~400-word chunks with 50-word overlap.
   - Preserves section and page location metadata for precise citations.

### Retrieval & Citation Surfacing
- On every `EXPLAIN` node execution, the top-2 most relevant document chunks are retrieved via term/vector similarity scoring.
- Prompt injection requires the model to reference source snippets.
- Citations are returned in the `current_citations` field and rendered as interactive badges on the Visual Blackboard (`VisualBlackboard.tsx`).

---

## 2. Human-Like Teaching & Adaptation (20% Weight)

### Misconception Detection & Re-Explanation
- When a student answers a mid-lesson question incorrectly, `llm_service.evaluate_answer` identifies the specific misconception (e.g. "confused stack memory with heap memory allocation").
- The state machine transitions to `ADAPT`.
- The system logs an entry in `state_logs` detailing:
  - Timestamp
  - Node: `ADAPT`
  - Concept: Current concept title
  - Adaptation Reason: Specific misconception identified
- The LLM re-explains the concept using a **different angle/analogy** (e.g., visual diagram or real-world metaphor), ensuring the student is not simply told "incorrect, try again".

---

## 3. Multilingual Support (10% Weight)

- Mid-lesson language switching allows switching between **English** and **Hindi** at any point.
- The `switch_language` state endpoint updates the `language` field on the session object, logs an `ADAPT` state transition, and re-generates narration and TTS audio in the target language while maintaining concept step and score history.

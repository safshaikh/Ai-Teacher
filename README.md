# 🎓 AI Teacher — Human-Like AI Educator

> **Hackathon Submission Project**: An intelligent, adaptive AI educator that plans personalized lessons, teaches through narrated avatar video, grounds explanations in uploaded documents (RAG), evaluates answers interactively, adapts dynamically to student misconceptions, supports mid-lesson language switching (English ↔ Hindi), and generates detailed learning reports.

---

## 🌟 Key Features

- **🎓 Human-Like Teaching & Adaptation (20% Weight)**: Explicit state machine modeling (`Understand` → `Plan` → `Explain` → `Question` → `Evaluate` → `Adapt` → `Continue`). When a student makes a mistake, the system identifies the specific misconception and re-explains using a fresh analogy/angle rather than a generic "try again".
- **📚 RAG & Knowledge Grounding (15% Weight)**: Upload PDF, DOCX, PPTX textbook files. Recursive chunking and Chroma vector DB storage force explanations to cite verified source snippets, displayed as interactive badges on the visual board.
- **🎥 AI Teaching Video & Avatar (15% + 10% Weight)**: Decoupled `AvatarService` with TTS narration audio (English & Hindi) and avatar talking head player (HeyGen, D-ID, and fallback canvas sync engine).
- **🌐 Multilingual Capability (10% Weight)**: Mid-lesson language toggle (English ↔ Hindi) without resetting state or score progress.
- **📊 Visual Blackboard & Diagrams**: Dynamic rendering of Mermaid.js flowcharts, KaTeX math formulas, code snippets, and source citations.
- **📱 Fully Mobile Responsive**: Modern dark glassmorphism UI with collapsible state logs drawer and touch-friendly controls.
- **🚀 Ready for GitHub & Vercel**: Production-ready Next.js 14 frontend + FastAPI backend.

---

## 🏗️ Project Architecture

```
ai-teacher/
├── frontend/                 # Next.js 14 (App Router) + Tailwind CSS + Mermaid + KaTeX
│   ├── src/
│   │   ├── app/              # Page routes (Setup, Interactive Classroom, Report)
│   │   ├── components/       # AvatarPlayer, VisualBlackboard, StateLogViewer, QA, etc.
│   │   └── lib/              # API client & TypeScript interfaces
│   └── vercel.json           # Vercel deployment config
├── backend/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py           # REST APIs, CORS & WebSockets
│   │   ├── state_machine.py  # LangGraph lesson state machine
│   │   ├── rag_engine.py     # Document parsers & Chroma RAG retriever
│   │   ├── llm_service.py    # LLM engine (Gemini / OpenAI / Smart Fallback)
│   │   ├── tts_service.py    # Edge-TTS / gTTS (Hindi + English)
│   │   └── avatar_service.py # Decoupled Avatar API interface
│   └── Dockerfile
└── docs/                     # Full submission documentation
    ├── ARCHITECTURE.md
    ├── RAG_AND_ADAPTATION.md
    └── DEPLOYMENT.md
```

---

## ⚡ Quick Start (Local Setup)

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app/main.py
```
FastAPI server runs on `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Next.js app runs on `http://localhost:3000`.

---

## 🔑 Environment Variables

See `backend/.env.example`:
- `LLM_PROVIDER`: `gemini` or `openai`
- `LLM_API_KEY`: Your API Key
- `TTS_PROVIDER`: `edge_tts`
- `AVATAR_PROVIDER`: `synthesized` (or `did` / `heygen`)

*Note: The app includes built-in fallbacks so it runs 100% executable even without external API keys!*

---

## 📜 Documentation & Evaluation Brief Alignment

- [Architecture Overview](docs/ARCHITECTURE.md)
- [RAG & Adaptive Teaching Details](docs/RAG_AND_ADAPTATION.md)
- [Deployment Guide (Vercel & Railway)](docs/DEPLOYMENT.md)

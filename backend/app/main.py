import os
import shutil
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.config import settings
from app.models import (
    LessonCreateRequest, LessonState, AnswerSubmission, LanguageSwitchRequest,
    LearningReport, QuizQuestion
)
from app.state_machine import state_machine
from app.rag_engine import rag_engine
from app.quiz_engine import quiz_engine

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for Next.js frontend (local dev & Vercel deployment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for TTS audio & generated media
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")
MEDIA_DIR = os.path.join(STATIC_DIR, "media")
UPLOADS_DIR = os.path.join(STATIC_DIR, "uploads")
os.makedirs(MEDIA_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

class QuizSubmitRequest(BaseModel):
    session_id: str
    quiz_answers: List[int]

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.post("/api/upload-document")
async def upload_document(file: UploadFile = File(...)):
    try:
        file_path = os.path.join(UPLOADS_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        doc_id = rag_engine.process_and_index_document(file_path, file.filename)
        doc_info = rag_engine.documents[doc_id]
        
        return {
            "status": "success",
            "document_id": doc_id,
            "filename": file.filename,
            "chunks_count": doc_info["total_chunks"],
            "message": f"Document '{file.filename}' processed & indexed successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@app.post("/api/create-lesson", response_model=LessonState)
async def create_lesson(req: LessonCreateRequest):
    try:
        state = await state_machine.initialize_lesson(
            topic=req.topic,
            level=req.learner_level,
            time_budget=req.time_budget_minutes,
            language=req.language,
            document_id=req.document_id
        )
        return state
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create lesson: {str(e)}")

@app.get("/api/lesson/{session_id}", response_model=LessonState)
async def get_lesson_state(session_id: str):
    if session_id not in state_machine.active_sessions:
        raise HTTPException(status_code=404, detail="Lesson session not found")
    return state_machine.active_sessions[session_id]

@app.post("/api/submit-answer", response_model=LessonState)
async def submit_answer(submission: AnswerSubmission):
    try:
        state = await state_machine.submit_answer(submission)
        return state
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate answer: {str(e)}")

@app.post("/api/advance-concept", response_model=LessonState)
async def advance_concept(req: dict):
    session_id = req.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    try:
        state = await state_machine.advance_next_concept(session_id)
        return state
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to advance concept: {str(e)}")

@app.post("/api/switch-language", response_model=LessonState)
async def switch_language(req: LanguageSwitchRequest):
    try:
        state = await state_machine.switch_language(req)
        return state
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to switch language: {str(e)}")

@app.get("/api/quiz/{session_id}", response_model=List[QuizQuestion])
async def get_quiz(session_id: str):
    if session_id not in state_machine.active_sessions:
        raise HTTPException(status_code=404, detail="Lesson session not found")
    state = state_machine.active_sessions[session_id]
    return quiz_engine.generate_final_quiz(state)

@app.post("/api/submit-quiz", response_model=LearningReport)
async def submit_quiz(req: QuizSubmitRequest):
    if req.session_id not in state_machine.active_sessions:
        raise HTTPException(status_code=404, detail="Lesson session not found")
    state = state_machine.active_sessions[req.session_id]
    report = quiz_engine.generate_learning_report(state, req.quiz_answers)
    return report

@app.websocket("/ws/lesson/{session_id}")
async def websocket_lesson_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            if session_id in state_machine.active_sessions:
                state = state_machine.active_sessions[session_id]
                await websocket.send_json(state.dict())
            else:
                await websocket.send_json({"error": "Session not found"})
    except WebSocketDisconnect:
        print(f"WebSocket client disconnected for session {session_id}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

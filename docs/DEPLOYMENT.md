# Deployment Guide - Vercel & Railway / Render

## 1. Frontend Deployment (Vercel)

### Prerequisites
- GitHub repository containing this project.
- Vercel account connected to GitHub.

### Steps
1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - AI Teacher application"
   git remote add origin https://github.com/YOUR_USERNAME/ai-teacher.git
   git push -u origin main
   ```
2. Open [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
3. Select your `ai-teacher` GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Configure Environment Variables in Vercel settings:
   - `NEXT_PUBLIC_API_URL`: Your deployed FastAPI backend URL (e.g. `https://ai-teacher-backend.up.railway.app`)
6. Click **Deploy**. Vercel will automatically build and deploy the Next.js frontend!

---

## 2. Backend Deployment (Railway / Render / Fly.io / Docker)

### Option A: Railway Deployment
1. Log in to [Railway.app](https://railway.app/).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `ai-teacher` repository and set **Root Directory** to `backend`.
4. Add Environment Variables:
   - `LLM_PROVIDER`: `gemini` or `openai`
   - `LLM_API_KEY`: Your API key
   - `TTS_PROVIDER`: `edge_tts`
   - `AVATAR_PROVIDER`: `synthesized`
5. Railway will detect the `Dockerfile` in `backend` and build the container automatically.
6. Copy your public Railway app URL and set it as `NEXT_PUBLIC_API_URL` in Vercel.

---

## 3. Local Development Setup

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python app/main.py
```
Backend will run at: `http://localhost:8000` (Docs at `http://localhost:8000/docs`).

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Frontend will run at: `http://localhost:3000`.

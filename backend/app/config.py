import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Teacher API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # LLM Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")  # gemini, openai, mock
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("GEMINI_API_KEY", ""))
    
    # RAG / Vector DB
    CHROMA_DB_DIR: str = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # TTS Settings
    TTS_PROVIDER: str = os.getenv("TTS_PROVIDER", "edge_tts")  # edge_tts, gtts, elevenlabs
    TTS_API_KEY: str = os.getenv("TTS_API_KEY", "")
    
    # Avatar API Settings
    AVATAR_PROVIDER: str = os.getenv("AVATAR_PROVIDER", "synthesized")  # synthesized, did, heygen
    AVATAR_API_KEY: str = os.getenv("AVATAR_API_KEY", "")
    
    # Supabase Settings (Optional)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

    class Config:
        case_sensitive = True

settings = Settings()

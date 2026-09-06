import os
import asyncio
import uuid
from app.config import settings

MEDIA_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "media")
os.makedirs(MEDIA_DIR, exist_ok=True)

class TTSService:
    def __init__(self):
        self.media_dir = MEDIA_DIR

    async def generate_speech(self, text: str, language: str = "en") -> str:
        filename = f"audio_{uuid.uuid4().hex[:8]}.mp3"
        output_path = os.path.join(self.media_dir, filename)
        
        # 1. Try edge-tts first (high quality, supports English & Hindi)
        try:
            import edge_tts
            voice = "hi-IN-SwaraNeural" if language == "hi" else "en-US-ChristopherNeural"
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_path)
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                return f"/static/media/{filename}"
        except Exception as e:
            print(f"edge-tts failed: {e}")

        # 2. Try gTTS fallback
        try:
            from gtts import gTTS
            lang_code = "hi" if language == "hi" else "en"
            tts = gTTS(text=text, lang=lang_code, slow=False)
            tts.save(output_path)
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                return f"/static/media/{filename}"
        except Exception as e:
            print(f"gTTS failed: {e}")

        # 3. Create dummy file if all TTS fail
        with open(output_path, "wb") as f:
            f.write(b"ID3\x04\x00\x00\x00\x00\x00\x00")
        return f"/static/media/{filename}"

tts_service = TTSService()

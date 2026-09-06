import os
import requests
import uuid
from typing import Optional
from app.config import settings

class AvatarService:
    def __init__(self):
        self.provider = settings.AVATAR_PROVIDER
        self.api_key = settings.AVATAR_API_KEY

    def _generate_did_video(self, audio_url: str, avatar_image_url: str) -> Optional[str]:
        try:
            headers = {
                "Authorization": f"Basic {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "script": {
                    "type": "audio",
                    "audio_url": audio_url
                },
                "source_url": avatar_image_url or "https://create-images-results.d-id.com/Default_Avatar.png"
            }
            res = requests.post("https://api.d-id.com/talks", json=payload, headers=headers, timeout=10)
            if res.status_code == 201:
                return res.json().get("result_url")
        except Exception as e:
            print(f"D-ID API call failed: {e}")
        return None

    def _generate_heygen_video(self, audio_url: str, avatar_id: str) -> Optional[str]:
        try:
            headers = {
                "X-Api-Key": self.api_key,
                "Content-Type": "application/json"
            }
            payload = {
                "video_inputs": [
                    {
                        "character": {"type": "avatar", "avatar_id": avatar_id or "Daisy-app-2023"},
                        "voice": {"type": "audio", "audio_url": audio_url}
                    }
                ]
            }
            res = requests.post("https://api.heygen.com/v2/video/generate", json=payload, headers=headers, timeout=10)
            if res.status_code == 200:
                return res.json().get("data", {}).get("video_url")
        except Exception as e:
            print(f"HeyGen API call failed: {e}")
        return None

    def generate_avatar_video(self, audio_url: str, avatar_image_url: Optional[str] = None) -> str:
        if self.provider == "did" and self.api_key:
            url = self._generate_did_video(audio_url, avatar_image_url)
            if url:
                return url

        if self.provider == "heygen" and self.api_key:
            url = self._generate_heygen_video(audio_url, avatar_image_url)
            if url:
                return url

        # Default Synthesized Talking Avatar Video / Audio Sync stream
        # When cloud API key is missing or offline, return audio_url as the direct media source
        # which the frontend AvatarVideoPlayer component renders using HTML5 Canvas Lip-Sync animation!
        return audio_url

avatar_service = AvatarService()

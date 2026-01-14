import os
from src.services.groq_service import GroqService
from src.services.ollama_service import OllamaService
from src.services.hugging_face_service import HuggingFaceService

class AIFactory:
    @staticmethod
    def create_service():
        provider = os.getenv("AI_PROVIDER", "ollama").lower()
        print(f"🏭 Factory: Initializing {provider.upper()} service...")

        if provider == "groq":
            return GroqService()
        elif provider == "ollama":
            return OllamaService()
        elif provider == "huggingface":
            return HuggingFaceService()
        else:
            raise ValueError(f"❌ Unknown AI_PROVIDER: {provider}")
import os
import httpx
from src.llm_client import BaseLLM
from typing import List

class OllamaService(BaseLLM):
    def __init__(self):
        # Use host.docker.internal if inside Docker, else localhost
        base_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
        self.api_url = f"{base_url}/api/generate"
        self.model = os.getenv("AI_MODEL_NAME", "mistral")

    async def complete(self, prompt: str) -> List[str]:
        try:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": 30,
                    "temperature": 0.2,
                    "stop": ["\n"]
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(self.api_url, json=payload, timeout=10.0)
                
            if response.status_code == 200:
                data = response.json()
                return [data.get("response", "")]
            else:
                print(f"❌ Ollama returned status: {response.status_code}")
                return [""]
                
        except Exception as e:
            print(f"❌ Ollama Connection Error: {e}")
            return [""]
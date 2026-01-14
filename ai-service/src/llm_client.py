import os
import httpx
import json

class BaseLLM:
    def __init__(self, base_url=None, model="mistral"):
        # Default to 'host.docker.internal' or service name if running in Docker
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
        self.model = model

    async def complete(self, prompt: str):
        if not prompt:
            return []

        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": 15,
                "temperature": 0.3,
                "top_p": 0.9,
                "repeat_penalty": 1.1
            }
        }

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, json=payload, timeout=30.0)
                resp.raise_for_status()
                data = resp.json()
                return self._normalize(data.get("response", ""))
        except Exception as e:
            print(f"[BaseLLM] Error: {e}")
            return []

    def _normalize(self, text: str):
        # Split by newlines, strip whitespace/quotes, filter empty lines
        lines = text.split("\n")
        normalized = [
            line.strip().strip("'\"“”") 
            for line in lines
        ]
        return [l for l in normalized if l]
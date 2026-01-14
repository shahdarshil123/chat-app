import os
from huggingface_hub import AsyncInferenceClient
from src.llm_client import BaseLLM
from typing import List

class HuggingFaceService(BaseLLM):
    def __init__(self):
        token = os.getenv("HF_API_TOKEN")
        if not token:
            print("⚠️ Warning: HF_API_TOKEN is missing")

        # Select a model repo, e.g., "mistralai/Mistral-7B-Instruct-v0.2"
        self.model = os.getenv("AI_MODEL_NAME", "mistralai/Mistral-7B-Instruct-v0.2")
        self.client = AsyncInferenceClient(token=token)

    async def complete(self, prompt: str) -> List[str]:
        try:
            # text_generation is the raw completion endpoint
            response = await self.client.text_generation(
                prompt=prompt,
                model=self.model,
                max_new_tokens=30,
                temperature=0.2,
                stop_sequences=["\n"] # Stop at new line
            )
            return [response]
        except Exception as e:
            print(f"❌ HuggingFace Error: {e}")
            return [""]
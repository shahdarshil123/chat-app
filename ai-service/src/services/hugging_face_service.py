import os
from huggingface_hub import AsyncInferenceClient
from src.llm_client import BaseLLM
from typing import List

class HuggingFaceService(BaseLLM):
    def __init__(self):
        token = os.getenv("HF_API_TOKEN")
        if not token:
            print("⚠️ Warning: HF_API_TOKEN is missing")

        # Works with google/gemma-2-9b-it, meta-llama/Meta-Llama-3-8B-Instruct, etc.
        self.model = os.getenv("AI_MODEL_NAME", "google/gemma-2-9b-it")
        self.client = AsyncInferenceClient(token=token)

    async def complete(self, prompt: str) -> List[str]:
        try:
            # 1. Convert the raw prompt into a Chat format
            messages = [
                {"role": "user", "content": prompt}
            ]

            # 2. Use chat_completion (compatible with "conversational" task)
            response = await self.client.chat_completion(
                messages=messages,
                model=self.model,
                max_tokens=30,       # Note: use 'max_tokens' here, not 'max_new_tokens'
                temperature=0.2,
                stop=["\n"]          # Stop at newline to act like an autocomplete
            )

            # 3. Extract the clean text
            return [response.choices[0].message.content]

        except Exception as e:
            print(f"❌ HuggingFace Error: {e}")
            return [""]
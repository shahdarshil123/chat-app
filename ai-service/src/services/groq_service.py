import os
from groq import AsyncGroq
from src.llm_client import BaseLLM
from typing import List

class GroqService(BaseLLM):
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            print("⚠️ Warning: GROQ_API_KEY is missing")
            
        self.client = AsyncGroq(api_key=api_key)
        self.model = os.getenv("AI_MODEL_NAME", "llama3-8b-8192")

    async def complete(self, prompt: str) -> List[str]:
        try:
            completion = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    # Groq chat models expect a conversation structure.
                    # We wrap the raw prompt as a user message.
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=30,
                stop=["\n"],  # Stop generating at a new line
                top_p=1,
            )
            return [completion.choices[0].message.content]
        except Exception as e:
            print(f"❌ Groq Error: {e}")
            return [""]
import os
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from src.factory.service_factory import AIFactory
from src.strategy import AutoSuggestStrategy
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()


# Initialize Singletons
llm_client = AIFactory.create_service()
strategy = AutoSuggestStrategy(llm_client)

class SuggestionRequest(BaseModel):
    input: str
    conversation: Optional[List[str]] = []

@app.get("/")
async def health_check():
    return {"status": "online", "message": "AI Service is ready", "model": os.getenv("AI_PROVIDER")}

@app.post("/generate")
async def generate_suggestion(req: SuggestionRequest):
    result = await strategy.generate(req.input, req.conversation)
    return result

# Run with: uvicorn main:app --reload
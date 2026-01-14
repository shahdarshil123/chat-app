from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from src.llm_client import BaseLLM
from src.strategy import AutoSuggestStrategy

app = FastAPI()

# Initialize Singletons
llm_client = BaseLLM() 
strategy = AutoSuggestStrategy(llm_client)

class SuggestionRequest(BaseModel):
    input: str
    conversation: Optional[List[str]] = []

@app.get("/")
async def health_check():
    return {"status": "online", "message": "AI Service is ready"}

@app.post("/generate")
async def generate_suggestion(req: SuggestionRequest):
    result = await strategy.generate(req.input, req.conversation)
    return result

# Run with: uvicorn main:app --reload
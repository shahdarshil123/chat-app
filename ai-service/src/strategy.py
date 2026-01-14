import re
from src.llm_client import BaseLLM

class AutoSuggestStrategy:
    def __init__(self, llm: BaseLLM):
        self.llm = llm

    def is_sentence_complete(self, text: str) -> bool:
        # Regex equivalent to /[.!?]\s*$/
        return bool(re.search(r"[.!?]\s*$", text))

    def should_invoke_llm(self, input_text: str) -> bool:
        if not input_text or len(input_text) < 3:
            return False
        if self.is_sentence_complete(input_text):
            return False
        
        # Check if the last word is at least 2 chars long
        last_word = input_text.split()[-1]
        return len(last_word) >= 2

    async def needs_space(self, input_text: str, suggestion: str) -> bool:
        prompt = f"""
You are a word-boundary classifier.

Decide whether the continuation should START A NEW WORD.
Please understand the semantics of the word gramatically.

Rules: 
- Answer YES if a space is required before the continuation
- Answer NO if the continuation continues the SAME word
- Partial words → NO
- Word completion → NO
- New word → YES

Examples:

Input: "how are you doi"
Continuation: "ng"
Answer: NO

Input: "how are you doing"
Continuation: "today"
Answer: YES

Input: "how are you"
Continuation: "doing"
Answer: YES

Answer ONLY with:
YES or NO

Input:
"{input_text}"

Continuation:
"{suggestion}"

Answer:
"""
        res = await self.llm.complete(prompt)
        # Check if first result contains YES
        return "YES" in (res[0] if res else "")

    async def generate_completion(self, input_text: str, conversation: list[str]) -> str:
        conversation_str = "\n".join(conversation)
        prompt = f"""
Continue the user's sentence naturally.
The user is typing a message.
Only continue the sentence if it is incomplete.

Rules:
- Do NOT complete finished sentences
- Do NOT repeat input conversation or sentences
- Continue from the unfinished sentence
- Max 4 words
- No punctuation at the end
- Return empty if no continuation is needed
- NEVER include leading or trailing spaces

Examples:

Input: "how are you doi"
Completion:
ng

Input: "how are you doing"
Completion:
today

Input: "meeting tomorrow"
Completion:


Conversation:
{conversation_str}

User input:
"{input_text}"

Completion:
"""
        res = await self.llm.complete(prompt)
        return res[0] if res else ""

    async def generate(self, input_text: str, conversation: list[str] = None):
        if conversation is None:
            conversation = []

        if not self.should_invoke_llm(input_text):
            return {"suggestion": ""}

        # 1. Get text continuation
        completion = await self.generate_completion(input_text, conversation)
        if not completion:
            return {"suggestion": ""}

        # 2. Decide spacing
        space_needed = await self.needs_space(input_text, completion)

        # 3. Format
        final_suggestion = f" {completion}" if space_needed else completion
        return {"suggestion": final_suggestion}
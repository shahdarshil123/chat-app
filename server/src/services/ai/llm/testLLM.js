import { BaseLLM } from "./baseLLM.js";

const llm = new BaseLLM({model: "mistral"});

const last_messages = "Hi, Alice";
const partial_input = "let us meet tom";

const prompt1 = `Continue the user's sentence naturally.

Rules:
- Do NOT repeat the input
- Max 10 words
- No punctuation at the end

Conversation:
${last_messages}

User input:
${partial_input}"

Completion:`

const prompt2 = `Generate 3 short replies to the message below.

Rules:
- Friendly and natural
- Max 8 words each
- No emojis
- One reply per line

Message:
${last_messages}"

Replies:`

const result = await llm.complete(prompt2);

console.log(result);
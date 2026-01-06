export class AutoSuggestStrategy {
    constructor(llmAdapter) {
        this.llm = llmAdapter;
    }

    isSentenceComplete(text) {
        return /[.!?]\s*$/.test(text);
    }

    shouldInvokeLLM(input) {
        if (!input || input.length < 3) return false;
        if (this.isSentenceComplete(input)) return false;

        const lastWord = input.split(/\s+/).pop();
        return lastWord.length >= 2;
    }

    /**
     * STEP 1: Decide if a SPACE is needed
     * (LLMs are very good at binary classification)
     */
    async needsSpace(input, suggestion) {
        const prompt = `
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
"${input}"

Continuation:
"${suggestion}"

Answer:
`;

        const res = await this.llm.complete(prompt);
        console.log("LLM response: ", res);
        return res?.[0] === "YES";
    }

    /**
     * STEP 2: Generate continuation text (NO SPACES EVER)
     */
    async generateCompletion(input, conversation) {
        const prompt = `
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
${conversation.join("\n")}

User input:
"${input}"

Completion:
`;

        const res = await this.llm.complete(prompt);
        return res?.[0] || "";
    }

    /**
     * FINAL: Public API
     */
    async generate({ input, conversation = [] }) {
        if (!this.shouldInvokeLLM(input)) {
            return { suggestion: "" };
        }

        // 1️⃣ Get text continuation
        const completion = await this.generateCompletion(input, conversation);
        if (!completion) {
            return { suggestion: "" };
        }

        // 2️⃣ Decide spacing
        const needsSpace = await this.needsSpace(input, completion);

        // 3️⃣ Deterministic formatting (THIS NEVER FAILS)
        return {
            suggestion: needsSpace ? " " + completion : completion
        };
    }
}

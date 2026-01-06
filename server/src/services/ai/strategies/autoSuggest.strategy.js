export class AutoSuggestStrategy {
    constructor(llmAdapter) {
        this.llm = llmAdapter;
    }

    isSentenceComplete(text) {
        return /[.!?]\s*$/.test(text.trim());
    }

    looksIncomplete(text) {
        const incompletePatterns = [
            /\b(to|for|with|at|on)$/i,
            /\b(will|should|can|could|let's|lets)$/i,
            /\b(meet|call|send|do|check)$/i
        ];

        return incompletePatterns.some(p => p.test(text.trim()));
    }

    shouldInvokeLLM(input) {
        console.log("check1");
        if (!input || input.length < 3) return false;

        console.log("check2");
        if (this.isSentenceComplete(input)) return false;

        // if (this.looksIncomplete(input)) return true;

        // fallback: last word unfinished
        const lastWord = input.split(" ").pop();
        console.log(lastWord);
        if (lastWord.length >= 3 && lastWord.length < 8) return true;

        return false;
    }

    async generate({ input, conversation = [] }) {
        if (!this.shouldInvokeLLM(input)) {
            return { suggestion: "" };
        }


        const prompt = `
Continue the user's sentence naturally.
The user is typing a message.
Only continue the sentence if it is incomplete.

Rules:
- Do NOT complete finished sentences
- Do NOT repeat input conversation and sentences
- Suggest only if you get the previous context from inputs or past conversation messages
- Continue from the unfinished sentence
- Max 4 words
- No punctuation at the end
- If last word is complete append a space to continue with next word
- Return empty if no continuation is needed

Input:

Conversation:
${conversation.join("\n")}

User input:
"${input}"

Completion:
`.trim();

        const result = await this.llm.complete(prompt);

        return {
            suggestion: result?.[0] || ""
        };
    }
}

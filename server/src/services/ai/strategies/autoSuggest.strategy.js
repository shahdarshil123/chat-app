export class AutoSuggestStrategy {
    constructor(llmAdapter) {
        this.llm = llmAdapter;
    }

    async generate({ input, conversation = [] }) {
        if (!input || input.length < 3) {
            return { suggestion: "" };
        }

        const prompt = `
Continue the user's sentence naturally.

Rules:
- Do NOT repeat the input
- Max 10 words
- No punctuation at the end

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

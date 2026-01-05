export class QuickReplyStrategy {
  constructor(llmAdapter) {
    this.llm = llmAdapter;
  }

  async generate({ lastMessage }) {
    if (!lastMessage) {
      return { replies: [] };
    }

    const prompt = `
Generate 3 short replies to the message below.

Rules:
- Friendly and natural
- Max 8 words each
- No emojis
- One reply per line

Message:
"${lastMessage}"

Replies:
`.trim();

    const replies = await this.llm.complete(prompt);

    return {
      replies: replies.slice(0, 3)
    };
  }
}

import fetch from "node-fetch";
import "dotenv/config";

export class BaseLLM {
    constructor({
        baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
        model = "mistral"
    } = {}) {
        this.baseUrl = baseUrl;
        this.model = model;
    }

    async complete(prompt) {
        if (!prompt) return [];

        try {
            const res = await fetch(`${this.baseUrl}/api/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt,
                    stream: false,
                    options: {
                        num_predict: 15,     // 🔑 LIMIT TOKENS
                        temperature: 0.3,
                        "top_p": 0.9,
                        "repeat_penalty": 1.1
                    }
                })
            });

            if (!res.ok) {
                throw new Error(`LLM HTTP ${res.status}`);
            }

            const data = await res.json();
            return this._normalize(data.response);
        } catch (err) {
            console.error("[BaseLLM]", err.message);
            return [];
        }
    }

    _normalize(text = "") {
        return text
            .split("\n")
            .map(l => l.trim().replace(/^["'“”]+|["'“”]+$/g, ""))
            .filter(Boolean);
    }
}

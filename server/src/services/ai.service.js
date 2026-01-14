// server/src/services/ai/ai.service.js
import fetch from "node-fetch"; // OR use built-in fetch if on Node 18+

export class AIService {
    constructor() {
        // "http://ai-service:8000" acts as the internal Docker URL
        // We use /generate because that is the route defined in your Python main.py
        this.pythonEndpoint = `${process.env.AI_SERVICE_URL}/generate`;
    }

    async generate({ input, conversation = [] }) {
        try {
            if (!input) return { suggestion: "" };
            console.log(`[AIService] Sending request to ${this.pythonEndpoint}...`);

            const response = await fetch(this.pythonEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    input, 
                    conversation 
                })
            });

            if (!response.ok) {
                console.error(`[AIService] Python Error: ${response.status} ${response.statusText}`);
                return { suggestion: "" };
            }

            const data = await response.json();
            return data; // Returns { suggestion: "..." }

        } catch (err) {
            console.error("[AIService] Network Error - Is the Python container running?");
            console.error(err.message);
            return { suggestion: "" }; // Fail gracefully
        }
    }
}
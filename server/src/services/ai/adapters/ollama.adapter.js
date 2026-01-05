import { BaseLLM } from "../llm/baseLLM.js";


export class OllamaAdapter {
    constructor(options = {}) {
        this.llm = new BaseLLM(options);
    }

    async complete(prompt) {
        return this.llm.complete(prompt);
    }
}
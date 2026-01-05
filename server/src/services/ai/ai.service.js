export class AIService {
    constructor(strategy) {
        this.strategy = strategy;
    }

    async generate(context) {
        try {
            return await this.strategy.generate(context);
        } catch (err) {
            console.error("[AIService]", err.message);
            return null;
        }
    }
}

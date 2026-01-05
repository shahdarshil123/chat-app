import express from "express";
import { AIService } from "../../services/ai/ai.service.js";
import { OllamaAdapter } from "../../services/ai/adapters/ollama.adapter.js";
import { AutoSuggestStrategy } from "../../services/ai/strategies/autoSuggest.strategy.js";
import { QuickReplyStrategy } from "../../services/ai/strategies/quickReply.strategy.js";

const router = express.Router();

const llm = new OllamaAdapter({ model: "mistral" });

router.post("/auto-suggest", async (req, res) => {
    console.log(req.body);
    const service = new AIService(
        new AutoSuggestStrategy(llm)
    );
    const response = await service.generate(req.body) || {};
    console.log(response);
    res.json(response);
});

router.post("/quick-replies", async (req, res) => {
    const service = new AIService(
        new QuickReplyStrategy(llm)
    );
    res.json(await service.generate(req.body) || {});
});

export default router;

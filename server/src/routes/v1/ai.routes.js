import express from "express";
import { AIService } from "../../services/ai/ai.service.js";

const router = express.Router();

// Instantiate the service once (it's stateless now)
const aiService = new AIService();

router.post("/auto-suggest", async (req, res) => {
    try {
        const input = req.body.input;
        const conversation = req.body.conversation;

        // Forward the request body { input, conversation } to Python
        const response = await aiService.generate({input, conversation});
        
        // Return the response from Python directly to the frontend
        res.json(response || {});
    } catch (error) {
        console.error("Auto-suggest error:", error);
        res.status(500).json({ error: "AI Service failed" });
    }
});

export default router;

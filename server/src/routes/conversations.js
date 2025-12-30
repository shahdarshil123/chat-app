import express from 'express';
import { getUserConversations, getOrCreateDirectConversation, updateLastConversationReadAt } from "../db/conversations.js";
import { requireAuth } from '../middleware/requireAuth.js';
const router = express.Router();

router.get("/:userId", requireAuth, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const conversations = await getUserConversations(userId);

        res.json({ conversations });

    }
    catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Failed to get conversations' });
    }
});

router.post("/directChat", requireAuth, async (req, res) => {
    try {
        const userId1 = parseInt(req.body.userId1);
        const userId2 = parseInt(req.body.userId2);

        const conversation = await getOrCreateDirectConversation(userId1, userId2);
        res.status(200).json({ conversation });
    }
    catch (error) {
        console.error('Post conversations error:', error);
        res.status(500).json({ error: 'Failed to create conversations' });
    }
});

router.post("/:conversationId/read", requireAuth, async (req, res) => {
    try {
        console.log("SESSION:", req.session);

        const userId = req.session.userId; 
        const conversationId = Number(req.params.conversationId);

        if (!conversationId) {
            return res.status(400).json({ error: "Invalid conversationId" });
        }

        const response = await updateLastConversationReadAt(userId, conversationId);

        return res.status(200).json({
            message: `Conversation: ${conversationId} last read at updated`
        });
    } catch (error) {
        console.error("Failed to update last_read_at:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


export default router;

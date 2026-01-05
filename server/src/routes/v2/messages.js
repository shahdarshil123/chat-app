import express from 'express';
import { getMessageServiceV2, sendMessageService } from '../../services/message.service.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = express.Router();

router.post("/:conversationId/messages", requireAuth, async (req, res) => {
    try {

        if (!req.body.content || req.body.content.trim().length === 0) {
            return res.status(400).json({ error: 'Message content is required' });
        }
        if(!req.params.conversationId){
            return res.status(400).json({ error: 'Conversation Id is required' });
        }
        if(!req.session?.userId){
            return res.status(400).json({ error: 'User Id is required' });
        }

        const conversationId = Number(req.body.conversationId);
        const senderId = req.session?.userId;
        const content = req.body.content;

        const message = await sendMessageService(
            conversationId,
            senderId,
            content,
        );

        res.status(201).json({ message });
    }
    catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

router.get("/:conversationId/messages", requireAuth, async (req, res) => {
    try {

        if (!req.params.conversationId || req.params.conversationId === undefined) {
            res.status(400).json({ error: "conversationId not provided" });
        }

        const conversationId = parseInt(req.params.conversationId)
        const limit = Math.min(Number(req.query.limit) || 20, 50);
        const before = req.query.before || null;
        const after = req.query.after || null;

        const messages = await getMessageServiceV2(
            conversationId,
            limit,
            before,
            after,
        );

        if (!messages) {
            res.status(400).json({ error: 'Failed to get message' });
        }

        res.status(200).json({
            messages,
            hasMore: messages.length === limit,
            oldestCursor: messages[0]?.createdAt || null,
        });

    }
    catch (error) {
        console.error("v2 get messages error:", error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});


export default router;
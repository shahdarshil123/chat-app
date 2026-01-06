import express from 'express';
import { sendMessageService, getMessageServiceV1, deleteMessageService } from '../../services/message.service.js';
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
        const conversationId = parseInt(req.params.conversationId);
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
        const conversationId = Number(req.params.conversationId);

        const messages = await getMessageServiceV1(conversationId);

        if (!messages) {
            res.status(400).json({ error: 'Failed to get message' });
        }
        res.status(200).json({ messages });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

router.delete('/:conversationId/messages/:messageId', requireAuth, async (req, res) => {
    try {
        const conversationId = Number(req.params.conversationId);
        const messageId = Number(req.params.messageId);
        const userId = req.session?.userId;

        if (!conversationId || !messageId) {
            return res.status(400).json({ error: 'conversationId and messageId are required' });
        }

        console.log(`Deleting Message:${messageId}`);
        const deleted = await deleteMessageService(messageId, userId);

        res.status(200).json({ id: deleted.id, conversationId: deleted.conversationId });
    } catch (error) {
        console.error('Delete message error:', error);
        const status = error?.status || 500;
        res.status(status).json({ error: error.message || 'Failed to delete message' });
    }
});


export default router;
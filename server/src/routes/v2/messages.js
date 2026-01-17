import express from 'express';
import { getMessageServiceV2, sendMessageService, checkUserExistsForConversationService } from '../../services/message.service.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { conversationIdParamSchema, sendMessageBodySchema, getMessagesV2QuerySchema } from '../../schemas/messages.schema.js';

const router = express.Router();

router.post("/:conversationId/messages", requireAuth, validate({params: conversationIdParamSchema}), validate({body: sendMessageBodySchema}), async (req, res) => {
    try {

        const conversationId = Number(req.body.conversationId);
        const senderId = req.session?.userId;
        const content = req.body.content;

        const IsSenderMember = await checkUserExistsForConversationService(senderId, conversationId);
        
        if(!IsSenderMember){
            return res.status(403).json({error: `Sender doesn't exist for conversation`});
        }
        
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

router.get("/:conversationId/messages", requireAuth, validate({params: conversationIdParamSchema}), validate({query: getMessagesV2QuerySchema}), async (req, res) => {
    try {

        // if (!req.params.conversationId || req.params.conversationId === undefined) {
        //     res.status(400).json({ error: "conversationId not provided" });
        // }

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
            res.status(404).json({ error: 'Failed to get message' });
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
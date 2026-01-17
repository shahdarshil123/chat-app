import express from 'express';
import { getUserConversationsService, updateLastConversationReadAtService, createConversationService, } from '../../services/conversation.service.js';
import { getUserByIdService } from '../../services/user.service.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { userIdParamSchema, conversationIdParamSchema } from '../../schemas/conversations.schema.js';

const router = express.Router();


router.post("/direct/:userId", requireAuth, validate({ params: userIdParamSchema }), async (req, res) => {
    try {
        const currentUserId = req.session.userId;
        const targetUserId = Number(req.params.userId);

        if (currentUserId === targetUserId) {
            return res.status(400).json({ error: "You cannot start a conversation with yourself" });
        }

        const result = await createConversationService(
            currentUserId,
            targetUserId
        );

        if (!result) {
            return res.status(404).json({ error: "Target user not found" });
        }

        return res.json({
            exists: result.exists,
            conversationId: result.conversation.id,
        });

    } catch (err) {
        if (err.code === 'P2003' || err.code === '23503') {
            return res.status(404).json({ error: "Target user not found" });
        }

        res.status(500).json({ error: "Failed to create conversation" });
    }
});

router.get("/:userId", requireAuth, validate({ params: userIdParamSchema }), async (req, res) => {
    try {
        const sessinonUserId = req.session.userId;
        const userId = req.params.userId;

        if(userId != sessinonUserId){
            res.status(403).json({error: "Cant read conversations"});
        }

        const conversations = await getUserConversationsService(sessinonUserId);

        res.json({ conversations });

    }
    catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Failed to get conversations' });
    }
});


router.patch("/:conversationId/read", requireAuth, validate({ params: conversationIdParamSchema }), async (req, res) => {
    try {

        const userId = req.session.userId;

        const conversationId = parseInt(req.params.conversationId);

        const response = await updateLastConversationReadAtService(userId, conversationId);

        if (!response) {
            return res.status(404).json({ error: `The conversationId: ${conversationId} doesn't exist ` });
        }

        return res.status(200).json({
            message: `Conversation: ${conversationId} last read at updated`
        });
    } catch (error) {
        console.error("Failed to update last_read_at:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


export default router;

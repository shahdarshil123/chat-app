import express from 'express';
import {getUserConversationsService, updateLastConversationReadAtService, createConversationService, } from '../../services/conversation.service.js';
import {getUserByIdService} from '../../services/user.service.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { userIdParamSchema, conversationIdParamSchema } from '../../schemas/conversations.schema.js';

const router = express.Router();


router.post("/direct/:userId", requireAuth, validate({params: userIdParamSchema}), async (req, res) => {
    try {
        const currentUserId = req.session.userId;

        const sourceUser = await getUserByIdService(currentUserId);

        if(!sourceUser){
            return res.status(404).json({error: `Source UserId: ${currentUserId} not valid. `});
        }

        const targetUserId = Number(req.params.userId);

        if (!Number.isInteger(targetUserId)) {
            return res.status(400).json({ error: "Invalid targetUserId" });
        }
        
        const targetUser = await getUserByIdService(targetUserId);
        if(!targetUser){
            return res.status(404).json({error: `UserId: ${targetUserId} not valid. `});
        }


        const result = await createConversationService(
            currentUserId,
            targetUserId
        );

        return res.json({
            exists: result.exists,
            conversationId: result.conversation.id,
        });

    } catch (err) {
        console.error("Create direct conversation error:", err);
        res.status(500).json({ error: "Failed to create conversation" });
    }
});

router.get("/:userId", requireAuth, validate({params: userIdParamSchema}),  async (req, res) => {
    try {
        const userId = req.session.userId;

        const user = await getUserByIdService(userId);
        // console.log(user);
        if(!user){
            return res.status(404).json({error: `UserId: ${userId} not valid. `});
        }

        const conversations = await getUserConversationsService(userId);

        res.json({ conversations });

    }
    catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Failed to get conversations' });
    }
});


router.post("/:conversationId/read", requireAuth, validate({params: conversationIdParamSchema}),  async (req, res) => {
    try {
        console.log("SESSION:", req.session);

        const userId = req.session.userId;

        const user = await getUserByIdService(userId);
        if(!user){
            return res.status(404).json({error: `UserId: ${userId} not valid. `});
        }

        const conversationId = Number(req.params.conversationId);

        if (!conversationId) {
            return res.status(400).json({ error: "Invalid conversationId" });
        }

        const response = await updateLastConversationReadAtService(userId, conversationId);

        if(!response){
            return res.status(404).json({error: `The conversationId: ${conversationId} doesn't exist `});
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

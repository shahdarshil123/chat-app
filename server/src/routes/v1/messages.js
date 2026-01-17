import express from 'express';
import { sendMessageService, getMessageServiceV1, deleteMessageService, checkUserExistsForConversationService, getMessageByIdService } from '../../services/message.service.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { getConversationByIdService } from '../../services/conversation.service.js';
import { getUserByIdService } from '../../services/user.service.js';
import { validate } from '../../middleware/validate.js';
import {conversationIdParamSchema, sendMessageBodySchema, deleteMessageParamSchema} from '../../schemas/messages.schema.js';

const router = express.Router();

router.post("/:conversationId/messages", requireAuth, validate({params: conversationIdParamSchema}), validate({body: sendMessageBodySchema}), async (req, res) => {
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

        const sender = await getUserByIdService(senderId);
        
        if(!sender){
            return res.status(404).json({error: `SenderId: ${senderId} doesn't exist`});
        }

        const conversation = await getConversationByIdService(conversationId);

        if(!conversation){
            return res.status(404).json({error: `ConversationId: ${conversationId} doesn't exist`});
        }

        const senderMember = await checkUserExistsForConversationService(senderId, conversationId);

        if(!senderMember){
            return res.status(404).json({error: `Sender doesn't exist for conversation`});
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

router.get("/:conversationId/messages", requireAuth, validate({params: conversationIdParamSchema}), async (req, res) => {
    try {
        const userId = req.session?.userId;
        
        if(!userId){
            return res.status(401).json({error: `User is not authorized`});
        }

        const user = await getUserByIdService(userId);

        if(!user){
            return res.status(404).json({error: `UserId: ${userId} doesn't exist`});
        }
            
        const conversationId = Number(req.params.conversationId);

        const conversation = await getConversationByIdService(conversationId);

        if(!conversation){
            return res.status(404).json({error: `ConversationId: ${conversationId} doesn't exist`});
        }

        const userMember = await checkUserExistsForConversationService(userId, conversationId);

        if(!userMember){
            return res.status(403).json({error: `Sender doesn't exist for conversation`});
        }

        const messages = await getMessageServiceV1(conversationId);

        if (!messages) {
            res.status(500).json({ error: 'Failed to get message' });
        }
        res.status(200).json({ messages });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

router.delete('/:conversationId/messages/:messageId', requireAuth, validate({params: deleteMessageParamSchema}),  async (req, res) => {
    try {
        const conversationId = Number(req.params.conversationId);
        const messageId = Number(req.params.messageId);
        const userId = req.session?.userId;

        if (!conversationId || !messageId) {
            return res.status(400).json({ error: 'conversationId and messageId are required' });
        }

        const conversation = await getConversationByIdService(conversationId);

        if(!conversation){
            return res.status(404).json({error: `ConversationId: ${conversationId} doesn't exist`});
        }

        const message = await getMessageByIdService(messageId);

        if(!message){
            return res.status(404).json({error: `Message not found`});
        }

        if(message?.conversationId != conversationId){
            return res.status(403).json({error: `MessageId: ${messageId} doesn't belong to the conversationId: ${conversationId}`});
        }

        if(message?.senderId !== userId){
            return res.status(403).json({error: `UserId: ${userId} cannot delete messageId: ${messageId}`});
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
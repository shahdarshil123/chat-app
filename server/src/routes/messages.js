import express from 'express';
import { saveMessage, getMessages } from '../db/messages.js';

const router = express.Router();

router.post("/:conversationId/messages", async (req, res)=>{
    try{
        // const conversationId = parseInt(req.params.conversationId);
        // const {conversationId, senderId, content} = req.body;
        const conversationId = parseInt(req.body.conversationId);
        const senderId = parseInt(req.body.senderId);
        const content = req.body.content;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        const message = await saveMessage({
            conversationId,
            senderId: senderId,
            content,
        });


        res.status(201).json({ message });
    }
    catch(error){
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

router.get("/:conversationId/messages", async (req, res)=>{
    try{
        if(!req.params.conversationId || req.params.conversationId === undefined){
            res.status(400).json({error: "conversationId not provided"});
        }
        const conversationId = parseInt(req.params.conversationId);
        console.log(conversationId);

        const messages = await getMessages(conversationId);

        if(!messages){
            res.status(400).json({ error: 'Failed to get message' });
        }
        res.status(200).json({messages});
    }
    catch(error){
        res.status(500).json({ error: 'Failed to get messages' });
    }
});


export default router;
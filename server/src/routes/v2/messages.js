import express from 'express';
import { saveMessage, getMessagesV2 } from '../../db/messages.js';
import {getConversationMembers} from "../../db/conversations.js";
import { requireAuth } from '../../middleware/requireAuth.js';
import { io, getUserSocketIds } from '../../sockets.js';
import redis from '../../redis/redis.js';

const router = express.Router();

router.post("/:conversationId/messages", requireAuth, async (req, res)=>{
    try{
        const conversationId = Number(req.body.conversationId);
        const senderId = req.session?.userId;
        const content = req.body.content;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        // Save to db
        const message = await saveMessage({
            conversationId,
            senderId: senderId,
            content,
        });
        
        // 2️⃣ Fetch conversation members
        const conversation = await getConversationMembers(conversationId);

        if (!conversation) {
            throw new Error("Conversation not found");
        }

        // 3️⃣ Emit message to ALL members (including sender)
        for (const member of conversation.members) {
            // const sockets = onlineUsers.get(member.userId);
            
            const sockets = await getUserSocketIds(member.userId);

            console.log(sockets);
            if (!sockets) continue; // user offline

            for (const socketId of sockets) {
                io.to(socketId).emit("message:new", {
                    id: message.id,
                    conversationId: message.conversationId,
                    senderId: message.senderId,
                    content: message.content,
                    createdAt: message.createdAt,
                    sender: message.sender,
                });
            }
        }
            res.status(201).json({ message });
    }
    catch(error){
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

router.get("/:conversationId/messages", requireAuth, async (req, res)=>{
    try{
        if(!req.params.conversationId || req.params.conversationId === undefined){
            res.status(400).json({error: "conversationId not provided"});
        }

        const conversationId = parseInt(req.params.conversationId)
        const limit = Math.min(Number(req.query.limit) || 20, 50);
        const before = req.query.before || null;

        const messages = await getMessagesV2({conversationId, limit, before});
        if(!messages){
            res.status(400).json({ error: 'Failed to get message' });
        }

          res.status(200).json({
      messages,
      hasMore: messages.length === limit,
      oldestCursor: messages[0]?.createdAt || null,
    });
    }
    catch(error){
        console.error("v2 get messages error:", error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});


export default router;
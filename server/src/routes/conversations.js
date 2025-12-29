import express from 'express';
import {getUserConversations, getOrCreateDirectConversation} from "../db/conversations.js";

const router = express.Router();

router.get("/:userId", async (req, res)=>{
    try{
        const userId = parseInt(req.params.userId);
        const conversations = await getUserConversations(userId);

        res.json({ conversations });

    }
    catch(error){
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Failed to get conversations' });
    }
});

router.post("/directChat", async (req, res)=>{
    try{
        const userId1 = parseInt(req.body.userId1);
        const userId2 = parseInt(req.body.userId2);

        const conversation = await getOrCreateDirectConversation(userId1, userId2);
        res.status(200).json({conversation});
    }
    catch(error){
        console.error('Post conversations error:', error);
        res.status(500).json({ error: 'Failed to create conversations' });
    }
});

export default router;

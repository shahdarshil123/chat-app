import express from 'express';
import { getUserById } from '../db/users.js';

const router = express.Router();

router.get("/",(req, res)=>{
    try{
        const {q} = req.query;

        if(!q || q.trim().length === 0){
            return res.status(400).json({error: 'Search query required'});
        }
    }
    catch(error){
        console.error("Search users error:", error);
        res.status(500).json({error: 'Search failed'});
    }
});


router.get('/:id', async(req, res)=>{
    try{
        const userId = parseInt(req.params.id);
        const user = await getUserById(userId);
        if (!user){
            return res.status(404).json({
                error: 'User not found'
            });
        }
        res.json({user});
    }
    catch(error){
        console.error('Get user error:', error);
        res.status(500).json({error: 'Failed to get the user'});
    }
});

export default router;
import express from 'express';
import { createUser, getUserByEmail, verifyPassword, updateUserLastSeen} from '../db/users.js';

const router = express.Router();

router.post('/login', async(req, res)=>{
    try{
        const {email, password} =  req.body;

        console.log(email, password);

        if(!email || !password){
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        const user = await getUserByEmail(email);
        console.log(user);
        
        if(!user){
            return res.status(401).json({ error: 'Invalid credentials' });
        }

         // Verify password
        const valid = await verifyPassword(user, password);
        
        if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update status to online
        await updateUserLastSeen(user.id);

        res.json({message: "Valid user credentials"});

    }
    catch(error){
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

export default router;
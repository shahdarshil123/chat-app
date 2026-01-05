import express from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { createUserService, getLastSeenService, getUserByIdService, updateUserLastSeenService } from '../../services/user.service.js';

const router = express.Router();

router.get('/:id', requireAuth, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await getUserByIdService(userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get the user' });
    }
});

router.post("/create", requireAuth, async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        // Validation logic:
        if (!username) {
            console.log("Invalid Username")
            return res.status(400).json({ error: "Invalid Username" });
        }
        if (!email) {
            console.log("Invalid Email")
            return res.status(400).json({ error: "Invalid Email" });
        }
        if (!password) {
            console.log("Invalid Password")
            return res.status(400).json({ error: "Invalid Password" });
        }
        if (!displayName) {
            console.log("Invalid Display Name");
            return res.status(400).json({ error: "Invalid Display Name" });
        }
        
        const user = await createUserService(username, email, password, displayName);
        console.log(user);
        if(!user){
            res.status(500).json({ error: 'Failed to create the user' });
        }
        
        res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get the user' });
    }
});

router.post("/:id/last-seen", requireAuth, async (req, res) => {
    try {
        const userId  = parseInt(req.params.id);

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const updated = await updateUserLastSeenService(userId);

        if(!updated){
            res.status(500).json({ error: 'Failed to create the user' });
        }

        res.json(updated);
    } catch (error) {
        console.error("Update lastSeen error:", error);
        res.status(500).json({ error: "Failed to update lastSeen" });
    }
});

router.get("/:id/last-seen", requireAuth, async (req, res) => {
    try {
        const userId  = parseInt(req.params.id);

        const user = await getLastSeenService(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Get lastSeen error:", error);
        res.status(500).json({ error: "Failed to get lastSeen" });
    }
});

export default router;
import express from 'express';
import {userLoginService} from "../../services/auth.service.js";

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(email, password);

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        const user = await userLoginService(email, password);
        console.log(user);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user.id;

         req.session.save(async (err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Session save failed' });
            }

            // Send response only after session is saved
            res.json({ 
                id: user.id, 
                email: user.email, 
                displayName: user.displayName, 
                lastSeen: user.lastSeen 
            });
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

router.post("/logout", (req, res) => {
    const userId = req.session?.userId;

    req.session.destroy(err => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ error: "Logout failed" });
        }

        // 🔑 FORCE SOCKET DISCONNECT
        // if (userId) {
        //     disconnectUserSockets(userId);
        // }

        // Clear cookie
        res.clearCookie("chat.sid", {
            path: "/",
            sameSite: "lax",
            secure: false,
        });

        res.json({ success: true });
    });
});
router.get("/me", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    res.json({
        id: req.session.userId,
        // optionally fetch full user from DB
    });
});

export default router;
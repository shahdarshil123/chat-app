import express from 'express';
import { createUser, getUserByEmail, verifyPassword, updateUserLastSeen } from '../db/users.js';

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

        const user = await getUserByEmail(email);
        console.log(user);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const valid = await verifyPassword(user, password);

        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user.id;

        // Update status to online
        await updateUserLastSeen(user.id);

        res.json({ id: user.id, email: user.email, displayName: user.displayName, lastSeen: user.lastSeen });

    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

router.post("/logout", (req, res) => {
    // If no session exists, just return success
    if (!req.session) {
        return res.json({ success: true });
    }

    // 1️⃣ Destroy session on SERVER
    req.session.destroy(err => {
        if (err) {
            console.error("Session destroy error:", err);
            return res.status(500).json({ error: "Logout failed" });
        }

        // 2️⃣ Clear cookie on BROWSER
        res.clearCookie("chat.sid", {
            path: "/",          // MUST match session cookie path
            sameSite: "lax",    // MUST match cookie settings
            secure: false,      // true in HTTPS prod
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
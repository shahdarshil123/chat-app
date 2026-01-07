import express from 'express';
import { userLoginService, registerUser } from "../../services/auth.service.js";

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

router.post("/register", async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        // 1️⃣ Validate input
        if (!username || !email || !password) {
            return res.status(400).send("Missing required fields");
        }

        if (password.length < 6) {
            return res.status(400).send("Password must be at least 6 characters");
        }

        // 2️⃣ Register user
        const user = await registerUser({
            username,
            email,
            password,
            displayName,
        });

        // 3️⃣ Create login session (cookie-based)
        req.session.userId = user.id;

        // 4️⃣ Respond with logged-in user
        return res.status(201).json(user);
    } catch (err) {
        if (err.message === "USER_ALREADY_EXISTS") {
            return res
                .status(409)
                .send("User with this email or username already exists");
        }

        console.error("Register error:", err);
        return res.status(500).send("Internal server error");
    }
});

export default router;
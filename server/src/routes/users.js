import express from 'express';
import { checkUserExistsByEmail, checkUserExistsByUsername, createUser, getUserById, updateUserLastSeen, getLastSeen} from '../db/users.js';

const router = express.Router();

router.get("/", (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({ error: 'Search query required' });
        }
    }
    catch (error) {
        console.error("Search users error:", error);
        res.status(500).json({ error: 'Search failed' });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await getUserById(userId);
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

router.post("/create", async (req, res) => {
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

        const emailCheck = await checkUserExistsByEmail(email);

        if (emailCheck) {
            console.log("User with same email already exists");
            return res.status(400).json({ error: `User with email:${email} already exists` });
        }

        const usernameCheck = await checkUserExistsByUsername(username);

        if (usernameCheck) {
            console.log(`User with username:${username} already exists`);
            return res.status(400).json({ error: `User with username:${username} already exists` });
        }

        const data = {
            username, email, password, displayName
        };

        const user = await createUser(data);
        console.log(user);
        res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get the user' });
    }
});

router.post("/:id/last-seen", async (req, res) => {
    try {
        const userId  = parseInt(req.params.id);

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const updated = await updateUserLastSeen(userId);

        res.json(updated);
    } catch (error) {
        console.error("Update lastSeen error:", error);
        res.status(500).json({ error: "Failed to update lastSeen" });
    }
});

router.get("/:id/last-seen", async (req, res) => {
    try {
        const userId  = parseInt(req.params.id);

        const user = await getLastSeen(userId);

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
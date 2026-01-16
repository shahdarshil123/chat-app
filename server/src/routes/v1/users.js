import express from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { createUserService, getLastSeenService, getUserByIdService, searchUsersService, updateUserLastSeenService } from '../../services/user.service.js';
import { validate } from '../../middleware/validate.js';
import { searchUserSchema,createUserSchema, userIdParamSchema } from '../../schemas/users.schema.js';

const router = express.Router();

router.get("/search", requireAuth, validate({ query: searchUserSchema }), async (req, res) => {
    try {
        console.log(req.query);
        
        const {query}  = req.query;
        const currentUserId = req.session?.userId;

        console.log("Running the search API");
        console.log(query);
        console.log(currentUserId);

        if (!currentUserId) {
            return res.status(401).send("Not authenticated");
        }

        if (!query || !query.trim()) {
            return res.json([]);
        }

        const users = await searchUsersService({
            query,
            currentUserId,
            limit: 10,
        });

        console.log(users);

        res.json(users);
    } catch (err) {
        console.error("User search error:", err);
        res.status(500).send("Internal server error");
    }
});

router.post("/create", requireAuth, validate(createUserSchema), async (req, res) => {
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
        if (!user) {
            res.status(500).json({ error: 'Failed to create the user' });
        }

        res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get the user' });
    }
});


router.get('/:id', requireAuth, validate({params: userIdParamSchema}), async (req, res) => {
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


router.post("/:id/last-seen", requireAuth, validate({params: userIdParamSchema}), async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const updated = await updateUserLastSeenService(userId);

        if (!updated) {
            res.status(500).json({ error: 'Failed to create the user' });
        }

        res.json(updated);
    } catch (error) {
        console.error("Update lastSeen error:", error);
        res.status(500).json({ error: "Failed to update lastSeen" });
    }
});

router.get("/:id/last-seen", requireAuth, validate({params: userIdParamSchema}), async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

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
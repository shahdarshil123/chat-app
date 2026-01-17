import express from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { getLastSeenService, getUserByIdService, searchUsersService, updateUserLastSeenService } from '../../services/user.service.js';
import { validate } from '../../middleware/validate.js';
import { searchUserSchema, userIdParamSchema } from '../../schemas/users.schema.js';

const router = express.Router();

router.get("/search", requireAuth, validate({ query: searchUserSchema }), async (req, res) => {
    try {
        
        const {query}  = req.query;
        const currentUserId = req.session?.userId;


        if (!query || !query.trim()) {
            return res.json([]);
        }

        const users = await searchUsersService({
            query,
            currentUserId,
            limit: 10,
        });

        res.json(users);
    } catch (err) {
        console.error("User search error:", err);
        res.status(500).send("Internal server error");
    }
});



router.get('/:id', requireAuth, validate({params: userIdParamSchema}), async (req, res) => {
    try {
        const userId = parseInt(req.params?.id);
        const sessionUserId = req.session?.userId;

        if (userId !== sessionUserId) {
            return res.status(403).json({ error: "You can only get your own details" });
        }

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


router.patch("/:id/last-seen", requireAuth, validate({params: userIdParamSchema}), async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const sessionUserId = req.session?.userId;

        if (userId !== sessionUserId) {
            return res.status(403).json({ error: "You can only update your own status" });
        }

        const updated = await updateUserLastSeenService(userId);

        if (!updated) {
            res.status(404).json({ error: 'User not found' });
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
        const sessionUserId = req.session?.userId;

        if (userId !== sessionUserId) {
            return res.status(403).json({ error: "You can only see your own last seen" });
        }

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
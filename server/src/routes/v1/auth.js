import express from 'express';
import { userLoginService, registerUser, resetPasswordService, forgotPasswordService, getUserService } from "../../services/auth.service.js";
import { verifyEmail } from '../../services/emailVerification.service.js';
import { validate } from '../../middleware/validate.js';
import { loginSchema, registerSchema, resetPasswordSchema, forgotPasswordSchema, verifyEmailSchema} from "../../schemas/auth.schema.js";

const router = express.Router();


router.post('/login', validate({body: loginSchema}), async (req, res) => {
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


router.get("/me", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
    }
    const userId = req.session?.userId;
    const user = await getUserService(userId);

    res.json({
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                lastSeen: user.lastSeen
            });
});

router.post("/register", validate({body: registerSchema}), async (req, res) => {
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

router.post("/reset-password", validate({body: resetPasswordSchema}), async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        console.log(token);
        console.log(newPassword);
        await resetPasswordService({
            token,
            password: newPassword,
        });

        res.json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (err) {
        console.error("Reset password error:", err.message);

        res.status(400).json({
            error: err.message,
        });
    }
});

router.post("/forgot-password", validate({body: forgotPasswordSchema}), async(req, res)=>{
    const email = req.body.email;
    if(!email){
        res.status(400).json({message: "Invalid email"});
    }
    await forgotPasswordService(email);
    res.json({
        message: "If email exists, a reset link has been sent.",
    });
});

router.get("/verify-email", validate({query: verifyEmailSchema}), async(req, res)=>{
    try{
        const {token} = req.query;

        await verifyEmail(token);

        res.status(200).json({
            message: "Email verified successfully"
        });
    }
    catch(err){
        res.status(400).json({
            error: err.message
        });
    }
})

export default router;
import express from "express";
import session from "express-session";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { registerSockets } from "./sockets.js";

//Import Routes
import userRoutes from "./routes/users.js";
import messageRoutes from "./routes/messages.js";
import conversationRoutes from "./routes/conversations.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(
    session({
        name: "chat.sid",
        secret: "dev-secret-key", // move to env later
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: false, // true in HTTPS prod
        },
    })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// API routes
app.use('/api/user', userRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/auth', authRoutes);

const server = http.createServer(app);

app.get("/", (req, res) => {
    res.json({ status: "ok" });
});

registerSockets(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
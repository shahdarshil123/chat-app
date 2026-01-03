import express from "express";
import session from "express-session";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { registerSockets } from "./sockets.js";
import {RedisStore}  from "connect-redis";
import redis from "./redis/redis.js";

//Import Routes
import userRoutes from "./routes/users.js";
import messageRoutes from "./routes/messages.js";
import conversationRoutes from "./routes/conversations.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

const redisStore = new RedisStore({
    client: redis,
    prefix: "sess:",
    ttl: 60*30,
})

export const sessionMiddleware = session({
    // store: redisStore,
    name: "chat.sid",
    secret: "dev-secret-key",
    resave: false,
    saveUninitialized: false,
    rolling: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 1000 * 60 * 30,
    },
});

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(sessionMiddleware);

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
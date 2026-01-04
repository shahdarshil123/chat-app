import express from "express";
import session from "express-session";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { registerSockets } from "./sockets.js";
// import {RedisStore}  from "connect-redis";
import connectRedis from "connect-redis";
import redis from "./redis/redis.js";

import { MESSAGE_API_VERSION_ENUM, AUTH_API_VERSION_ENUM, CONVERSATION_API_VERSION_ENUM, USER_API_VERSION_ENUM} from "./constants/apiVersions.js";
import {DEFAULT_MESSAGE_API_VERSION} from "./config.js";

//Import Routes
import userRoutesV1 from "./routes/v1/users.js";
import messageRoutesV1 from "./routes//v1/messages.js";
import conversationRoutesV1 from "./routes//v1/conversations.js";
import authRoutesV1 from "./routes//v1/auth.js";

import messageRoutesV2 from "./routes/v2/messages.js";



dotenv.config();

const app = express();

const RedisStore = connectRedis(session);

const redisStore = new RedisStore({
    client: redis,
    prefix: "sess:",
})

export const sessionMiddleware = session({
    store: redisStore,
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
//v1
app.use(`/api/${USER_API_VERSION_ENUM.V1}/user`, userRoutesV1);
app.use(`/api/${MESSAGE_API_VERSION_ENUM.V1}/message`, messageRoutesV1);
app.use(`/api/${CONVERSATION_API_VERSION_ENUM.V1}/conversation`, conversationRoutesV1);
app.use(`/api/${AUTH_API_VERSION_ENUM.V1}/auth`, authRoutesV1);

//v2
app.use(`/api/${MESSAGE_API_VERSION_ENUM.V2}/message`, messageRoutesV2);
const server = http.createServer(app);


// app.use("/api/user", userRoutesV1);
// app.use("/api/message", messageRoutesV1);
// app.use("/api/conversation", conversationRoutesV1);
// app.use("/api/auth", authRoutesV1);


app.get("/", (req, res) => {
    res.json({ status: "ok" });
});

registerSockets(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
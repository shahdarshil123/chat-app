import { Server } from "socket.io";
import { updateUserLastSeen } from "./db/users.js";

export const onlineUsers = new Map();

// 🔑 export io (initialized later)
export let io = null;

export function registerSockets(server) {
    console.log("Socket server initialized");

    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("connected:", socket.id);

        socket.on("user:online", async ({ userId }) => {
            if (!userId) return;

            onlineUsers.set(userId, socket.id);
            console.log(`User ${userId} is online`);
        });

        socket.on("conversation:join", (conversationId) => {
            socket.join(conversationId);
            console.log(`Joined conversation ${conversationId}`);
        });

        socket.on("disconnect", async () => {
            const userId = [...onlineUsers.entries()]
                .find(([, sId]) => sId === socket.id)?.[0];

            if (userId) {
                onlineUsers.delete(userId);
                await updateUserLastSeen(userId);
                console.log(`User ${userId} went offline`);
            }

            console.log("Disconnected:", socket.id);
        });
    });

    return io;
}

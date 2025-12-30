import { Server } from "socket.io";
import { updateUserLastSeen } from "./db/users.js";

export const onlineUsers = new Map(); // userId -> socketId
export let io = null;

/**
 * Initialize socket.io and register all handlers
 */
export function registerSockets(server) {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
        },
    });

    console.log("Socket server initialized");

    /**
     * Helper: broadcast online user IDs to all clients
     */
    function broadcastOnlineUsers() {
        if (!io) return;
        io.emit("users:online", Array.from(onlineUsers.keys()));
        console.log("Broadcasting online users:", [...onlineUsers.keys()]);
    }

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        /**
         * User comes online
         */
        socket.on("user:online", async ({ userId }) => {
            console.log("user:online received:", userId);
            if (!userId) return;

            onlineUsers.set(Number(userId), socket.id);
            console.log("onlineUsers map:", [...onlineUsers.keys()]);
            console.log(`User ${userId} is online`);

            broadcastOnlineUsers();
        });

        /**
         * Join a conversation room (optional, future use)
         */
        socket.on("conversation:join", (conversationId) => {
            if (!conversationId) return;
            socket.join(String(conversationId));
            console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
        });

        /**
         * Handle disconnect
         */
        socket.on("disconnect", async () => {
            let disconnectedUserId = null;

            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    onlineUsers.delete(userId);
                    break;
                }
            }

            if (disconnectedUserId) {
                console.log(`User ${disconnectedUserId} went offline`);
                await updateUserLastSeen(disconnectedUserId);
                broadcastOnlineUsers();
            }

            console.log("Socket disconnected:", socket.id);
        });
    });

    return io;
}

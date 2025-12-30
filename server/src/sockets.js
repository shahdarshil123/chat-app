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
   * Broadcast online user IDs to all clients
   */
  function broadcastOnlineUsers() {
    io.emit("users:online", Array.from(onlineUsers.keys()));
    console.log("Broadcasting online users:", [...onlineUsers.keys()]);
  }

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    /**
     * User comes online
     */
    socket.on("user:online", ({ userId }) => {
      if (!userId) return;

      const uid = Number(userId);

      // 🔑 Bind userId to this socket
      socket.data.userId = uid;

      onlineUsers.set(uid, socket.id);
      console.log(`User ${uid} is online`);

      broadcastOnlineUsers();
    });

    /**
     * Handle disconnect (ONLY place offline is handled)
     */
    socket.on("disconnect", async () => {
      const userId = socket.data.userId;

      if (userId) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} went offline`);

        await updateUserLastSeen(userId);
        broadcastOnlineUsers();
      }

      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
}

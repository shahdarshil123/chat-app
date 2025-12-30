import { Server } from "socket.io";
import { updateUserLastSeen } from "./db/users.js";
import { sessionMiddleware } from "./index.js"; 
// 👆 this must be the SAME session middleware used by Express

export const onlineUsers = new Map(); // userId -> Set<socketId>
export let io = null;

export function registerSockets(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true, // 🔑 REQUIRED for cookies
    },
  });

  console.log("Socket server initialized");

  /* ---------------------------------------------------------
     🔑 Attach express-session to Socket.IO
     --------------------------------------------------------- */
  io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
  });

  /* ---------------------------------------------------------
     Helper: broadcast online users
     --------------------------------------------------------- */
  function broadcastOnlineUsers() {
    io.emit("users:online", Array.from(onlineUsers.keys()));
    console.log("Online users:", [...onlineUsers.keys()]);
  }

  /* ---------------------------------------------------------
     Connection handler
     --------------------------------------------------------- */
  io.on("connection", (socket) => {
    const session = socket.request.session;
    const userId = session?.userId;

    // 🔒 Reject unauthenticated sockets
    if (!userId) {
      console.log("Socket rejected (no session):", socket.id);
      socket.disconnect(true);
      return;
    }

    console.log(`Socket connected: ${socket.id} (user ${userId})`);

    socket.data.userId = userId;

    /* -----------------------------------------------------
       Track online users (support multi-tabs)
       ----------------------------------------------------- */
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    broadcastOnlineUsers();

    /* -----------------------------------------------------
       Disconnect handling
       ----------------------------------------------------- */
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id}`);

      const sockets = onlineUsers.get(userId);
      if (!sockets) return;

      sockets.delete(socket.id);

      // If user has no remaining sockets → offline
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        await updateUserLastSeen(userId);
        broadcastOnlineUsers();
        console.log(`User ${userId} is now offline`);
      }
    });
  });

  return io;
}

import { Server } from "socket.io";
import redis from "./redis/redis.js";
import { updateUserLastSeen } from "./db/users.js";
import { sessionMiddleware } from "./index.js";

export let io = null;

export async function getUserSocketIds(userId){
  const sockets = await redis.smembers(`online:user:${userId}`);
  // console.log(sockets);

  return sockets;
    
}

export async function isUserOnline(userId){
  const sockets = await getUserSocketIds(userId);
  return sockets.length > 0;
}

export function registerSockets(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  console.log("✅ Socket.IO server initialized");

  /* ---------------------------------------------------------
     Attach express-session to Socket.IO
     --------------------------------------------------------- */
  io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
  });

  /* ---------------------------------------------------------
     Helper: broadcast online users (Redis-backed)
     --------------------------------------------------------- */
  async function broadcastOnlineUsers() {
    const keys = await redis.keys("online:user:*");
    const userIds = keys.map(k => Number(k.split(":")[2]));
    io.emit("users:online", userIds);
    console.log("🟢 Online users:", userIds);
  }

  /* ---------------------------------------------------------
     Connection handler
     --------------------------------------------------------- */
  io.on("connection", async (socket) => {
    const session = socket.request.session;
    const userId = session?.userId;

    // 🔒 Reject unauthenticated sockets
    if (!userId) {
      console.log("❌ Socket rejected (no session):", socket.id);
      socket.disconnect(true);
      return;
    }

    socket.data.userId = userId;

    const userKey = `online:user:${userId}`;
    const socketKey = `socket:user:${socket.id}`;

    // -------------------------------------------------------
    // Mark user online (Redis)
    // -------------------------------------------------------
    await redis.sadd(userKey, socket.id);
    await redis.set(socketKey, userId, "EX", 60); // reverse mapping
    await redis.expire(userKey, 60);              // TTL safety

    console.log(`🟢 User ${userId} connected via socket ${socket.id}`);

    await broadcastOnlineUsers();

    /* -----------------------------------------------------
       Presence heartbeat (keeps TTL alive)
       ----------------------------------------------------- */
    socket.on("presence:ping", async () => {
      await redis.expire(`online:user:${userId}`, 60);
      await redis.expire(`socket:user:${socket.id}`, 60);
    });

    /* -----------------------------------------------------
       Disconnect handling
       ----------------------------------------------------- */
    socket.on("disconnect", async () => {
      console.log(`🔴 Socket disconnected: ${socket.id}`);

      const storedUserId = await redis.get(socketKey);
      if (!storedUserId) return;

      const storedUserKey = `online:user:${storedUserId}`;

      // Remove socket from user's set
      await redis.srem(storedUserKey, socket.id);
      await redis.del(socketKey);

      const remaining = await redis.scard(storedUserKey);

      // If no sockets left → user offline
      if (remaining === 0) {
        await updateUserLastSeen(Number(storedUserId));
        await broadcastOnlineUsers();
        console.log(`🔴 User ${storedUserId} is now offline`);
      }
    });
  });
}

import { io } from "socket.io-client";

let socket = null;

/**
 * Connect socket using SESSION-BASED AUTH
 * Identity is derived on the SERVER from cookies
 */
export function connectSocket() {
  if (socket) return socket;

  socket = io("http://localhost:4000", {
    withCredentials: true,      // 🔑 send session cookie
    transports: ["websocket"],
    autoConnect: true,
    // reconnection: true,
    // reconnectionAttempts: Infinity,
    // reconnectionDelay: 500,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);

    // Optional: handle auth failure
    if (err.message === "Unauthorized") {
      console.warn("Socket unauthorized — session expired");
    }
  });

  return socket;
}

/**
 * Disconnect socket explicitly (used on logout)
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}

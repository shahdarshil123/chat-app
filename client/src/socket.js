import { io } from "socket.io-client";

let socket = null;

export function connectSocket() {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_API_BASE_URL, {
    withCredentials: true,
    transports: ["websocket"],
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);

    if (err.message === "Unauthorized") {
      console.warn("Socket unauthorized — session expired");
    }
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}

import { io } from "socket.io-client";

let socket = null;

export function connectSocket(userId) {
    if (socket) return socket;

    socket = io("http://localhost:4000", {
        transports: ["websocket"],
        autoConnect: true,
    });

    socket.on("connect", () => {
        console.log("Socket connected:", socket.id);

        // ✅ announce identity (only online is client-driven)
        socket.emit("user:online", { userId });
    });

    socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        // ❌ NO emits here
    });

    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect(); // triggers server-side disconnect
        socket = null;
    }
}

export function getSocket() {
    return socket;
}

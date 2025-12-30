import { io } from "socket.io-client";

let socket = null;

export function connectSocket(userId) {
    // ✅ prevent duplicate connections
    if (socket) return socket;

    socket = io("http://localhost:4000", {
        transports: ["websocket"],
        autoConnect: true,
    });

    socket.on("connect", () => {
        console.log("Socket connected:", socket.id);

        // ✅ always re-emit on connect (including reconnect)
        socket.emit("user:online", { userId });
    });

    socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
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

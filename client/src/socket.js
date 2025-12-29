import { io } from "socket.io-client";

let socket;

export function connectSocket(userId) {
    socket = io("http://localhost:4000", {
        transports: ["websocket"],
    });

    socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
        socket.emit("user:online", { userId });
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

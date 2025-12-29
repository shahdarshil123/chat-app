import {Server} from "socket.io";
import { updateUserLastSeen } from "./db/users.js";

const onlineUsers = new Map();

export function registerSockets(server){
    console.log("Socket server initialized");
    const io = new Server(server,{
    cors:{
        origin: "http://localhost:5173",
        methods: ["GET","POST"]
        }
    });

    io.on("connection", (socket)=>{
        console.log("connected:", socket.id);
        
        socket.on("user:online", async({userId})=>{
            if(!userId) return;

            onlineUsers.set(userId, socket.id);
            console.log(`User ${userId} is online`);

        });

        socket.on("conversation:join", (id)=> {
            console.log(`conversation joined: ${id}`);
            socket.join(id);
        });

        // socket.onAny((event, data) => {
        //     console.log("EVENT RECEIVED:", event, data);
        // });

        socket.on("message:send", (payload)=>{
            console.log(payload);
            const {conversationId, senderId, text} = payload;
            
            console.log(conversationId);
            io.to(conversationId).emit("message:new", {
                id: crypto.randomUUID(),
                conversationId,
                senderId,
                text,
                createdAt: new Date().toISOString()
            });
        });

        socket.on("disconnect", async ()=>{
            const userId = [...onlineUsers.entries()].find(([,sId]) =>sId === socket.id)?.[0];

            if(userId){
                onlineUsers.delete(userId);

                await updateUserLastSeen(userId);

                // socket.broadcast.emit("user:offline", {userId});
            }

            console.log("Disconnected", socket.id);
        });
    });

}

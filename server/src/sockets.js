import {Server} from "socket.io";

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

        socket.on("conversation:join", (id)=> {
            console.log(`conversation joined: ${id}`);
            socket.join(id);
        });

        socket.onAny((event, data) => {
            console.log("EVENT RECEIVED:", event, data);
        });

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

        socket.on("disconnect", ()=>{
            console.log("Disconnected", socket.id);
        });
    });

}

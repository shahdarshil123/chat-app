import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import {registerSockets} from "./sockets.js";

//Import Routes
import userRoutes from "./routes/users.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// API routes
app.use('/api/user', userRoutes);

const server = http.createServer(app);

app.get("/", (req, res)=>{
    res.json({status:"ok"});
});

registerSockets(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, ()=>{
    console.log(`Server running on http://localhost:${PORT}`);
});
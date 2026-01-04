// single Redis connection for entire app
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST || "chat_redis",
  port: 6379,
});

redis.on("connect", ()=>{
    console.log("Redis connected");
});

redis.on("error", (err)=>{
    console.error("Redis error:", err);
});

export default redis; 
// server/src/services/ai/ai.service.js
import fetch from "node-fetch"; // OR use built-in fetch if on Node 18+
class AIService {
    constructor() {
        this.pythonEndpoint = `${process.env.AI_SERVICE_URL}/generate`;
        
        // Circuit Breaker State
        this.nextRetryTime = 0;   // Timestamp: When are we allowed to try again?
        this.cooldown = 60000;    // 60 seconds (How long to wait if it fails)
    }

    async logStatus() {
        const healthUrl = `${process.env.AI_SERVICE_URL}/`;
        console.log(healthUrl);

        try {
            // Set a short 2-second timeout so startup doesn't hang
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2000);

            const res = await fetch(healthUrl, { signal: controller.signal });
            clearTimeout(timeout);

            if (res.ok) {
                console.log(" [AIService] Startup Check: ONLINE");
            } else {
                console.log(` [AIService] Startup Check: Service reachable but returned ${res.status}`);
            }
        } catch (err) {
            console.log(" [AIService] Startup Check: OFFLINE (Is the Python service running?)");
        }
    }

    async generate({ input, conversation = [] } = {}) {
        if (!input) return { suggestion: "" };

        // 1️⃣ CHECK: Is the service currently "marked" as down?
        // If the current time is earlier than the next allowed retry, 
        // return immediately. DO NOT send a network request.
        if (Date.now() < this.nextRetryTime) {
            // Optional: console.log("Skipping AI request (Circuit Open)"); 
            return { suggestion: "" };
        }

        try {
            const response = await fetch(this.pythonEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ input, conversation })
            });

            if (!response.ok) {
                return { suggestion: "" };
            }

            // Success! Reset the circuit so we keep sending requests
            this.nextRetryTime = 0; 
            return await response.json();

        } catch (err) {
            // 2️⃣ TRIP THE CIRCUIT: If connection fails, stop trying for 60s
            if (err.code === "ECONNREFUSED" || err.cause?.code === "ECONNREFUSED") {
                console.warn(`[AIService] Connection failed. Disabling AI for ${this.cooldown / 1000}s.`);
                
                // Set the time in the future when we will allow the next try
                this.nextRetryTime = Date.now() + this.cooldown;
            }
            return { suggestion: "" };
        }
    }
}

const  aiService = new AIService();
export default aiService;
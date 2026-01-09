import { on } from "../eventBus.js";
import { EMAIL_VERIFICATION_ENABLED } from "../../config.js";
import { generateEmailVerificationToken } from "../../services/token.service.js";
import { sendVerificationEmail } from "../../services/email.service.js";

on("USER_CREATED", async({email, userId})=>{
    if(!EMAIL_VERIFICATION_ENABLED) return;

    console.log("📨 USER_CREATED event received:", { userId, email });
    const token = generateEmailVerificationToken({id: userId, email});
    await sendVerificationEmail(email, token);
});

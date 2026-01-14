import {on} from "../eventBus.js";
import { generatePasswordResetToken } from "../../services/token.service.js";
import { sendPasswordResetEmail } from "../../services/email.service.js";

on("PASSWORD_RESET_REQUESTED", async({userId, email})=>{
    try{
        const token = generatePasswordResetToken({id: userId, email});
        if(!token) return;
        await sendPasswordResetEmail(email, token);

        console.log("📧 Password reset email sent:", email);
    }
    catch(err){
        console.error(" password reset email failed");
    }
});

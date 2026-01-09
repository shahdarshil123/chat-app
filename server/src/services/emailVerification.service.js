import { verifyEmailVerificationToken } from "./token.service.js";
import { getUserById, markEmailVerified } from "../db/users.js";

export async function verifyEmail(token){
    const payload = verifyEmailVerificationToken(token);

    if (payload.purpose !== "email_verification"){
        throw new Error("Invalid token purpose");
    }
    const userId = payload.sub;

    const user = await getUserById(userId);

    if(!user){
        throw new Error("user not found");
    }
    return markEmailVerified(user.id);
}
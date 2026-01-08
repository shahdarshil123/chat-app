import { AUTH_API_VERSION_ENUM } from "../constants/apiVersions.js";

export async function sendVerificationEmail(email, token){
    const baseUrl = process.env.APP_URL;

    if(!baseUrl){
        throw new Error("APP_URL is not configured");
    }


    const verificationLink = `${baseUrl}/api/${AUTH_API_VERSION_ENUM.V1}/auth/verify-email?token=${encodeURI(token)}`;

    console.log("Sending email verification");
    console.log("To:", email);
    console.log("Link", verificationLink);

    return true;
}
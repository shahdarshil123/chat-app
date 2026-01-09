import jwt from "jsonwebtoken";
import { jwtConfig } from "../config.js";

export function generateEmailVerificationToken({ id, email }) {
    if (!process.env.EMAIL_TOKEN_SECRET) {
        throw new Error("EMAIL_TOKEN_SECRET is not configured");
    }

    console.log("Generating email verification token");
    const token = jwt.sign({
        sub: id,
        email,
        purpose: "email_verification",
    },
        process.env.EMAIL_TOKEN_SECRET,
        {
            expiresIn: "30m",
            issuer: "chat_app",
            audience: "email-verification"
        }
    );
    console.log("✅ Email verification JWT generated:", token);
    return token;
};

export function verifyEmailVerificationToken(token) {
    if (!token) {
        throw new Error("verification token is missing");
    }

    const config = jwtConfig.emailVerification;

    try {
        return jwt.verify(token, config.secret, {
            issuer: config.issuer,
            audience: config.audience
        });
    }
    catch (err) {
        if (err.name === "TokenExpiredError") {
            throw new Error("Verification token has expired");
        }

        if (err.name === "JsonWebTokenError") {
            throw new Error("Invalid verification token");
        }

        throw err;
    }
}

export function generatePasswordResetToken({id, email}){
    if(!id || !email) return;
    
    const config = jwtConfig.passwordReset;

    return jwt.sign(
        {
            sub: id,
            email,
            purpose: "password_reset",
        },
        config.secret,
        {
            expiresIn: config.expiresIn,
            issuer: config.issuer,
            audience: config.audience,
        }
    );
}

export function verifyPasswordResetToken(token){
    if(!token) return;

    const config = jwtConfig.passwordReset;

    try{
        return jwt.verify(token, config.secret, {
        issuer: config.issuer,
        audience: config.audience,
    });
    }
    catch(err){
        console.log("Error in verifing token: ", err);
        throw new Error("Error: ", err);
    }
    
}
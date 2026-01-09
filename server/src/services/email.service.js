import { AUTH_API_VERSION_ENUM } from "../constants/apiVersions.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendVerificationEmail(email, token) {
    const baseUrl = process.env.APP_URL;

    if (!baseUrl) {
        throw new Error("APP_URL is not configured");
    }


    const verificationLink = `${baseUrl}/api/${AUTH_API_VERSION_ENUM.V1}/auth/verify-email?token=${encodeURI(token)}`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Verify your email",
        html: `
      <h3>Welcome 👋</h3>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>This link expires in 30 minutes.</p>
    `,
    });

    console.log("Sending email verification");
    console.log("To:", email);
    console.log("Link", verificationLink);

    return true;
}

export async function sendPasswordResetEmail(email, token){
    const baseUrl = process.env.CLIENT_APP_URL;
    
    if (!baseUrl) {
        throw new Error("CLIENT_APP_URL is not configured");
    }

    const resetUrl = `${process.env.CLIENT_APP_URL}/?token=${encodeURIComponent(token)}`;

    await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below to set a new password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 15 minutes.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });

}
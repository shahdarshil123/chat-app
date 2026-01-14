import express from 'express';
import { getUserByEmail, verifyPassword, updateUserLastSeen, checkUserExists, updateUserPassword, getUserById } from '../db/users.js';
import bcrypt from "bcrypt";
import { emit } from '../events/eventBus.js';
import { verifyPasswordResetToken } from './token.service.js';

export async function userLoginService(email, password) {
    if (!email || !password) return;

    const user = await getUserByEmail(email);
    if (!user) return;

    const valid = await verifyPassword(user, password);
    if (!valid) return;

    // Update status to online
    await updateUserLastSeen(user.id);

    return user;
};

export async function getUserService(userId){
    if (!userId) return;

    const user = await getUserById(userId);

    if(!user) return;

    return user;
}

export async function registerUser({
    username,
    email,
    password,
    displayName,
}) {
    // 1️⃣ Check if user already exists
    const existingUser = await checkUserExists(email, username);

    if (existingUser) {
        throw new Error("USER_ALREADY_EXISTS");
    }

    // 2️⃣ Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3️⃣ Create user
    const user = await prisma.user.create({
        data: {
            username,
            email,
            passwordHash,
            displayName,
        },
    });

    emit("USER_CREATED", {
        userId: user.id,
        email: user.email,
    });
    // 4️⃣ Return safe user object
    return user;
}

export async function resetPasswordService({
    token,
    password,
}) {
    if (!token || !password) {
        throw new Error("Missing required fields");
    }

    const payload = verifyPasswordResetToken(token);

    if(payload.purpose !== "password_reset"){
        throw new Error("Invalid reset token");
    }

    //const user = await findUserForPasswordReset({ username, email });
    const user = await getUserById(payload.sub);

    if (!user) {
        throw new Error("User not found");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await updateUserPassword(user.id, hashedPassword);

    return {
        success: true,
    };
}

export async function forgotPasswordService(email){
    const user = await getUserByEmail(email);

    if(!user) return;

    emit("PASSWORD_RESET_REQUESTED", {
        userId: user.id,
        email: user.email,
    });
}
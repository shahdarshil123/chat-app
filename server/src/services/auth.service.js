import express from 'express';
import { getUserByEmail, verifyPassword, updateUserLastSeen, checkUserExists } from '../db/users.js';
import bcrypt from "bcrypt";

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

    // 4️⃣ Return safe user object
    return user;
}


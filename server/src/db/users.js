import prisma from "./prisma.js";
import bcrypt from 'bcrypt';

export async function createUser(data) {
    const { username, email, password, displayName } = data;
    const passwordHash = await bcrypt.hash(password, 10);

    return await prisma.user.create({
        data: {
            username: username,
            email: email,
            passwordHash,
            displayName: displayName || username
        },
        select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            status: true,
            createdAt: true,
        },
    });

}

export async function getUserByEmail(email) {
    return await prisma.user.findUnique({
        where: { email },
    });
}

export async function checkUserExistsByEmail(email) {
    const user = await prisma.user.findUnique({
        where: { email: email },
        select: { id: true }
    });
    // console.log(user);
    const check = (user === undefined || user === null) ? false : true;
    return check;
}

export async function checkUserExistsByUsername(username) {
    const user = await prisma.user.findUnique({
        where: { username: username },
        select: { id: true }
    });
    console.log(user);
    const check = (user === undefined || user === null) ? false : true;
    return check;
}

export async function getUserById(id) {
    return await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            status: true,
            lastSeen: true,
            createdAt: true,
        },
    });
}

export async function updateUserLastSeen(userId) {
    if (userId === null || userId === undefined) {
        return null
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            lastSeen: new Date()
        }
    });

    console.log(user);
    return user;

}

export async function getLastSeen(userId) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            lastSeen: true,
        },
    });
}
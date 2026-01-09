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

export async function checkUserExists(email, username) {
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email },
                { username },
            ],
        },
    });

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

export async function verifyPassword(user, password) {
    return await bcrypt.compare(password, user.passwordHash);
}

export async function searchUsers(currentUserId, query, limit) {
    if (!query || !query.trim()) {
        return [];
    }
    return await prisma.user.findMany({
        where: {
            id: {
                not: currentUserId,
            },
            OR: [
                {
                    displayName: {
                        contains: query,
                        mode: "insensitive",
                    },
                },
                {
                    username: {
                        contains: query,
                        mode: "insensitive",
                    },
                },
            ],
        },
        take: limit,
        orderBy: {
            displayName: "asc",
        },
        select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
            status: true,
            lastSeen: true,
        },
    });
}

export async function findUserForPasswordReset({ username, email }) {
    return prisma.user.findFirst({
        where: {
            username,
            email,
        },
    });
}

export async function updateUserPassword(userId, hashedPassword) {
    return prisma.user.update({
        where: { id: userId },
        data: {
            passwordHash: hashedPassword,
            updatedAt: new Date(),
        },
    });
}

export async function markEmailVerified(userId){
    return prisma.user.update({
        where: {id: userId},
        data: {
            emailVerified: true,
            emailVerifiedAt: new Date()
        }
    });
}
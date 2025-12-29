import prisma from "./prisma.js";
import bcrypt from 'bcrypt';

export async function createUser(data){
    const passwordHash = await bcrypt.hash(data.password, 10);

    return await prisma.user.create({
        data:{
            username: data.username,
            email: data.email,
            passwordHash,
            displayName: data.displayName || data.username
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

export async function getUserByEmail(email){
    return await prisma.user.findUnique({
        where: {email},
    });
}

export async function getUserById(id) {
    return await prisma.user.findUnique({
        where: {id},
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
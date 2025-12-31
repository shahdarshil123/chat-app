import prisma from "./prisma.js";
import { io, onlineUsers } from "../sockets.js";

export async function saveMessage(data) {
    const { conversationId, senderId, content } = data;

    if (!conversationId || !senderId || !content) {
        throw new Error("Invalid message payload");
    }

    // 1️⃣ Save message
    const message = await prisma.message.create({
        data: {
            conversationId: Number(conversationId),
            senderId: Number(senderId),
            content,
        },
        include: {
            sender: {
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                },
            },
        },
    });

    // 2️⃣ Fetch conversation members
    const conversation = await prisma.conversation.findUnique({
        where: { id: Number(conversationId) },
        include: {
            members: {
                select: { userId: true },
            },
        },
    });

    if (!conversation) {
        throw new Error("Conversation not found");
    }

    // 3️⃣ Emit message to ALL members (including sender)
    for (const member of conversation.members) {
        const sockets = onlineUsers.get(member.userId);

        if (!sockets) continue; // user offline

        for (const socketId of sockets) {
            io.to(socketId).emit("message:new", {
                id: message.id,
                conversationId: message.conversationId,
                senderId: message.senderId,
                content: message.content,
                createdAt: message.createdAt,
                sender: message.sender,
            });
        }
    }

    return message;
}
export async function getMessages(conversationId) {
    if (conversationId === null || conversationId === undefined) {
        return null;
    }
    const messages = await prisma.message.findMany({
        where: { conversationId: conversationId },
        orderBy: [
            { createdAt: 'asc' },
            { id: 'asc' },
        ],
        include: {
            sender: {
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true
                },
            },
        },
    });

    return messages;
}
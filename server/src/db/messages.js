import prisma from "./prisma.js";
import { io } from "../sockets.js";

export async function saveMessage(data) {
    const { conversationId, senderId, content } = data;

    if (!conversationId || !senderId || !content) {
        throw new Error("Invalid message payload");
    }

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
import prisma from "./prisma.js";
import { onlineUsers } from "../sockets.js";
import { io } from "../sockets.js";

export async function saveMessage(data) {
    const { conversationId, senderId, content } = data;
    if (conversationId === null || conversationId === undefined) {
        return {}
    }
    if (senderId === null || senderId === undefined) {
        return {}
    }
    if (content === null || content === undefined) {
        return {}
    }
    const message = await prisma.message.create({
        data: {
            conversationId: data.conversationId,
            senderId: data.senderId,
            content: data.content,
        },
        include: {
            sender: {
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                }
            }
        }
    });

    // 2️⃣ Fetch conversation members
    const conversation = await prisma.conversation.findUnique({
        where: { id: Number(conversationId) },
        include: { members: true }, // members: [{ userId }]
    });

    if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
    }


    // 3️⃣ Derive ALL recipient userIds (exclude sender)
    const recipientIds = conversation.members
        .map(m => m.userId)
        .filter(userId => userId !== senderId);

    // 4️⃣ Emit socket event to EACH online recipient
    for (const userId of recipientIds) {
        const socketId = onlineUsers.get(userId);
        if (socketId) {
            io.to(socketId).emit("message:new", {
                id: message.id,
                conversationId: message.conversationId,
                senderId: message.senderId,
                content: message.content,
                createdAt: message.createdAt,
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
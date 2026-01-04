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

export async function getMessagesV2({
  conversationId: conversationId,
  limit,
  before,
}) {
  // 🛑 HARD GUARD — prevents full-table scan
  if (!conversationId || Number.isNaN(conversationId)) {
    // throw new Error("Invalid conversationId passed to getMessagesV2");
    return;
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId: Number(conversationId), // ✅ MUST be explicit
      ...(before
        ? {
            createdAt: {
              lt: new Date(before),
            },
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  // Prisma returns newest → oldest, UI needs oldest → newest
  return messages.reverse();
}
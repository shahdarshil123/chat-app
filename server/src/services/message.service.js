import { saveMessage, getMessages, getMessagesV2, getMessageById, deleteMessage } from "../db/messages.js";
import { getConversationMembers, updateConversationUpdateAt } from "../db/conversations.js";
import { io, getUserSocketIds } from '../sockets.js';

export async function sendMessageService(conversationId, senderId, content) {


    // Save to db
    const message = await saveMessage({
        conversationId,
        senderId: senderId,
        content,
    });

    // await updateConversationUpdateAt();

    // 2️⃣ Fetch conversation members
    const conversation = await getConversationMembers(conversationId);

    if (!conversation) {
        throw new Error("Conversation not found");
    }

    // 3️⃣ Emit message to ALL members (including sender)
    for (const member of conversation.members) {
        // const sockets = onlineUsers.get(member.userId);

        const sockets = await getUserSocketIds(member.userId);

        console.log(sockets);
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

            io.to(socketId).emit("conversation:updated", {
                conversationId,
                updatedAt: new Date(),
            });
        }
    }
    return message;
};

async function getMessagesCore({
    conversationId,
    limit,
    before,
    after,
    mode, // "full" | "paginated"
}) {
    if (!conversationId) return;

    if (mode === "full") {
        return getMessages(conversationId);
    }

    const safeLimit = Math.min(Number(limit) || 20, 50);
    return getMessagesV2({
        conversationId,
        limit: safeLimit,
        before,
        after,
    });
}

export async function getMessageServiceV1(conversationId) {
    return getMessagesCore({
        conversationId,
        mode: "full",
    });
}

export async function getMessageServiceV2(
    conversationId,
    limit = 20,
    before = null,
    after = null
) {
    return getMessagesCore({
        conversationId,
        limit,
        before,
        after,
        mode: "paginated",
    });
}

export async function deleteMessageService(messageId, requesterId) {
    const message = await getMessageById(Number(messageId));
    if (!message) {
        const err = new Error("Message not found");
        err.status = 404;
        throw err;
    }

    // Only allow sender to delete their own message for now
    if (Number(message.senderId) !== Number(requesterId)) {
        const err = new Error("Not authorized to delete this message");
        err.status = 403;
        throw err;
    }

    const deleted = await deleteMessage(Number(messageId));

    // Notify conversation members about deletion
    const conversation = await getConversationMembers(deleted.conversationId);
    if (conversation) {
        for (const member of conversation.members) {
            const sockets = await getUserSocketIds(member.userId);
            if (!sockets) continue;
            for (const socketId of sockets) {
                io.to(socketId).emit("message:deleted", {
                    id: deleted.id,
                    conversationId: deleted.conversationId,
                });

                io.to(socketId).emit("conversation:updated", {
                    conversationId: deleted.conversationId,
                    updatedAt: new Date(),
                });
            }
        }
    }

    return deleted;
}